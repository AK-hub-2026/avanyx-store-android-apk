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
        get() = verifiedDb ?: getNamedFirestore() ?: getDefaultFirestore()

    // Collection Names
    companion object {
        const val DATABASE_ID = "(default)"
        @Volatile
        private var verifiedDb: FirebaseFirestore? = null

        fun getNamedFirestore(): FirebaseFirestore? {
            return try {
                FirebaseFirestore.getInstance()
            } catch (e: Throwable) {
                Log.w("FirestoreService", "Cannot instantiate Firestore: ${e.message}")
                null
            }
        }

        fun getDefaultFirestore(): FirebaseFirestore {
            return FirebaseFirestore.getInstance()
        }

        fun safeGetFirestore(): FirebaseFirestore? {
            return verifiedDb ?: getNamedFirestore() ?: getDefaultFirestore()
        }

        fun markDatabaseVerified(database: FirebaseFirestore) {
            verifiedDb = database
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
        return getDeveloperProfile(id)
    }

    suspend fun getDeveloperProfile(idOrUidOrSlug: String): Result<FirestoreDeveloper?> {
        return try {
            val db = safeGetFirestore() ?: getDefaultFirestore()
            val lookup = idOrUidOrSlug.trim()
            if (lookup.isBlank()) return Result.success(null)

            // 1. Direct document lookup in developers collection
            try {
                val directSnap = db.collection(COLLECTION_DEVELOPERS).document(lookup).get().await()
                if (directSnap.exists()) {
                    return Result.success(parseFirestoreDeveloperDocument(directSnap))
                }
            } catch (e: Exception) {
                Log.w(TAG, "Direct dev lookup failed: ${e.message}")
            }

            // 2. Query by developerUid
            val uidSnap = db.collection(COLLECTION_DEVELOPERS)
                .whereEqualTo("developerUid", lookup)
                .limit(1)
                .get().await()
            if (!uidSnap.isEmpty) {
                return Result.success(parseFirestoreDeveloperDocument(uidSnap.documents[0]))
            }

            // 3. Query by developerSlug
            val slugSnap = db.collection(COLLECTION_DEVELOPERS)
                .whereEqualTo("developerSlug", lookup.lowercase())
                .limit(1)
                .get().await()
            if (!slugSnap.isEmpty) {
                return Result.success(parseFirestoreDeveloperDocument(slugSnap.documents[0]))
            }

            // 4. Query by publicDeveloperId
            val pubSnap = db.collection(COLLECTION_DEVELOPERS)
                .whereEqualTo("publicDeveloperId", lookup)
                .limit(1)
                .get().await()
            if (!pubSnap.isEmpty) {
                return Result.success(parseFirestoreDeveloperDocument(pubSnap.documents[0]))
            }

            // 5. Query by displayName
            val nameSnap = db.collection(COLLECTION_DEVELOPERS)
                .whereEqualTo("displayName", lookup)
                .limit(1)
                .get().await()
            if (!nameSnap.isEmpty) {
                return Result.success(parseFirestoreDeveloperDocument(nameSnap.documents[0]))
            }

            // 6. Query by organizationName
            val orgSnap = db.collection(COLLECTION_DEVELOPERS)
                .whereEqualTo("organizationName", lookup)
                .limit(1)
                .get().await()
            if (!orgSnap.isEmpty) {
                return Result.success(parseFirestoreDeveloperDocument(orgSnap.documents[0]))
            }

            // 7. General fallback for AVANYX official developer
            if (lookup.contains("avanyx", ignoreCase = true) || lookup.contains("alok", ignoreCase = true) || lookup == "dev_avanyx") {
                val allDevs = db.collection(COLLECTION_DEVELOPERS).limit(5).get().await()
                if (!allDevs.isEmpty) {
                    val found = allDevs.documents.firstOrNull {
                        it.safeString("displayName", "developerSlug", "organizationName")?.contains("avanyx", ignoreCase = true) == true
                    } ?: allDevs.documents[0]
                    return Result.success(parseFirestoreDeveloperDocument(found))
                }
            }

            Result.success(null)
        } catch (e: Exception) {
            Log.e(TAG, "getDeveloperProfile failed for $idOrUidOrSlug", e)
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

    private fun com.google.firebase.firestore.DocumentSnapshot.safeString(vararg keys: String): String? {
        for (k in keys) {
            val raw = try { get(k) } catch (e: Throwable) { null }
            if (raw != null) {
                val str = raw.toString().trim()
                if (str.isNotBlank() && str != "null") return str
            }
        }
        return null
    }

    private fun com.google.firebase.firestore.DocumentSnapshot.safeBoolean(vararg keys: String, def: Boolean = false): Boolean {
        for (k in keys) {
            val raw = try { get(k) } catch (e: Throwable) { null }
            if (raw is Boolean) return raw
            if (raw is String) {
                if (raw.equals("true", ignoreCase = true)) return true
                if (raw.equals("false", ignoreCase = true)) return false
            }
        }
        return def
    }

    private fun com.google.firebase.firestore.DocumentSnapshot.safeDouble(vararg keys: String, def: Double = 0.0): Double {
        for (k in keys) {
            val raw = try { get(k) } catch (e: Throwable) { null }
            if (raw is Number) return raw.toDouble()
            if (raw is String) {
                val d = raw.toDoubleOrNull()
                if (d != null) return d
            }
        }
        return def
    }

    private fun com.google.firebase.firestore.DocumentSnapshot.safeLong(vararg keys: String, def: Long = 0L): Long {
        for (k in keys) {
            val raw = try { get(k) } catch (e: Throwable) { null }
            if (raw is Number) return raw.toLong()
            if (raw is String) {
                val l = raw.toLongOrNull()
                if (l != null) return l
            }
        }
        return def
    }

    private fun com.google.firebase.firestore.DocumentSnapshot.safeStringList(key: String): List<String> {
        val raw = try { get(key) } catch (e: Throwable) { null }
        if (raw is List<*>) {
            return raw.mapNotNull { it?.toString()?.trim() }.filter { it.isNotBlank() }
        }
        if (raw is String && raw.isNotBlank()) {
            return raw.split(",").map { it.trim() }.filter { it.isNotBlank() }
        }
        return emptyList()
    }

    private fun parseFirestoreDeveloperDocument(doc: com.google.firebase.firestore.DocumentSnapshot): FirestoreDeveloper {
        val uid = doc.safeString("uid", "developerUid", "ownerUid") ?: doc.id
        val displayName = doc.safeString("displayName", "organizationName", "name") ?: "AVANYX"
        val publicDeveloperId = doc.safeString("publicDeveloperId") ?: "dev_${displayName.lowercase().replace(" ", "_")}"
        val developerSlug = doc.safeString("developerSlug") ?: displayName.lowercase().replace(" ", "-")
        val bio = doc.safeString("bio", "shortDescription", "description") ?: ""
        val country = doc.safeString("country") ?: "India"
        val avatarUrl = doc.safeString("avatarUrl", "logoUrl") ?: ""
        val logoUrl = doc.safeString("logoUrl", "avatarUrl") ?: ""
        val bannerUrl = doc.safeString("bannerUrl") ?: ""
        val isVerified = doc.safeBoolean("verified", def = true)
        val officialWebsite = doc.safeString("officialWebsite", "websiteUrl", "website") ?: ""
        val githubUrl = doc.safeString("githubUrl") ?: ""
        val instagramUrl = doc.safeString("instagramUrl") ?: ""
        val whatsappUrl = doc.safeString("whatsappUrl") ?: ""
        val youtubeUrl = doc.safeString("youtubeUrl", "youtube") ?: ""
        val facebookUrl = doc.safeString("facebookUrl", "facebook") ?: ""
        val extraOtherLinks = doc.safeString("extraOtherLinks", "otherLinks", "otherLink", "customLink", "linkedinUrl", "twitterUrl") ?: ""
        val otherLinksList = doc.safeStringList("otherLinks")

        return FirestoreDeveloper(
            id = doc.id,
            uid = uid,
            developerUid = uid,
            ownerUid = uid,
            publicDeveloperId = publicDeveloperId,
            developerSlug = developerSlug,
            displayName = displayName,
            organizationName = doc.safeString("organizationName") ?: displayName,
            name = displayName,
            email = doc.safeString("email", "supportEmail") ?: "",
            bio = bio,
            shortDescription = bio,
            country = country,
            avatarUrl = avatarUrl,
            logoUrl = logoUrl,
            bannerUrl = bannerUrl,
            verified = isVerified,
            isVerified = isVerified,
            developerStatus = doc.safeString("developerStatus") ?: "VERIFIED",
            officialWebsite = officialWebsite,
            websiteUrl = officialWebsite,
            website = officialWebsite,
            githubUrl = githubUrl,
            instagramUrl = instagramUrl,
            whatsappUrl = whatsappUrl,
            youtubeUrl = youtubeUrl,
            facebookUrl = facebookUrl,
            extraOtherLinks = extraOtherLinks,
            otherLinks = otherLinksList,
            totalAppsPublished = doc.safeLong("totalAppsPublished", "publishedAppCount").toInt()
        )
    }

    private fun parseFirestoreAppDocument(doc: com.google.firebase.firestore.DocumentSnapshot): FirestoreApp {
        val docId = doc.safeString("id") ?: doc.id
        val name = doc.safeString("title", "name", "appName") ?: docId
        val developer = doc.safeString("developer", "developerName", "devName", "author") ?: "AVANYX"
        val developerUid = doc.safeString("developerUid", "ownerUid") ?: ""
        val category = doc.safeString("category", "categoryName") ?: "Tools"
        val categoryId = doc.safeString("categoryId", "category_id") ?: ""

        val iconText = doc.safeString("iconText", "icon_text") ?: (if (name.length >= 2) name.take(2).uppercase() else "APP")
        val iconBgColorHex = doc.safeString("iconBgColorHex", "icon_bg_color_hex") ?: "#6750A4"

        val rawIcon = doc.safeString("iconUrl", "icon_url", "logoUrl", "logo_url", "logo", "icon")
        val iconUrl = if (rawIcon?.startsWith("http") == true) rawIcon else ""
        val rawLogo = doc.safeString("logoUrl", "logo_url", "logo", "iconUrl")
        val logoUrl = if (rawLogo?.startsWith("http") == true) rawLogo else iconUrl

        val screenshots = doc.safeStringList("screenshots")

        val rawSizeMb = doc.safeString("apkSize", "sizeMb", "size") ?: "${doc.safeLong("sizeMb", def = 25L)} MB"
        val sizeMb = if (rawSizeMb.all { it.isDigit() }) "$rawSizeMb MB" else rawSizeMb

        val rating = doc.safeDouble("rating", def = 4.8)
        val isGame = doc.safeBoolean("isGame", "is_game", "game") ||
                category.equals("Action", ignoreCase = true) ||
                category.equals("Racing", ignoreCase = true)
        val isFeatured = doc.safeBoolean("isFeatured", "is_featured", "featured")
        val packageName = doc.safeString("packageName", "package_name") ?: "com.avanyx.$docId"
        val downloadUrl = doc.safeString("downloadUrl", "download_url", "apkUrl") ?: ""
        val checksumSha256 = doc.safeString("checksumSha256", "sha256Checksum", "sha256") ?: ""
        val version = doc.safeString("version", "versionName") ?: "1.0.0"
        val versionCode = doc.safeLong("versionCode", def = 1L)
        val changelog = doc.safeString("changelog", "releaseNotes", "whatsNew") ?: ""
        val fullDescription = doc.safeString("fullDescription", "description", "full_description")
            ?: "Official application from $developer on AVANYX Store."
        val status = doc.safeString("status", "appStatus") ?: "PUBLISHED"
        val features = doc.safeStringList("features")

        return FirestoreApp(
            id = docId,
            name = name,
            developer = developer,
            developerUid = developerUid,
            category = category,
            categoryId = categoryId,
            iconText = iconText,
            iconBgColorHex = iconBgColorHex,
            iconUrl = iconUrl,
            logoUrl = logoUrl,
            screenshots = screenshots,
            sizeMb = sizeMb,
            rating = rating,
            isGame = isGame,
            isFeatured = isFeatured,
            packageName = packageName,
            downloadUrl = downloadUrl,
            checksumSha256 = checksumSha256,
            version = version,
            versionCode = versionCode,
            changelog = changelog,
            fullDescription = fullDescription,
            features = features,
            status = status
        )
    }

    suspend fun getAllApps(): Result<List<FirestoreApp>> {
        return try {
            val db = safeGetFirestore() ?: getDefaultFirestore()
            Log.d(TAG, "Querying published apps from Firestore...")
            val snapshot = kotlinx.coroutines.withTimeout(7000) {
                db.collection(COLLECTION_APPS)
                    .whereEqualTo("status", "PUBLISHED")
                    .get().await()
            }
            Log.d("AVANYX_DEBUG", "Firestore docs = ${snapshot.size()}")
            val apps = snapshot.documents.map { doc -> parseFirestoreAppDocument(doc) }
            Log.i(TAG, "[FIRESTORE_SUCCESS] Received ${apps.size} published apps from Firestore")
            markDatabaseVerified(db)
            Result.success(apps)
        } catch (e: com.google.firebase.firestore.FirebaseFirestoreException) {
            Log.e(TAG, "[FIRESTORE_ERROR] Query failed: Code=${e.code} (${e.code.name}), Message=${e.message}")
            Result.failure(e)
        } catch (e: Exception) {
            Log.e(TAG, "[FIRESTORE_ERROR] Unexpected error querying apps", e)
            Result.failure(e)
        }
    }

    /**
      * Realtime Snapshot Listener for published apps.
      * Emits updated list whenever changes occur in the Firestore "apps" collection.
      * Filters strictly by status == "PUBLISHED" to comply with Firestore public read rules.
      */
    fun observePublishedApps(): Flow<List<FirestoreApp>> = callbackFlow {
        var activeListener: com.google.firebase.firestore.ListenerRegistration? = null

        try {
            val db = safeGetFirestore() ?: getDefaultFirestore()
            Log.d(TAG, "Attaching realtime listener for published apps...")
            activeListener = db.collection(COLLECTION_APPS)
                .whereEqualTo("status", "PUBLISHED")
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        Log.w(TAG, "[FIRESTORE_ERROR] Realtime listener error: Code=${error.code} (${error.code.name}), Message=${error.message}")
                        return@addSnapshotListener
                    }

                    if (snapshot != null) {
                        val apps = snapshot.documents.map { doc -> parseFirestoreAppDocument(doc) }
                        Log.i(TAG, "[FIRESTORE_SUCCESS] Realtime listener received ${snapshot.size()} documents (${apps.size} parsed)")
                        markDatabaseVerified(db)
                        trySend(apps)
                    }
                }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to attach Firestore listener", e)
        }

        awaitClose {
            Log.d(TAG, "Removing realtime Firestore listener registration")
            activeListener?.remove()
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

    suspend fun getCategories(): Result<List<FirestoreCategory>> {
        return try {
            val db = safeGetFirestore() ?: getDefaultFirestore()
            val snapshot = db.collection(COLLECTION_CATEGORIES).get().await()
            val categories = snapshot.documents.map { doc ->
                val id = doc.safeString("id") ?: doc.id
                val name = doc.safeString("name") ?: id.replaceFirstChar { it.uppercase() }
                val iconName = doc.safeString("iconName") ?: ""
                val appCount = doc.safeLong("appCount").toInt()
                FirestoreCategory(id = id, name = name, iconName = iconName, appCount = appCount)
            }
            Result.success(categories)
        } catch (e: Exception) {
            Log.w(TAG, "getCategories failed", e)
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
            val db = safeGetFirestore() ?: getDefaultFirestore()
            val snapshot = db.collection(COLLECTION_REVIEWS)
                .whereEqualTo("appId", appId)
                .get().await()
            val reviews = snapshot.documents.map { doc ->
                val id = doc.safeString("id") ?: doc.id
                val author = doc.safeString("userName", "authorName") ?: "Verified User"
                val avatar = doc.safeString("userAvatarUrl", "authorAvatarUrl") ?: ""
                val rating = doc.safeLong("rating", def = 5L).toInt()
                val comment = doc.safeString("comment") ?: ""
                val time = doc.getTimestamp("createdAt")?.toDate()?.time
                    ?: doc.safeLong("timestamp", def = System.currentTimeMillis())
                FirestoreReview(
                    id = id,
                    appId = appId,
                    userId = doc.safeString("userId") ?: "",
                    authorName = author,
                    userName = author,
                    authorAvatarUrl = avatar,
                    userAvatarUrl = avatar,
                    rating = rating,
                    comment = comment,
                    timestamp = time
                )
            }
            Result.success(reviews)
        } catch (e: Exception) {
            Log.w(TAG, "getReviewsForApp failed", e)
            Result.failure(e)
        }
    }

    suspend fun getFeaturedBanners(): Result<List<FirestoreFeaturedBanner>> {
        return try {
            val db = safeGetFirestore() ?: getDefaultFirestore()
            val snapshot = db.collection(COLLECTION_FEATURED_BANNERS).get().await()
            val banners = snapshot.documents.mapNotNull { doc ->
                val id = doc.safeString("id") ?: doc.id
                val title = doc.safeString("title") ?: ""
                val subtitle = doc.safeString("subtitle") ?: ""
                val imageUrl = doc.safeString("imageUrl", "bannerImageUrl") ?: ""
                val targetAppId = doc.safeString("targetAppId") ?: ""
                val isActive = doc.safeBoolean("isActive", def = true)
                if (isActive && imageUrl.isNotBlank()) {
                    FirestoreFeaturedBanner(id = id, title = title, subtitle = subtitle, imageUrl = imageUrl, targetAppId = targetAppId)
                } else null
            }
            Result.success(banners)
        } catch (e: Exception) {
            Log.w(TAG, "getFeaturedBanners failed", e)
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

    suspend fun getUserWishlist(userId: String): Result<List<FirestoreWishlistItem>> {
        return try {
            if (userId.isBlank()) return Result.success(emptyList())
            val snap = db.collection(COLLECTION_WISHLIST).whereEqualTo("userId", userId).get().await()
            val items = snap.documents.mapNotNull { doc ->
                val appId = doc.safeString("appId") ?: ""
                if (appId.isNotBlank()) {
                    FirestoreWishlistItem(
                        id = doc.id,
                        userId = doc.safeString("userId") ?: userId,
                        appId = appId,
                        addedTimestamp = doc.safeLong("addedAt", "timestamp", "addedTimestamp", def = System.currentTimeMillis())
                    )
                } else null
            }
            Result.success(items)
        } catch (e: Exception) {
            Log.w(TAG, "getUserWishlist notice: ${e.message}")
            Result.failure(e)
        }
    }

    fun observeWishlist(userId: String): Flow<List<FirestoreWishlistItem>> = callbackFlow {
        if (userId.isBlank()) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }
        val listener = db.collection(COLLECTION_WISHLIST)
            .whereEqualTo("userId", userId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    Log.w(TAG, "observeWishlist error: ${error.message}")
                    return@addSnapshotListener
                }
                if (snapshot != null) {
                    val items = snapshot.documents.mapNotNull { doc ->
                        val appId = doc.safeString("appId") ?: ""
                        if (appId.isNotBlank()) {
                            FirestoreWishlistItem(
                                id = doc.id,
                                userId = doc.safeString("userId") ?: userId,
                                appId = appId,
                                addedTimestamp = doc.safeLong("addedAt", "timestamp", "addedTimestamp", def = System.currentTimeMillis())
                            )
                        } else null
                    }
                    trySend(items)
                }
            }
        awaitClose { listener.remove() }
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

    suspend fun getUserNotifications(userId: String?): Result<List<FirestoreNotification>> {
        return try {
            val query = if (!userId.isNullOrBlank()) {
                db.collection(COLLECTION_NOTIFICATIONS).whereEqualTo("userId", userId).limit(30)
            } else {
                db.collection(COLLECTION_NOTIFICATIONS).limit(30)
            }
            val snap = query.get().await()
            val notifs = snap.documents.mapNotNull { doc ->
                try {
                    FirestoreNotification(
                        id = doc.id,
                        userId = doc.safeString("userId") ?: "",
                        title = doc.safeString("title") ?: "Store Notification",
                        message = doc.safeString("message", "body") ?: "",
                        timestamp = doc.safeLong("timestamp", def = System.currentTimeMillis()),
                        type = doc.safeString("type") ?: "SYSTEM",
                        isRead = doc.safeBoolean("isRead", def = false)
                    )
                } catch (e: Exception) {
                    null
                }
            }
            Result.success(notifs)
        } catch (e: Exception) {
            Log.w(TAG, "getUserNotifications notice: ${e.message}")
            Result.failure(e)
        }
    }

    fun observeNotifications(userId: String?): Flow<List<FirestoreNotification>> = callbackFlow {
        val query = if (!userId.isNullOrBlank()) {
            db.collection(COLLECTION_NOTIFICATIONS).whereEqualTo("userId", userId).limit(30)
        } else {
            db.collection(COLLECTION_NOTIFICATIONS).limit(30)
        }
        val listener = query.addSnapshotListener { snapshot, error ->
            if (error != null) {
                Log.w(TAG, "observeNotifications error: ${error.message}")
                return@addSnapshotListener
            }
            if (snapshot != null) {
                val notifs = snapshot.documents.mapNotNull { doc ->
                    try {
                        FirestoreNotification(
                            id = doc.id,
                            userId = doc.safeString("userId") ?: "",
                            title = doc.safeString("title") ?: "Store Notification",
                            message = doc.safeString("message", "body") ?: "",
                            timestamp = doc.safeLong("timestamp", def = System.currentTimeMillis()),
                            type = doc.safeString("type") ?: "SYSTEM",
                            isRead = doc.safeBoolean("isRead", def = false)
                        )
                    } catch (e: Exception) {
                        null
                    }
                }
                trySend(notifs)
            }
        }
        awaitClose { listener.remove() }
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
