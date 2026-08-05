package com.avanyx.store.data.repository

import android.util.Log
import com.avanyx.store.data.database.AppDatabase
import com.avanyx.store.data.database.entity.*
import com.avanyx.store.firebase.FirestoreService
import com.avanyx.store.firebase.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class FirestoreRepository(
    val firestoreService: FirestoreService = FirestoreService(),
    val appDatabase: AppDatabase
) {
    private val TAG = "FirestoreRepository"

    // 1. Sync Apps from Firestore into Room
    suspend fun syncAppsFromFirestore(): Result<Int> = withContext(Dispatchers.IO) {
        try {
            val remoteAppsRes = firestoreService.getAllApps()
            val remoteApps = remoteAppsRes.getOrDefault(emptyList())
            if (remoteApps.isNotEmpty()) {
                val entities = remoteApps.map { fApp ->
                    StoreAppEntity(
                        id = fApp.id,
                        name = fApp.name,
                        developer = fApp.developer,
                        category = fApp.category,
                        categoryId = fApp.categoryId,
                        iconText = fApp.iconText,
                        iconBgColorHex = fApp.iconBgColorHex,
                        sizeMb = fApp.sizeMb,
                        rating = fApp.rating,
                        isGame = fApp.isGame,
                        isFeatured = fApp.isFeatured,
                        packageName = fApp.packageName,
                        downloadUrl = fApp.downloadUrl,
                        checksumSha256 = fApp.checksumSha256,
                        version = fApp.version,
                        fullDescription = fApp.fullDescription
                    )
                }
                appDatabase.storeAppDao().insertApps(entities)
                Log.d(TAG, "Synced ${entities.size} apps from Firestore into Room DB")
                Result.success(entities.size)
            } else {
                // If remote Firestore is empty, seed Room apps into Firestore!
                val localApps = appDatabase.storeAppDao().getAllAppsList()
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
                        fullDescription = local.fullDescription
                    )
                    firestoreService.saveApp(fApp)
                }
                Result.success(localApps.size)
            }
        } catch (e: Exception) {
            Log.e(TAG, "syncAppsFromFirestore failed", e)
            Result.failure(e)
        }
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
