package com.avanyx.store.data.repository

import android.util.Log
import com.avanyx.store.data.database.AppDatabase
import com.avanyx.store.data.database.entity.*
import com.avanyx.store.firebase.FirestoreService
import com.avanyx.store.firebase.model.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.withContext

class FirestoreRepository(
    val firestoreService: FirestoreService = FirestoreService(),
    val appDatabase: AppDatabase
) {
    private val TAG = "FirestoreRepository"
    private var realtimeSyncJob: Job? = null

    private fun isAppPublished(status: String): Boolean {
        val clean = status.trim().uppercase()
        return when (clean) {
            "REJECTED", "DRAFT", "SUSPENDED", "DELETED", "INACTIVE", "PENDING_REVIEW", "UNPUBLISHED" -> false
            else -> true // Covers PUBLISHED, published, APPROVED, approved, ACTIVE, active, LIVE, or blank
        }
    }

    /**
     * Starts listening to Firestore changes in real-time.
     * Whenever an app is published, updated, suspended, or deleted on the website/console:
     * 1. Upserts published apps into "store_apps".
     * 2. Purges stale/ghost/suspended/rejected apps from "store_apps" while strictly preserving
     *    installed apps ("installed_apps"), download history, and wishlist.
     */
    fun startRealtimeAppSync(scope: CoroutineScope): Job {
        realtimeSyncJob?.cancel()
        val job = firestoreService.observePublishedApps()
            .onEach { remoteApps ->
                withContext(Dispatchers.IO) {
                    val publishedApps = remoteApps.filter { isAppPublished(it.status) }
                    Log.d(TAG, "=== [REALTIME SYNC] Firestore Total: ${remoteApps.size} | Published: ${publishedApps.size} ===")
                    
                    remoteApps.forEach { app ->
                        val isPub = isAppPublished(app.status)
                        Log.d(TAG, "Remote App Evaluation -> id='${app.id}', name='${app.name}', status='${app.status}', category='${app.category}', isPublished=$isPub")
                    }

                    if (publishedApps.isNotEmpty()) {
                        val entities = publishedApps.map { it.toEntity() }
                        val validIds = entities.map { it.id }
                        
                        appDatabase.storeAppDao().insertApps(entities)
                        appDatabase.storeAppDao().deleteAppsNotInList(validIds)
                        
                        // Automatically re-run matching engine when Firestore catalog changes
                        com.avanyx.store.manager.InstalledAppsManager.getInstance(appDatabase).matchUpdates()
                        
                        val currentRoomCount = appDatabase.storeAppDao().countApps()
                        val allInRoom = appDatabase.storeAppDao().getAllAppsList()
                        val hasAvanyxStore = allInRoom.any { 
                            it.name.contains("AVANYX Store", ignoreCase = true) || it.id.contains("avanyx", ignoreCase = true) 
                        }
                        Log.d(TAG, "=== [REALTIME SYNC] Room App Count: $currentRoomCount | 'AVANYX Store' in Room: $hasAvanyxStore ===")
                    } else if (remoteApps.isEmpty()) {
                        Log.d(TAG, "Realtime sync: 0 published apps received")
                    }
                }
            }
            .launchIn(scope)
        realtimeSyncJob = job
        return job
    }

    // 1. Sync Apps from Firestore into Room (Immediate on-launch sync with reconciliation)
    suspend fun syncAppsFromFirestore(): Result<Int> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "=== STARTING syncAppsFromFirestore() ===")
            val remoteAppsRes = firestoreService.getAllApps()
            
            if (remoteAppsRes.isFailure) {
                val error = remoteAppsRes.exceptionOrNull()
                Log.w(TAG, "Firestore sync skipped or failed (${error?.message}). Preserving local Room cache.", error)
                val currentRoomCount = appDatabase.storeAppDao().countApps()
                Log.d(TAG, "=== Room store_apps Current Local Count: $currentRoomCount ===")
                return@withContext Result.failure(error ?: Exception("Firestore fetch failed"))
            }

            val remoteApps = remoteAppsRes.getOrDefault(emptyList())
            Log.d(TAG, "=== Firestore Total Apps Count: ${remoteApps.size} ===")
            
            val publishedApps = remoteApps.filter { isAppPublished(it.status) }
            Log.d(TAG, "=== Firestore Published Apps Count: ${publishedApps.size} ===")
            
            remoteApps.forEach { app ->
                val isPub = isAppPublished(app.status)
                Log.d(TAG, "Startup Sync Doc -> id='${app.id}', name='${app.name}', status='${app.status}', category='${app.category}', isPublished=$isPub")
            }
            
            if (publishedApps.isNotEmpty()) {
                val entities = publishedApps.map { it.toEntity() }
                val validIds = entities.map { it.id }
                
                // Clear stale store_apps cache and repopulate cleanly from Firestore
                appDatabase.storeAppDao().deleteAllApps()
                appDatabase.storeAppDao().insertApps(entities)
                
                // Re-run matching engine with refreshed catalog
                com.avanyx.store.manager.InstalledAppsManager.getInstance(appDatabase).matchUpdates()
                
                val currentRoomCount = appDatabase.storeAppDao().countApps()
                val allInRoom = appDatabase.storeAppDao().getAllAppsList()
                val hasAvanyxStore = allInRoom.any { 
                    it.name.contains("AVANYX Store", ignoreCase = true) || it.id.contains("avanyx", ignoreCase = true) 
                }
                
                Log.d(TAG, "=== Room store_apps Total Count: $currentRoomCount ===")
                Log.d(TAG, "=== 'AVANYX Store' Present In Room SQLite: $hasAvanyxStore ===")
                allInRoom.forEach { app ->
                    Log.d(TAG, " -> Room App: ${app.name} [id=${app.id}, category=${app.category}, categoryId=${app.categoryId}, isGame=${app.isGame}, isFeatured=${app.isFeatured}]")
                }
                
                Result.success(entities.size)
            } else if (remoteApps.isNotEmpty()) {
                val entities = remoteApps.map { it.toEntity() }
                appDatabase.storeAppDao().deleteAllApps()
                appDatabase.storeAppDao().insertApps(entities)
                
                val currentRoomCount = appDatabase.storeAppDao().countApps()
                Log.d(TAG, "=== Room store_apps Total Count: $currentRoomCount ===")
                Result.success(entities.size)
            } else {
                // If remote Firestore is genuinely empty and user is authorized, seed initial apps
                val localApps = appDatabase.storeAppDao().getAllAppsList()
                val currentUser = try { com.google.firebase.auth.FirebaseAuth.getInstance().currentUser } catch (e: Throwable) { null }
                if (currentUser != null) {
                    Log.d(TAG, "Remote Firestore empty. Authenticated user ${currentUser.uid} seeding ${localApps.size} local apps...")
                    localApps.forEach { local ->
                        val fApp = FirestoreApp(
                            id = local.id,
                            name = local.name,
                            developer = local.developer,
                            category = local.category,
                            categoryId = local.categoryId,
                            iconText = local.iconText,
                            iconBgColorHex = local.iconBgColorHex,
                            sizeMb = local.sizeMb,
                            rating = local.rating,
                            isGame = local.isGame,
                            isFeatured = local.isFeatured,
                            packageName = local.packageName,
                            downloadUrl = local.downloadUrl,
                            checksumSha256 = local.checksumSha256,
                            version = local.version,
                            fullDescription = local.fullDescription,
                            status = "PUBLISHED"
                        )
                        firestoreService.saveApp(fApp)
                    }
                } else {
                    Log.d(TAG, "Remote Firestore empty and no authenticated admin. Retaining ${localApps.size} local Room apps.")
                }
                Result.success(localApps.size)
            }
        } catch (e: Exception) {
            Log.e(TAG, "syncAppsFromFirestore failed", e)
            Result.failure(e)
        }
    }

    private fun FirestoreApp.toEntity(): StoreAppEntity {
        val finalId = if (id.isNotBlank()) id else name.lowercase().replace("[^a-z0-9_]".toRegex(), "_").trim('_')
        val finalCat = when {
            category.isNotBlank() -> category.trim()
            isGame -> "Casual"
            else -> "Tools & Utilities"
        }
        val finalCatId = when {
            categoryId.isNotBlank() -> categoryId.trim().lowercase()
            finalCat.contains("Tools", ignoreCase = true) || finalCat.contains("Utility", ignoreCase = true) || finalCat.contains("Utilities", ignoreCase = true) -> "tools"
            finalCat.contains("Productivity", ignoreCase = true) -> "productivity"
            finalCat.contains("Entertainment", ignoreCase = true) -> "entertainment"
            finalCat.contains("Education", ignoreCase = true) -> "education"
            finalCat.contains("Casual", ignoreCase = true) -> "casual"
            finalCat.contains("Action", ignoreCase = true) -> "action"
            finalCat.contains("Racing", ignoreCase = true) -> "racing"
            finalCat.contains("Arcade", ignoreCase = true) -> "arcade"
            isGame -> "casual"
            else -> "tools"
        }
        return StoreAppEntity(
            id = if (finalId.isNotBlank()) finalId else "app_${System.currentTimeMillis()}",
            name = if (name.isNotBlank()) name else "AVANYX Application",
            developer = if (developer.isNotBlank()) developer else "AVANYX",
            category = finalCat,
            categoryId = finalCatId,
            iconText = if (iconText.isNotBlank()) iconText else (if (name.length >= 2) name.take(3).uppercase() else "AVX"),
            iconBgColorHex = if (iconBgColorHex.isNotBlank()) iconBgColorHex else "#6750A4",
            sizeMb = if (sizeMb.isNotBlank()) (if (sizeMb.contains("MB", ignoreCase = true) || sizeMb.contains("GB", ignoreCase = true) || sizeMb.contains("KB", ignoreCase = true)) sizeMb else "$sizeMb MB") else "25 MB",
            rating = if (rating > 0.0) rating else 4.9,
            isGame = isGame,
            isFeatured = isFeatured,
            packageName = if (packageName.isNotBlank()) packageName else "com.avanyx.${if (finalId.isNotBlank()) finalId else "app"}",
            downloadUrl = downloadUrl,
            checksumSha256 = checksumSha256,
            version = if (version.isNotBlank()) version else "1.0.0",
            versionCode = if (versionCode > 0L) versionCode else 1L,
            changelog = changelog,
            fullDescription = if (fullDescription.isNotBlank()) fullDescription else "Official application from $developer on AVANYX Store."
        )
    }

    // 2. Publish App to Firestore + Room (for Developers/Admins)
    suspend fun publishApp(app: StoreAppEntity, devUid: String = ""): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            // Write to Room first (Offline-first)
            appDatabase.storeAppDao().insertApp(app)
            
            // Sync to Firestore
            val fApp = FirestoreApp(
                id = app.id,
                name = app.name,
                developer = app.developer,
                developerUid = devUid,
                category = app.category,
                categoryId = app.categoryId,
                iconText = app.iconText,
                iconBgColorHex = app.iconBgColorHex,
                sizeMb = app.sizeMb,
                rating = app.rating,
                isGame = app.isGame,
                isFeatured = app.isFeatured,
                packageName = app.packageName,
                downloadUrl = app.downloadUrl,
                checksumSha256 = app.checksumSha256,
                version = app.version,
                versionCode = app.versionCode,
                changelog = app.changelog,
                fullDescription = app.fullDescription,
                status = "PUBLISHED"
            )
            firestoreService.saveApp(fApp)
        } catch (e: Exception) {
            Log.e(TAG, "publishApp failed", e)
            Result.failure(e)
        }
    }

    // 3. Save Review (Room -> Firestore)
    suspend fun submitReview(review: AppReviewEntity, userId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            appDatabase.appReviewDao().insertReviews(listOf(review))
            val fReview = FirestoreReview(
                id = review.id,
                appId = review.appId,
                userId = userId,
                authorName = review.userName,
                authorAvatarUrl = "",
                rating = review.rating.toInt(),
                comment = review.comment,
                timestamp = review.createdTimestamp,
                developerReply = "",
                developerReplyTimestamp = 0L,
                likes = 0,
                verifiedInstall = true
            )
            firestoreService.saveReview(fReview)
        } catch (e: Exception) {
            Log.e(TAG, "submitReview failed", e)
            Result.failure(e)
        }
    }

    // 4. Wishlist Sync
    suspend fun addToWishlist(userId: String, appId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val item = WishlistItemEntity(appId = appId)
            appDatabase.wishlistDao().addToWishlist(item)
            val fWishlist = FirestoreWishlistItem(id = "${userId}_$appId", userId = userId, appId = appId)
            firestoreService.saveWishlistItem(fWishlist)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun removeFromWishlist(userId: String, appId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            appDatabase.wishlistDao().removeFromWishlist(appId)
            firestoreService.removeWishlistItem(userId, appId)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // 5. Download History Sync
    suspend fun recordDownload(userId: String, appId: String, appName: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val history = DownloadHistoryEntity(
                appId = appId,
                packageName = "com.avanyx.app",
                version = "1.0.0",
                sizeBytes = 0L,
                status = "COMPLETED",
                checksumSha256 = "",
                installStatus = "INSTALLED"
            )
            appDatabase.downloadHistoryDao().insertHistory(history)
            val fDownload = FirestoreDownload(userId = userId, appId = appId, appName = appName)
            firestoreService.saveDownload(fDownload)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // 6. Sync User Settings
    suspend fun saveSettings(userId: String, settings: UserSettingsEntity): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            appDatabase.userSettingsDao().updateSettings(settings)
            val fSettings = FirestoreSettings(
                userId = userId,
                isDarkMode = settings.isDarkMode,
                wifiOnlyDownloads = settings.wifiOnlyDownloads,
                notificationsEnabled = settings.notificationsEnabled,
                autoUpdateApps = settings.autoUpdateApps,
                language = settings.language
            )
            firestoreService.saveSettings(fSettings)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun nameFallback(name: String) = if (name.isBlank()) "App" else name
}
