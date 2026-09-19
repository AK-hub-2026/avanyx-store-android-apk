package com.avanyx.store.data.repository

import com.avanyx.store.data.model.StoreApp
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf

interface AppRepository {
    fun getApps(): Flow<List<StoreApp>>
    fun getAppById(id: String): StoreApp?
    fun searchApps(query: String): List<StoreApp>
    fun getGames(): List<StoreApp>
    fun getNonGames(): List<StoreApp>
    fun getFeatured(): List<StoreApp>

    // Developer Profile & Catalog
    fun getDeveloperInfo(developerIdOrName: String): com.avanyx.store.data.model.DeveloperInfo {
        val cleanName = if (developerIdOrName.contains("avanyx", ignoreCase = true) || developerIdOrName.isBlank()) {
            "AVANYX"
        } else {
            developerIdOrName.replace("_", " ").replace("-", " ")
        }
        return com.avanyx.store.data.model.DeveloperInfo(
            id = developerIdOrName.lowercase().replace(" ", "_"),
            name = cleanName,
            description = "Official application catalog and modern software published by $cleanName on AVANYX Store.",
            email = "support@avanyx.store",
            website = "https://store-avanyx.pages.dev",
            bannerUrl = "",
            logoUrl = "",
            country = "Global",
            joinedDate = "Jan 2024",
            followers = "1",
            downloads = "1",
            rating = 4.9,
            isVerified = true,
            totalAppsPublished = 1,
            companyName = cleanName,
            organizationName = "AVANYX Technologies",
            supportEmail = "support@avanyx.store",
            privacyPolicyUrl = "https://store-avanyx.pages.dev/privacy",
            officialWebsite = "",
            githubUrl = "",
            instagramUrl = "",
            youtubeUrl = "",
            facebookUrl = "",
            extraOtherLinks = ""
        )
    }

    fun getAppsByDeveloper(developerIdOrName: String): List<StoreApp> {
        val all = getGames() + getNonGames()
        if (developerIdOrName.isBlank()) return all
        val query = developerIdOrName.lowercase()
        val filtered = all.filter {
            it.developer.contains(query, ignoreCase = true) || query.contains(it.developer, ignoreCase = true)
        }
        return if (filtered.isNotEmpty()) filtered else all
    }

    // Reactive Flow methods for Room Database persistence
    fun getFeaturedAppsFlow(): Flow<List<StoreApp>> = flowOf(getFeatured())
    fun getGamesFlow(): Flow<List<StoreApp>> = flowOf(getGames())
    fun getNonGamesFlow(): Flow<List<StoreApp>> = flowOf(getNonGames())
    fun getCategoriesFlow(): Flow<List<com.avanyx.store.data.model.Category>> = flowOf(emptyList())
    fun getWishlistAppsFlow(): Flow<List<StoreApp>> = flowOf(emptyList())
    fun isWishlistedFlow(appId: String): Flow<Boolean> = flowOf(false)
    fun getNotificationsFlow(): Flow<List<com.avanyx.store.data.model.NotificationItem>> = flowOf(emptyList())
    fun getAppUpdatesFlow(): Flow<List<com.avanyx.store.data.model.AppUpdateInfo>> = flowOf(emptyList())
    fun getInstalledAppsFlow(): Flow<List<com.avanyx.store.data.database.entity.InstalledAppEntity>> = flowOf(emptyList())
    fun getRecentSearchesFlow(): Flow<List<String>> = flowOf(emptyList())

    // Persistence mutations
    suspend fun toggleWishlist(appId: String) {}
    suspend fun isWishlisted(appId: String): Boolean = false
    suspend fun addSearchQuery(query: String) {}
    suspend fun clearSearchHistory() {}
    suspend fun markNotificationRead(id: String) {}
    suspend fun addDownloadHistory(item: com.avanyx.store.data.database.entity.DownloadHistoryEntity) {}
    fun getReviewsForApp(appId: String): Flow<List<com.avanyx.store.data.database.entity.AppReviewEntity>> = flowOf(emptyList())
    suspend fun submitReview(review: com.avanyx.store.data.database.entity.AppReviewEntity) {}
}

