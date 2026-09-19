package com.avanyx.store.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import androidx.sqlite.db.SupportSQLiteDatabase
import com.avanyx.store.data.database.dao.AppReviewDao
import com.avanyx.store.data.database.dao.AppUpdateDao
import com.avanyx.store.data.database.dao.CategoryDao
import com.avanyx.store.data.database.dao.DeveloperDao
import com.avanyx.store.data.database.dao.DownloadHistoryDao
import com.avanyx.store.data.database.dao.InstalledAppDao
import com.avanyx.store.data.database.dao.NotificationDao
import com.avanyx.store.data.database.dao.RecentActivityDao
import com.avanyx.store.data.database.dao.SearchHistoryDao
import com.avanyx.store.data.database.dao.StoreAppDao
import com.avanyx.store.data.database.dao.UserSettingsDao
import com.avanyx.store.data.database.dao.WishlistDao
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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        StoreAppEntity::class,
        DeveloperEntity::class,
        CategoryEntity::class,
        InstalledAppEntity::class,
        DownloadedAppEntity::class,
        WishlistItemEntity::class,
        SearchHistoryEntity::class,
        NotificationEntity::class,
        UserSettingsEntity::class,
        DownloadHistoryEntity::class,
        RecentActivityEntity::class,
        FavoriteDeveloperEntity::class,
        AppUpdateEntity::class,
        AppReviewEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {

    abstract fun storeAppDao(): StoreAppDao
    abstract fun categoryDao(): CategoryDao
    abstract fun developerDao(): DeveloperDao
    abstract fun wishlistDao(): WishlistDao
    abstract fun searchHistoryDao(): SearchHistoryDao
    abstract fun userSettingsDao(): UserSettingsDao
    abstract fun downloadHistoryDao(): DownloadHistoryDao
    abstract fun notificationDao(): NotificationDao
    abstract fun appUpdateDao(): AppUpdateDao
    abstract fun recentActivityDao(): RecentActivityDao
    abstract fun appReviewDao(): AppReviewDao
    abstract fun installedAppDao(): InstalledAppDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "avanyx_store.db"
                )
                    .fallbackToDestructiveMigration()
                    .addCallback(object : RoomDatabase.Callback() {
                        override fun onCreate(db: SupportSQLiteDatabase) {
                            super.onCreate(db)
                            // Prepopulate default categories and settings on first launch
                            CoroutineScope(Dispatchers.IO).launch {
                                INSTANCE?.let { database ->
                                    prepopulateDatabase(database)
                                }
                            }
                        }
                    })
                    .build()
                INSTANCE = instance
                instance
            }
        }

        suspend fun prepopulateDatabase(database: AppDatabase) {
            val initialCategories = listOf(
                CategoryEntity("casual", "Casual", "SportsEsports", 0),
                CategoryEntity("entertainment", "Entertainment", "Movie", 0),
                CategoryEntity("productivity", "Productivity", "Work", 0),
                CategoryEntity("tools", "Tools", "Build", 0),
                CategoryEntity("action", "Action", "FlashOn", 0),
                CategoryEntity("racing", "Racing", "DirectionsCar", 0),
                CategoryEntity("education", "Education", "School", 0),
                CategoryEntity("arcade", "Arcade", "Games", 0)
            )

            val initialDevelopers = listOf(
                DeveloperEntity("avanyx", "AVANYX", true, 0, 5.0)
            )

            val initialSettings = UserSettingsEntity(
                id = 1,
                isDarkMode = false,
                wifiOnlyDownloads = false,
                notificationsEnabled = true,
                autoUpdateApps = true,
                sandboxMode = false,
                downloadLocation = "Internal Storage/AVANYX Downloads",
                language = "English (US)"
            )

            val initialNotifications = listOf(
                NotificationEntity(
                    id = "notif_welcome",
                    title = "Welcome to AVANYX Store",
                    message = "Discover, download, and manage verified applications directly from AVANYX.",
                    timestamp = System.currentTimeMillis(),
                    isRead = false,
                    type = "SYSTEM"
                )
            )

            // Seed initial database metadata (NO FAKE APPS - live apps sync exclusively from Firestore/Web)
            database.categoryDao().insertCategories(initialCategories)
            database.developerDao().insertDevelopers(initialDevelopers)
            database.userSettingsDao().updateSettings(initialSettings)
            database.notificationDao().insertNotifications(initialNotifications)
        }
    }
}
