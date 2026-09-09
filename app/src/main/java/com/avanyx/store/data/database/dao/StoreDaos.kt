package com.avanyx.store.data.database.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.avanyx.store.data.database.entity.AppReviewEntity
import com.avanyx.store.data.database.entity.AppUpdateEntity
import com.avanyx.store.data.database.entity.CategoryEntity
import com.avanyx.store.data.database.entity.DeveloperEntity
import com.avanyx.store.data.database.entity.DownloadHistoryEntity
import com.avanyx.store.data.database.entity.DownloadedAppEntity
import com.avanyx.store.data.database.entity.FavoriteDeveloperEntity
import com.avanyx.store.data.database.entity.InstalledAppEntity
import com.avanyx.store.data.database.entity.NotificationEntity
import com.avanyx.store.data.database.entity.RecentActivityEntity
import com.avanyx.store.data.database.entity.SearchHistoryEntity
import com.avanyx.store.data.database.entity.StoreAppEntity
import com.avanyx.store.data.database.entity.UserSettingsEntity
import com.avanyx.store.data.database.entity.WishlistItemEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface StoreAppDao {
    @Query("SELECT * FROM store_apps ORDER BY name ASC")
    fun getAllApps(): Flow<List<StoreAppEntity>>

    @Query("SELECT * FROM store_apps ORDER BY name ASC")
    suspend fun getAllAppsList(): List<StoreAppEntity>

    @Query("SELECT * FROM store_apps WHERE isFeatured = 1 LIMIT 1")
    fun getFeaturedApp(): Flow<StoreAppEntity?>

    @Query("SELECT * FROM store_apps WHERE isFeatured = 1 LIMIT 1")
    suspend fun getFeaturedAppSync(): StoreAppEntity?

    @Query("SELECT * FROM store_apps WHERE isGame = 0 ORDER BY rating DESC")
    fun getPopularApps(): Flow<List<StoreAppEntity>>

    @Query("SELECT * FROM store_apps WHERE isGame = 0 ORDER BY updatedDate DESC")
    fun getNewAndUpdatedApps(): Flow<List<StoreAppEntity>>

    @Query("SELECT * FROM store_apps WHERE isGame = 1 ORDER BY rating DESC")
    fun getGames(): Flow<List<StoreAppEntity>>

    @Query("SELECT * FROM store_apps WHERE isGame = 1 ORDER BY rating DESC")
    fun getPopularGames(): Flow<List<StoreAppEntity>>

    @Query("SELECT * FROM store_apps WHERE isGame = 1 ORDER BY updatedDate DESC")
    fun getNewGames(): Flow<List<StoreAppEntity>>

    @Query("SELECT * FROM store_apps WHERE categoryId = :categoryId ORDER BY rating DESC")
    fun getAppsByCategory(categoryId: String): Flow<List<StoreAppEntity>>

    @Query("SELECT * FROM store_apps WHERE name LIKE '%' || :query || '%' OR developer LIKE '%' || :query || '%' OR category LIKE '%' || :query || '%' OR fullDescription LIKE '%' || :query || '%'")
    fun searchApps(query: String): Flow<List<StoreAppEntity>>

    @Query("SELECT * FROM store_apps WHERE name LIKE '%' || :query || '%' OR developer LIKE '%' || :query || '%' OR category LIKE '%' || :query || '%' OR fullDescription LIKE '%' || :query || '%'")
    suspend fun searchAppsSync(query: String): List<StoreAppEntity>

    @Query("SELECT * FROM store_apps WHERE id = :id LIMIT 1")
    fun getAppById(id: String): Flow<StoreAppEntity?>

    @Query("SELECT * FROM store_apps WHERE id = :id LIMIT 1")
    suspend fun getAppByIdSync(id: String): StoreAppEntity?

    @Query("SELECT * FROM store_apps WHERE packageName = :packageName LIMIT 1")
    suspend fun getAppByPackageSync(packageName: String): StoreAppEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertApps(apps: List<StoreAppEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertApp(app: StoreAppEntity)

    @Query("DELETE FROM store_apps WHERE id = :id")
    suspend fun deleteAppById(id: String)

    @Query("DELETE FROM store_apps WHERE id NOT IN (:validIds)")
    suspend fun deleteAppsNotInList(validIds: List<String>)

    @Query("SELECT COUNT(*) FROM store_apps")
    suspend fun countApps(): Int

    @Query("DELETE FROM store_apps")
    suspend fun deleteAllApps()
}

@Dao
interface CategoryDao {
    @Query("SELECT * FROM categories ORDER BY name ASC")
    fun getAllCategories(): Flow<List<CategoryEntity>>

    @Query("SELECT * FROM categories ORDER BY name ASC")
    suspend fun getAllCategoriesSync(): List<CategoryEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCategories(categories: List<CategoryEntity>)

    @Query("SELECT COUNT(*) FROM categories")
    suspend fun countCategories(): Int
}

@Dao
interface DeveloperDao {
    @Query("SELECT * FROM developers ORDER BY name ASC")
    fun getAllDevelopers(): Flow<List<DeveloperEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDevelopers(developers: List<DeveloperEntity>)
}

@Dao
interface WishlistDao {
    @Query("SELECT * FROM wishlist_items ORDER BY addedTimestamp DESC")
    fun getWishlistItems(): Flow<List<WishlistItemEntity>>

    @Query("SELECT store_apps.* FROM store_apps INNER JOIN wishlist_items ON store_apps.id = wishlist_items.appId ORDER BY wishlist_items.addedTimestamp DESC")
    fun getWishlistedApps(): Flow<List<StoreAppEntity>>

    @Query("SELECT EXISTS(SELECT 1 FROM wishlist_items WHERE appId = :appId)")
    fun isWishlisted(appId: String): Flow<Boolean>

    @Query("SELECT EXISTS(SELECT 1 FROM wishlist_items WHERE appId = :appId)")
    suspend fun isWishlistedSync(appId: String): Boolean

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun addToWishlist(item: WishlistItemEntity)

    @Query("DELETE FROM wishlist_items WHERE appId = :appId")
    suspend fun removeFromWishlist(appId: String)

    @Query("DELETE FROM wishlist_items")
    suspend fun clearWishlist()
}

@Dao
interface SearchHistoryDao {
    @Query("SELECT * FROM search_history ORDER BY timestamp DESC LIMIT 20")
    fun getRecentSearches(): Flow<List<SearchHistoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSearch(search: SearchHistoryEntity)

    @Query("DELETE FROM search_history WHERE query = :query")
    suspend fun deleteSearchByQuery(query: String)

    @Query("DELETE FROM search_history")
    suspend fun clearHistory()
}

@Dao
interface UserSettingsDao {
    @Query("SELECT * FROM user_settings WHERE id = 1 LIMIT 1")
    fun getUserSettings(): Flow<UserSettingsEntity?>

    @Query("SELECT * FROM user_settings WHERE id = 1 LIMIT 1")
    suspend fun getUserSettingsSync(): UserSettingsEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun updateSettings(settings: UserSettingsEntity)
}

@Dao
interface DownloadHistoryDao {
    @Query("SELECT * FROM download_history ORDER BY timestamp DESC")
    fun getDownloadHistory(): Flow<List<DownloadHistoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHistory(item: DownloadHistoryEntity)

    @Query("DELETE FROM download_history")
    suspend fun clearHistory()
}

@Dao
interface NotificationDao {
    @Query("SELECT * FROM notifications ORDER BY timestamp DESC")
    fun getNotifications(): Flow<List<NotificationEntity>>

    @Query("SELECT COUNT(*) FROM notifications WHERE isRead = 0")
    fun getUnreadCount(): Flow<Int>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNotifications(notifications: List<NotificationEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNotification(notification: NotificationEntity)

    @Query("UPDATE notifications SET isRead = 1 WHERE id = :id")
    suspend fun markAsRead(id: String)

    @Query("UPDATE notifications SET isRead = 1")
    suspend fun markAllAsRead()

    @Query("DELETE FROM notifications")
    suspend fun clearAll()
}

@Dao
interface AppUpdateDao {
    @Query("SELECT * FROM app_updates WHERE isAvailable = 1 ORDER BY lastChecked DESC")
    fun getAvailableUpdates(): Flow<List<AppUpdateEntity>>

    @Query("SELECT * FROM app_updates WHERE isAvailable = 1 ORDER BY lastChecked DESC")
    suspend fun getAvailableUpdatesList(): List<AppUpdateEntity>

    @Query("SELECT * FROM app_updates WHERE appId = :appId LIMIT 1")
    suspend fun getUpdateByAppId(appId: String): AppUpdateEntity?

    @Query("SELECT * FROM app_updates WHERE packageName = :packageName LIMIT 1")
    suspend fun getUpdateByPackage(packageName: String): AppUpdateEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUpdates(updates: List<AppUpdateEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUpdate(update: AppUpdateEntity)

    @Query("DELETE FROM app_updates WHERE appId = :appId")
    suspend fun removeUpdate(appId: String)

    @Query("DELETE FROM app_updates WHERE packageName = :packageName")
    suspend fun removeUpdateByPackage(packageName: String)

    @Query("DELETE FROM app_updates")
    suspend fun clearUpdates()
}

@Dao
interface RecentActivityDao {
    @Query("SELECT * FROM recent_activity ORDER BY timestamp DESC LIMIT 20")
    fun getRecentActivities(): Flow<List<RecentActivityEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertActivity(activity: RecentActivityEntity)
}

@Dao
interface AppReviewDao {
    @Query("SELECT * FROM app_reviews WHERE appId = :appId ORDER BY createdTimestamp DESC")
    fun getReviewsForApp(appId: String): Flow<List<AppReviewEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReviews(reviews: List<AppReviewEntity>)
}

@Dao
interface InstalledAppDao {
    @Query("SELECT * FROM installed_apps ORDER BY appName ASC")
    fun getInstalledApps(): Flow<List<InstalledAppEntity>>

    @Query("SELECT * FROM installed_apps ORDER BY appName ASC")
    suspend fun getInstalledAppsList(): List<InstalledAppEntity>

    @Query("SELECT * FROM installed_apps WHERE packageName = :packageName LIMIT 1")
    suspend fun getInstalledAppByPackage(packageName: String): InstalledAppEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertInstalledApps(apps: List<InstalledAppEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertInstalledApp(app: InstalledAppEntity)

    @Query("DELETE FROM installed_apps WHERE packageName = :packageName")
    suspend fun removeInstalledApp(packageName: String)

    @Query("DELETE FROM installed_apps")
    suspend fun clearInstalledApps()
}
