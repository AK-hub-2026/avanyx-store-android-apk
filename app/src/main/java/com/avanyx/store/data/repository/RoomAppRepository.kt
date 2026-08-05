package com.avanyx.store.data.repository

import com.avanyx.store.data.database.AppDatabase
import com.avanyx.store.data.database.entity.DownloadHistoryEntity
import com.avanyx.store.data.database.entity.SearchHistoryEntity
import com.avanyx.store.data.database.entity.WishlistItemEntity
import com.avanyx.store.data.mapper.toDomain
import com.avanyx.store.data.model.AppUpdateInfo
import com.avanyx.store.data.model.Category
import com.avanyx.store.data.model.NotificationItem
import com.avanyx.store.data.model.StoreApp
import com.avanyx.store.data.model.UserSettings
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext

class RoomAppRepository(private val database: AppDatabase) : AppRepository {

    override fun getApps(): Flow<List<StoreApp>> {
        return database.storeAppDao().getAllApps()
            .map { list -> list.map { it.toDomain() } }
            .flowOn(Dispatchers.IO)
    }

    override fun getFeaturedAppsFlow(): Flow<List<StoreApp>> {
        return database.storeAppDao().getAllApps()
            .map { list -> list.filter { it.isFeatured }.map { it.toDomain() } }
            .flowOn(Dispatchers.IO)
    }

    override fun getGamesFlow(): Flow<List<StoreApp>> {
        return database.storeAppDao().getGames()
            .map { list -> list.map { it.toDomain() } }
            .flowOn(Dispatchers.IO)
    }

    override fun getNonGamesFlow(): Flow<List<StoreApp>> {
        return database.storeAppDao().getPopularApps()
            .map { list -> list.map { it.toDomain() } }
            .flowOn(Dispatchers.IO)
    }

    override fun getCategoriesFlow(): Flow<List<Category>> {
        return database.categoryDao().getAllCategories()
            .map { list -> list.map { it.toDomain() } }
            .flowOn(Dispatchers.IO)
    }

    override fun getWishlistAppsFlow(): Flow<List<StoreApp>> {
        return database.wishlistDao().getWishlistedApps()
            .map { list -> list.map { it.toDomain() } }
            .flowOn(Dispatchers.IO)
    }

    override fun isWishlistedFlow(appId: String): Flow<Boolean> {
        return database.wishlistDao().isWishlisted(appId)
            .flowOn(Dispatchers.IO)
    }

    override fun getNotificationsFlow(): Flow<List<NotificationItem>> {
        return database.notificationDao().getNotifications()
            .map { list -> list.map { it.toDomain() } }
            .flowOn(Dispatchers.IO)
    }

    override fun getAppUpdatesFlow(): Flow<List<AppUpdateInfo>> {
        return database.appUpdateDao().getAvailableUpdates()
            .map { list -> list.map { it.toDomain() } }
            .flowOn(Dispatchers.IO)
    }

    override fun getRecentSearchesFlow(): Flow<List<String>> {
        return database.searchHistoryDao().getRecentSearches()
            .map { list -> list.map { it.query } }
            .flowOn(Dispatchers.IO)
    }

    fun getUserSettingsFlow(): Flow<UserSettings> {
        return database.userSettingsDao().getUserSettings()
            .map { entity ->
                if (entity != null) {
                    UserSettings(
                        isDarkMode = entity.isDarkMode,
                        wifiOnlyDownloads = entity.wifiOnlyDownloads,
                        notificationsEnabled = entity.notificationsEnabled,
                        autoUpdateApps = entity.autoUpdateApps,
                        sandboxMode = entity.sandboxMode,
                        downloadLocation = entity.downloadLocation,
                        language = entity.language
                    )
                } else {
                    UserSettings()
                }
            }
            .flowOn(Dispatchers.IO)
    }

    override fun getAppById(id: String): StoreApp? {
        return runBlocking(Dispatchers.IO) {
            database.storeAppDao().getAppByIdSync(id)?.toDomain()
        }
    }

    override fun searchApps(query: String): List<StoreApp> {
        if (query.isBlank()) {
            return runBlocking(Dispatchers.IO) {
                database.storeAppDao().getAllApps().first().map { it.toDomain() }
            }
        }
        return runBlocking(Dispatchers.IO) {
            database.storeAppDao().searchAppsSync(query).map { it.toDomain() }
        }
    }

    override fun getGames(): List<StoreApp> {
        return runBlocking(Dispatchers.IO) {
            database.storeAppDao().getAllApps().first().filter { it.isGame }.map { it.toDomain() }
        }
    }

    override fun getNonGames(): List<StoreApp> {
        return runBlocking(Dispatchers.IO) {
            database.storeAppDao().getAllApps().first().filter { !it.isGame }.map { it.toDomain() }
        }
    }

    override fun getFeatured(): List<StoreApp> {
        return runBlocking(Dispatchers.IO) {
            database.storeAppDao().getAllApps().first().filter { it.isFeatured }.map { it.toDomain() }
        }
    }

    override suspend fun toggleWishlist(appId: String) = withContext(Dispatchers.IO) {
        val isWishlisted = database.wishlistDao().isWishlistedSync(appId)
        if (isWishlisted) {
            database.wishlistDao().removeFromWishlist(appId)
        } else {
            database.wishlistDao().addToWishlist(WishlistItemEntity(appId = appId))
        }
    }

    override suspend fun isWishlisted(appId: String): Boolean = withContext(Dispatchers.IO) {
        database.wishlistDao().isWishlistedSync(appId)
    }

    override suspend fun addSearchQuery(query: String) = withContext(Dispatchers.IO) {
        if (query.isNotBlank()) {
            database.searchHistoryDao().deleteSearchByQuery(query)
            database.searchHistoryDao().insertSearch(SearchHistoryEntity(query = query.trim()))
        }
    }

    override suspend fun clearSearchHistory() = withContext(Dispatchers.IO) {
        database.searchHistoryDao().clearHistory()
    }

    override suspend fun markNotificationRead(id: String) = withContext(Dispatchers.IO) {
        database.notificationDao().markAsRead(id)
    }

    override suspend fun addDownloadHistory(item: DownloadHistoryEntity) = withContext(Dispatchers.IO) {
        database.downloadHistoryDao().insertHistory(item)
    }

    suspend fun updateUserSettings(settings: UserSettings) = withContext(Dispatchers.IO) {
        val current = database.userSettingsDao().getUserSettingsSync()
        val updatedEntity = (current ?: com.avanyx.store.data.database.entity.UserSettingsEntity()).copy(
            isDarkMode = settings.isDarkMode,
            wifiOnlyDownloads = settings.wifiOnlyDownloads,
            notificationsEnabled = settings.notificationsEnabled,
            autoUpdateApps = settings.autoUpdateApps,
            sandboxMode = settings.sandboxMode,
            downloadLocation = settings.downloadLocation,
            language = settings.language,
            updatedDate = System.currentTimeMillis()
        )
        database.userSettingsDao().updateSettings(updatedEntity)
    }
}
