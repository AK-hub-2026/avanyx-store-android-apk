package com.avanyx.store.firebase

import android.util.Log
import com.avanyx.store.firebase.model.*
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

class FirestoreService {
    private val TAG = "FirestoreService"

    val db: FirebaseFirestore
        get() = FirebaseFirestore.getInstance()

    // Collection Names
    companion object {
        private fun safeGetFirestore(): FirebaseFirestore? {
            return try {
                FirebaseFirestore.getInstance()
            } catch (e: Throwable) {
                Log.e("FirestoreService", "FirebaseFirestore.getInstance() error", e)
                null
            }
        }
        const val COLLECTION_USERS = "users"
        const val COLLECTION_DEVELOPERS = "developers"
        const val COLLECTION_ADMINS = "admins"
        const val COLLECTION_APPS = "apps"
        const val COLLECTION_APP_VERSIONS = "app_versions"
        const val COLLECTION_CATEGORIES = "categories"
        const val COLLECTION_REVIEWS = "reviews"
        const val COLLECTION_RATINGS = "ratings"
        const val COLLECTION_WISHLIST = "wishlist"
        const val COLLECTION_DOWNLOADS = "downloads"
        const val COLLECTION_NOTIFICATIONS = "notifications"
        const val COLLECTION_SETTINGS = "settings"
        const val COLLECTION_SEARCH_HISTORY = "search_history"
        const val COLLECTION_FEATURED_BANNERS = "featured_banners"
        const val COLLECTION_UPDATE_HISTORY = "update_history"
    }

    // 1. Users Collection (users/{uid})
    suspend fun createOrUpdateUser(user: FirestoreUser): Result<Unit> {
        return try {
            val userRef = db.collection(COLLECTION_USERS).document(user.uid)
            userRef.set(user, SetOptions.merge()).await()
            Log.d(TAG, "Firestore write success: users/${user.uid} (.set)")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "createOrUpdateUser failed", e)
            Result.failure(e)
        }
    }

    suspend fun getUser(uid: String): Result<FirestoreUser?> {
        return try {
            val snapshot = db.collection(COLLECTION_USERS).document(uid).get().await()
            if (snapshot.exists()) {
                Result.success(snapshot.toObject(FirestoreUser::class.java))
            } else {
                Result.success(null)
            }
        } catch (e: Exception) {
            Log.e(TAG, "getUser failed", e)
            Result.failure(e)
        }
    }

    suspend fun updateUserFields(uid: String, updates: Map<String, Any>): Result<Unit> {
        return try {
            db.collection(COLLECTION_USERS).document(uid).update(updates).await()
            Log.d(TAG, "Firestore write success: users/$uid (.update)")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "updateUserFields failed", e)
            Result.failure(e)
        }
    }

    // 2. Developers Collection
    suspend fun saveDeveloper(developer: FirestoreDeveloper): Result<Unit> {
        return try {
            val docId = if (developer.id.isNotBlank()) developer.id else developer.uid
            db.collection(COLLECTION_DEVELOPERS).document(docId)
                .set(developer, SetOptions.merge()).await()
            Log.d(TAG, "Firestore write success: developers/$docId (.set)")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "saveDeveloper failed", e)
            Result.failure(e)
        }
    }

    suspend fun getDeveloper(id: String): Result<FirestoreDeveloper?> {
        return try {
            val snapshot = db.collection(COLLECTION_DEVELOPERS).document(id).get().await()
            Result.success(snapshot.toObject(FirestoreDeveloper::class.java))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // 3. Admins Collection
    suspend fun saveAdmin(admin: FirestoreAdmin): Result<Unit> {
        return try {
            db.collection(COLLECTION_ADMINS).document(admin.uid)
                .set(admin, SetOptions.merge()).await()
            Log.d(TAG, "Firestore write success: admins/${admin.uid} (.set)")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "saveAdmin failed", e)
            Result.failure(e)
        }
    }

    // 4. Apps Collection
    suspend fun saveApp(app: FirestoreApp): Result<Unit> {
        return try {
            val docId = if (app.id.isNotBlank()) app.id else db.collection(COLLECTION_APPS).document().id
            val appToSave = if (app.id.isBlank()) app.copy(id = docId) else app
            db.collection(COLLECTION_APPS).document(docId).set(appToSave, SetOptions.merge()).await()
            Log.d(TAG, "Firestore write success: apps/$docId (.set)")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "saveApp failed", e)
            Result.failure(e)
        }
    }

    private fun parseFirestoreAppDocument(doc: com.google.firebase.firestore.DocumentSnapshot): FirestoreApp {
        // Attempt standard deserialization first
        val parsedApp = try {
            doc.toObject(FirestoreApp::class.java)
        } catch (e: Exception) {
            Log.w(TAG, "Standard deserialization failed for doc ${doc.id}, using resilient fallback", e)
            null
        }

        val docId = doc.getString("id")?.takeIf { it.isNotBlank() } ?: doc.id
        val name = parsedApp?.name?.takeIf { it.isNotBlank() }
            ?: doc.getString("name")
            ?: doc.getString("title")
            ?: doc.getString("appName")
            ?: docId

        val developer = parsedApp?.developer?.takeIf { it.isNotBlank() }
            ?: doc.getString("developer")
            ?: doc.getString("devName")
            ?: doc.getString("author")
            ?: "AVANYX"

        val category = parsedApp?.category?.takeIf { it.isNotBlank() }
            ?: doc.getString("category")
            ?: doc.getString("categoryName")
            ?: "Utilities"

        val categoryId = parsedApp?.categoryId?.takeIf { it.isNotBlank() }
            ?: doc.getString("categoryId")
            ?: doc.getString("category_id")
            ?: ""

        val iconText = parsedApp?.iconText?.takeIf { it.isNotBlank() }
            ?: doc.getString("iconText")
            ?: doc.getString("icon_text")
            ?: doc.getString("icon")
            ?: name.take(3).uppercase()

        val iconBgColorHex = parsedApp?.iconBgColorHex?.takeIf { it.isNotBlank() }
            ?: doc.getString("iconBgColorHex")
            ?: doc.getString("icon_bg_color_hex")
            ?: "#6750A4"

        val sizeMb = parsedApp?.sizeMb?.takeIf { it.isNotBlank() }
            ?: doc.getString("sizeMb")
            ?: doc.getString("size")
            ?: (doc.get("sizeMb")?.toString() ?: "25 MB")

        val rating = parsedApp?.rating?.takeIf { it > 0.0 }
            ?: doc.getDouble("rating")
            ?: doc.getLong("rating")?.toDouble()
            ?: (doc.getString("rating")?.toDoubleOrNull() ?: 4.9)

        val isGame = parsedApp?.isGame
            ?: doc.getBoolean("isGame")
            ?: doc.getBoolean("is_game")
            ?: false

        val isFeatured = parsedApp?.isFeatured
            ?: doc.getBoolean("isFeatured")
            ?: doc.getBoolean("is_featured")
            ?: false

        val packageName = parsedApp?.packageName?.takeIf { it.isNotBlank() }
            ?: doc.getString("packageName")
            ?: doc.getString("package_name")
            ?: "com.avanyx.$docId"

        val downloadUrl = parsedApp?.downloadUrl?.takeIf { it.isNotBlank() }
            ?: doc.getString("downloadUrl")
            ?: doc.getString("download_url")
            ?: doc.getString("apkUrl")
            ?: ""

        val checksumSha256 = parsedApp?.checksumSha256?.takeIf { it.isNotBlank() }
            ?: doc.getString("checksumSha256")
            ?: doc.getString("checksum_sha256")
            ?: ""

        val version = parsedApp?.version?.takeIf { it.isNotBlank() }
            ?: doc.getString("version")
            ?: doc.getString("versionName")
            ?: "1.0.0"

        val fullDescription = parsedApp?.fullDescription?.takeIf { it.isNotBlank() }
            ?: doc.getString("fullDescription")
            ?: doc.getString("description")
            ?: doc.getString("full_description")
            ?: "Official application from $developer on AVANYX Store."

        val status = (parsedApp?.status?.takeIf { it.isNotBlank() }
            ?: doc.getString("status")
            ?: doc.getString("appStatus")
            ?: "PUBLISHED").trim()

        return FirestoreApp(
            id = docId,
            name = name,
            developer = developer,
            developerUid = parsedApp?.developerUid ?: doc.getString("developerUid") ?: "",
            category = category,
            categoryId = categoryId,
            iconText = iconText,
            iconBgColorHex = iconBgColorHex,
            sizeMb = sizeMb,
            rating = rating,
            isGame = isGame,
            isFeatured = isFeatured,
            packageName = packageName,
            downloadUrl = downloadUrl,
            checksumSha256 = checksumSha256,
            version = version,
            fullDescription = fullDescription,
            features = parsedApp?.features ?: emptyList(),
            status = status
        )
    }

    suspend fun getAllApps(): Result<List<FirestoreApp>> {
        return try {
            val snapshot = db.collection(COLLECTION_APPS).get().await()
            val apps = snapshot.documents.map { doc -> parseFirestoreAppDocument(doc) }
            
            Log.d(TAG, "=== FIRESTORE STARTUP SNAPSHOT AUDIT ===")
            Log.d(TAG, "Firestore Console snapshot document count: ${snapshot.size()}")
            apps.forEachIndexed { index, app ->
                Log.d(TAG, "Doc [$index] -> id='${app.id}', name='${app.name}', status='${app.status}', category='${app.category}', sizeMb='${app.sizeMb}', isGame=${app.isGame}")
            }
            Result.success(apps)
        } catch (e: Exception) {
            Log.w(TAG, "getAllApps Firestore access note: ${e.message}")
            Result.failure(e)
        }
    }

    /**
      * Realtime Snapshot Listener for published apps.
      * Emits updated list whenever changes occur in the Firestore "apps" collection.
      */
    fun observePublishedApps(): Flow<List<FirestoreApp>> = callbackFlow {
        val subscription = db.collection(COLLECTION_APPS)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.w(TAG, "Firestore observePublishedApps listener notice: ${error.message}")
                    return@addSnapshotListener
                }
                if (snapshot != null) {
                    val apps = snapshot.documents.map { doc -> parseFirestoreAppDocument(doc) }
                    Log.d(TAG, "=== FIRESTORE REALTIME SNAPSHOT AUDIT ===")
                    Log.d(TAG, "Firestore Realtime snapshot document count: ${snapshot.size()}")
                    apps.forEachIndexed { index, app ->
                        Log.d(TAG, "Realtime Doc [$index] -> id='${app.id}', name='${app.name}', status='${app.status}', category='${app.category}'")
                    }
                    trySend(apps)
                }
            }
        awaitClose {
            subscription.remove()
        }
    }

    // 5. App Versions Collection
    suspend fun saveAppVersion(version: FirestoreAppVersion): Result<Unit> {
        return try {
            val docId = if (version.id.isNotBlank()) version.id else db.collection(COLLECTION_APP_VERSIONS).document().id
            db.collection(COLLECTION_APP_VERSIONS).document(docId).set(version, SetOptions.merge()).await()
            Log.d(TAG, "Firestore write success: app_versions/$docId (.set)")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "saveAppVersion failed", e)
            Result.failure(e)
        }
    }

    // 6. Categories Collection
    suspend fun saveCategory(category: FirestoreCategory): Result<Unit> {
        return try {
            db.collection(COLLECTION_CATEGORIES).document(category.id).set(category, SetOptions.merge()).await()
            Log.d(TAG, "Firestore write success: categories/${category.id} (.set)")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "saveCategory failed", e)
            Result.failure(e)
        }
    }

    // 7. Reviews Collection
    suspend fun saveReview(review: FirestoreReview): Result<Unit> {
        return try {
            val docRef = if (review.id.isNotBlank()) {
                db.collection(COLLECTION_REVIEWS).document(review.id)
            } else {
                db.collection(COLLECTION_REVIEWS).document()
            }
            val finalReview = review.copy(id = docRef.id)
            docRef.set(finalReview, SetOptions.merge()).await()
            Log.d(TAG, "Firestore write success: reviews/${docRef.id} (.set)")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "saveReview failed", e)
            Result.failure(e)
        }
    }

    suspend fun getReviewsForApp(appId: String): Result<List<FirestoreReview>> {
        return try {
            val snapshot = db.collection(COLLECTION_REVIEWS)
                .whereEqualTo("appId", appId)
                .get().await()
            Result.success(snapshot.toObjects(FirestoreReview::class.java))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // 8. Ratings Collection
    suspend fun saveRating(rating: FirestoreRating): Result<Unit> {
        return try {
            val docRef = db.collection(COLLECTION_RATINGS).document("${rating.appId}_${rating.userId}")
            docRef.set(rating, SetOptions.merge()).await()
            Log.d(TAG, "Firestore write success: ratings/${docRef.id} (.set)")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "saveRating failed", e)
            Result.failure(e)
        }
    }

    // 9. Wishlist Collection
    suspend fun saveWishlistItem(wishlist: FirestoreWishlistItem): Result<Unit> {
        return try {
            val docId = if (wishlist.id.isNotBlank()) wishlist.id else "${wishlist.userId}_${wishlist.appId}"
            val finalItem = wishlist.copy(id = docId)
            db.collection(COLLECTION_WISHLIST).document(docId).set(finalItem, SetOptions.merge()).await()
            Log.d(TAG, "Firestore write success: wishlist/$docId (.set)")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "saveWishlistItem failed", e)
            Result.failure(e)
        }
    }

    suspend fun removeWishlistItem(userId: String, appId: String): Result<Unit> {
        return try {
            val docId = "${userId}_$appId"
            db.collection(COLLECTION_WISHLIST).document(docId).delete().await()
            Log.d(TAG, "Firestore write success: wishlist/$docId (.delete)")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "removeWishlistItem failed", e)
            Result.failure(e)
        }
    }

    // 10. Downloads Collection
    suspend fun saveDownload(download: FirestoreDownload): Result<Unit> {
        return try {
            val docRef = db.collection(COLLECTION_DOWNLOADS).document()
            val finalDownload = download.copy(id = docRef.id)
            docRef.set(finalDownload, SetOptions.merge()).await()
            Log.d(TAG, "Firestore write success: downloads/${docRef.id} (.set)")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "saveDownload failed", e)
            Result.failure(e)
        }
    }

    // 11. Notifications Collection
    suspend fun saveNotification(notification: FirestoreNotification): Result<Unit> {
        return try {
            val docRef = if (notification.id.isNotBlank()) {
                db.collection(COLLECTION_NOTIFICATIONS).document(notification.id)
            } else {
                db.collection(COLLECTION_NOTIFICATIONS).document()
            }
            val finalNotif = notification.copy(id = docRef.id)
            docRef.set(finalNotif, SetOptions.merge()).await()
            Log.d(TAG, "Firestore write success: notifications/${docRef.id} (.set)")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "saveNotification failed", e)
            Result.failure(e)
        }
    }

    // 12. Settings Collection
    suspend fun saveSettings(settings: FirestoreSettings): Result<Unit> {
        return try {
            db.collection(COLLECTION_SETTINGS).document(settings.userId)
                .set(settings, SetOptions.merge()).await()
            Log.d(TAG, "Firestore write success: settings/${settings.userId} (.set)")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "saveSettings failed", e)
            Result.failure(e)
        }
    }

    // 13. Search History Collection
    suspend fun saveSearchHistory(search: FirestoreSearchHistory): Result<Unit> {
        return try {
            val docRef = db.collection(COLLECTION_SEARCH_HISTORY).document()
            val finalSearch = search.copy(id = docRef.id)
            docRef.set(finalSearch, SetOptions.merge()).await()
            Log.d(TAG, "Firestore write success: search_history/${docRef.id} (.set)")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "saveSearchHistory failed", e)
            Result.failure(e)
        }
    }

    // 14. Featured Banners Collection
    suspend fun saveFeaturedBanner(banner: FirestoreFeaturedBanner): Result<Unit> {
        return try {
            val docId = if (banner.id.isNotBlank()) banner.id else db.collection(COLLECTION_FEATURED_BANNERS).document().id
            val finalBanner = banner.copy(id = docId)
            db.collection(COLLECTION_FEATURED_BANNERS).document(docId).set(finalBanner, SetOptions.merge()).await()
            Log.d(TAG, "Firestore write success: featured_banners/$docId (.set)")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "saveFeaturedBanner failed", e)
            Result.failure(e)
        }
    }

    // 15. Update History Collection
    suspend fun saveUpdateHistory(update: FirestoreUpdateHistory): Result<Unit> {
        return try {
            val docRef = db.collection(COLLECTION_UPDATE_HISTORY).document()
            val finalUpdate = update.copy(id = docRef.id)
            docRef.set(finalUpdate, SetOptions.merge()).await()
            Log.d(TAG, "Firestore write success: update_history/${docRef.id} (.set)")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "saveUpdateHistory failed", e)
            Result.failure(e)
        }
    }
}
