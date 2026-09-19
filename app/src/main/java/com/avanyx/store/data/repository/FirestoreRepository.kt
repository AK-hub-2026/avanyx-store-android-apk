package com.avanyx.store.data.repository

import android.util.Log
import com.avanyx.store.data.database.AppDatabase
import com.avanyx.store.data.database.entity.*
import com.avanyx.store.firebase.FirestoreService
import com.avanyx.store.firebase.model.*
import com.avanyx.store.network.WebsiteCatalogService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

enum class SyncSource {
    FIRESTORE,
    WEBSITE,
    ROOM_CACHE
}

class FirestoreRepository(
    val firestoreService: FirestoreService = FirestoreService(),
    val websiteCatalogService: WebsiteCatalogService = WebsiteCatalogService(),
    val appDatabase: AppDatabase
) {
    private val TAG = "FirestoreRepository"
    private var realtimeSyncJob: Job? = null

    private val _activeSyncSource = MutableStateFlow(SyncSource.ROOM_CACHE)
    val activeSyncSource: StateFlow<SyncSource> = _activeSyncSource.asStateFlow()

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
                        _activeSyncSource.value = SyncSource.FIRESTORE
                        Log.d("AVANYX_DEBUG", "Active sync source: FIRESTORE")
                        val entities = publishedApps.map { it.toEntity() }
                        val validIds = entities.map { it.id }

                        val existingApps = appDatabase.storeAppDao().getAllAppsList()
                        val existingIds = existingApps.map { it.id }.toSet()
                        if (existingIds.isNotEmpty()) {
                            val newApps = entities.filter { it.id !in existingIds }
                            for (newApp in newApps) {
                                try {
                                    appDatabase.notificationDao().insertNotification(
                                        NotificationEntity(
                                            id = "new_app_${newApp.id}_${System.currentTimeMillis()}",
                                            title = "New App Published",
                                            message = "${newApp.name} by ${newApp.developer} is now available on AVANYX Store!",
                                            timestamp = System.currentTimeMillis(),
                                            isRead = false,
                                            type = "NEW_APP"
                                        )
                                    )
                                } catch (_: Exception) {}
                            }
                        }
                        
                        // Purge Room INITIAL_APPS only after successful Firestore synchronization
                        appDatabase.storeAppDao().deleteAllApps()
                        appDatabase.storeAppDao().insertApps(entities)
                        
                        // Automatically re-run matching engine when Firestore catalog changes
                        com.avanyx.store.manager.InstalledAppsManager.getInstance(appDatabase).matchUpdates()
                        
                        val currentRoomCount = appDatabase.storeAppDao().countApps()
                        val allInRoom = appDatabase.storeAppDao().getAllAppsList()
                        Log.d("AVANYX_DEBUG", "Room apps = ${allInRoom.size}")
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

    private var realtimeWishlistJob: Job? = null
    private var realtimeNotificationJob: Job? = null

    fun startRealtimeWishlistSync(scope: CoroutineScope, userId: String): Job {
        realtimeWishlistJob?.cancel()
        val job = firestoreService.observeWishlist(userId)
            .onEach { wishlistItems ->
                withContext(Dispatchers.IO) {
                    try {
                        for (item in wishlistItems) {
                            if (item.appId.isNotBlank()) {
                                appDatabase.wishlistDao().addToWishlist(WishlistItemEntity(appId = item.appId))
                            }
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error syncing wishlist realtime", e)
                    }
                }
            }
            .launchIn(scope)
        realtimeWishlistJob = job
        return job
    }

    fun startRealtimeNotificationSync(scope: CoroutineScope, userId: String? = null): Job {
        realtimeNotificationJob?.cancel()
        val job = firestoreService.observeNotifications(userId)
            .onEach { notifications ->
                withContext(Dispatchers.IO) {
                    try {
                        if (notifications.isNotEmpty()) {
                            val entities = notifications.map { fn ->
                                NotificationEntity(
                                    id = fn.id.ifBlank { "notif_${System.currentTimeMillis()}" },
                                    title = fn.title,
                                    message = fn.message,
                                    timestamp = if (fn.timestamp > 0) fn.timestamp else System.currentTimeMillis(),
                                    isRead = fn.isRead,
                                    type = fn.type.ifBlank { "SYSTEM" }
                                )
                            }
                            appDatabase.notificationDao().insertNotifications(entities)
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error syncing notifications realtime", e)
                    }
                }
            }
            .launchIn(scope)
        realtimeNotificationJob = job
        return job
    }

    /**
     * Hybrid Triple Sync Pipeline:
     * 1. Primary: Cloud Firestore (Named database with default fallback)
     * 2. Secondary: AVANYX Website Catalog API (JSON endpoint over HTTPS)
     * 3. Offline: Room SQLite Cache (Instant local storage)
     */
    suspend fun syncAppsFromFirestore(): Result<Int> = withContext(Dispatchers.IO) {
        val authUser = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser
        Log.d(TAG, "=== STARTING Hybrid Triple Sync | Auth State: ${if (authUser != null) "User(uid=${authUser.uid}, email=${authUser.email})" else "UNAUTHENTICATED/GUEST"} ===")

        // ==========================================
        // 1. PRIMARY SOURCE: CLOUD FIRESTORE
        // ==========================================
        try {
            Log.d(TAG, "Attempting Source 1: Cloud Firestore...")
            val remoteAppsRes = firestoreService.getAllApps()
            if (remoteAppsRes.isSuccess) {
                val remoteApps = remoteAppsRes.getOrDefault(emptyList())
                val publishedApps = remoteApps.filter { isAppPublished(it.status) }
                Log.d("AVANYX_DEBUG", "Parsed apps = ${publishedApps.size}")
                
                if (publishedApps.isNotEmpty()) {
                    _activeSyncSource.value = SyncSource.FIRESTORE
                    Log.d("AVANYX_DEBUG", "Active sync source: FIRESTORE")
                    Log.i(TAG, "=== [PRIMARY FIRESTORE SUCCESS] ${publishedApps.size} published apps retrieved ===")

                    val entities = publishedApps.map { it.toEntity() }
                    appDatabase.storeAppDao().deleteAllApps()
                    appDatabase.storeAppDao().insertApps(entities)
                    
                    com.avanyx.store.manager.InstalledAppsManager.getInstance(appDatabase).matchUpdates()
                    
                    val allInRoom = appDatabase.storeAppDao().getAllAppsList()
                    Log.d("AVANYX_DEBUG", "Room apps = ${allInRoom.size}")
                    return@withContext Result.success(entities.size)
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Source 1 (Cloud Firestore) failed: ${e.message}", e)
        }

        // ==========================================
        // 2. SECONDARY SOURCE: AVANYX WEBSITE CATALOG API
        // ==========================================
        try {
            Log.d(TAG, "Engaging Source 2: AVANYX Website Catalog API...")
            val websiteRes = websiteCatalogService.fetchCatalogFromWebsite()
            if (websiteRes.isSuccess) {
                val websiteApps = websiteRes.getOrDefault(emptyList())
                if (websiteApps.isNotEmpty()) {
                    _activeSyncSource.value = SyncSource.WEBSITE
                    Log.d("AVANYX_DEBUG", "Active sync source: WEBSITE")
                    Log.d("AVANYX_DEBUG", "Website docs = ${websiteApps.size}")
                    Log.i(TAG, "=== [SECONDARY WEBSITE SUCCESS] ${websiteApps.size} apps retrieved from web catalog ===")

                    appDatabase.storeAppDao().deleteAllApps()
                    appDatabase.storeAppDao().insertApps(websiteApps)
                    
                    com.avanyx.store.manager.InstalledAppsManager.getInstance(appDatabase).matchUpdates()
                    
                    val allInRoom = appDatabase.storeAppDao().getAllAppsList()
                    Log.d("AVANYX_DEBUG", "Room apps = ${allInRoom.size}")

                    // Schedule background retry for primary Firestore source
                    scheduleFirestoreBackgroundRetry()

                    return@withContext Result.success(websiteApps.size)
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Source 2 (Website Catalog API) failed: ${e.message}", e)
        }

        // ==========================================
        // 3. OFFLINE SOURCE: ROOM SQLITE CACHE
        // ==========================================
        _activeSyncSource.value = SyncSource.ROOM_CACHE
        Log.d("AVANYX_DEBUG", "Active sync source: ROOM_CACHE")
        val currentRoomCount = appDatabase.storeAppDao().countApps()
        Log.d("AVANYX_DEBUG", "Room apps = $currentRoomCount")
        Log.i(TAG, "=== [OFFLINE ROOM CACHE ENGAGED] Local SQLite cached apps: $currentRoomCount ===")

        Result.success(currentRoomCount)
    }

    private fun scheduleFirestoreBackgroundRetry() {
        CoroutineScope(Dispatchers.IO).launch {
            delay(15000)
            try {
                Log.d(TAG, "Executing background retry for Primary Firestore source...")
                val res = firestoreService.getAllApps()
                if (res.isSuccess) {
                    val remoteApps = res.getOrDefault(emptyList())
                    val publishedApps = remoteApps.filter { isAppPublished(it.status) }
                    if (publishedApps.isNotEmpty()) {
                        _activeSyncSource.value = SyncSource.FIRESTORE
                        Log.d("AVANYX_DEBUG", "Active sync source: FIRESTORE")
                        val entities = publishedApps.map { it.toEntity() }
                        appDatabase.storeAppDao().deleteAllApps()
                        appDatabase.storeAppDao().insertApps(entities)
                        com.avanyx.store.manager.InstalledAppsManager.getInstance(appDatabase).matchUpdates()
                    }
                }
            } catch (e: Exception) {
                Log.d(TAG, "Background Firestore retry: still using fallback catalog (${e.message})")
            }
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
            iconText = if (iconText.isNotBlank()) iconText else (if (name.length >= 2) name.take(2).uppercase() else "APP"),
            iconBgColorHex = if (iconBgColorHex.isNotBlank()) iconBgColorHex else "#6750A4",
            iconUrl = iconUrl,
            logoUrl = logoUrl,
            developerUid = developerUid,
            screenshotsJson = com.avanyx.store.data.database.Converters().fromListToString(screenshots),
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

    suspend fun syncReviewsForApp(appId: String): Result<List<AppReviewEntity>> = withContext(Dispatchers.IO) {
        try {
            val result = firestoreService.getReviewsForApp(appId)
            if (result.isSuccess) {
                val fReviews = result.getOrDefault(emptyList())
                val entities = fReviews.map { fr ->
                    AppReviewEntity(
                        id = fr.id,
                        appId = fr.appId,
                        userName = fr.authorName.ifBlank { "Verified User" },
                        rating = fr.rating.toFloat(),
                        comment = fr.comment,
                        date = if (fr.timestamp > 0) java.text.SimpleDateFormat("MMM dd, yyyy", java.util.Locale.getDefault()).format(java.util.Date(fr.timestamp)) else "Recent",
                        createdTimestamp = if (fr.timestamp > 0) fr.timestamp else System.currentTimeMillis()
                    )
                }
                if (entities.isNotEmpty()) {
                    appDatabase.appReviewDao().insertReviews(entities)
                }
                Result.success(entities)
            } else {
                Result.failure(result.exceptionOrNull() ?: Exception("Failed to fetch reviews"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "syncReviewsForApp failed", e)
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
