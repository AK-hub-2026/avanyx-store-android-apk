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
                            // Prepopulate default demo data on first launch
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
            val converters = Converters()

            val initialApps = listOf(
                StoreAppEntity(
                    id = "bomb_rush_3d",
                    name = "Bomb Rush 3D",
                    developer = "AVANYX",
                    category = "Casual",
                    categoryId = "casual",
                    iconText = "B3D",
                    iconBgColorHex = "#6750A4",
                    sizeMb = "42 MB",
                    rating = 4.9,
                    isGame = true,
                    isFeatured = true,
                    packageName = "com.avanyx.bombrush3d",
                    downloadUrl = "https://github.com/aosp-mirror/platform_development/raw/master/samples/ApiDemos/ApiDemos.apk",
                    checksumSha256 = "d3b07384d113edec49eaa6238ad5ff00",
                    version = "1.0.4",
                    fullDescription = "Run, jump, collect coins, avoid bombs, and cross tricky gaps in a fun 3D endless runner adventure.\n\nTest your reflexes as you speed through beautifully styled 3D courses. Challenge yourself to achieve the highest scores, customize your run with powerups, and unlock special rewards!",
                    featuresJson = converters.fromListToString(
                        listOf(
                            "Smooth 3D gameplay",
                            "Endless running excitement",
                            "Collect shiny coins",
                            "Avoid hazardous bombs",
                            "Jump over dangerous gaps",
                            "Beat your friends' high scores",
                            "Simple, responsive swipe controls"
                        )
                    )
                ),
                StoreAppEntity(
                    id = "nova_player",
                    name = "Nova Player",
                    developer = "AVANYX",
                    category = "Entertainment",
                    categoryId = "entertainment",
                    iconText = "NP",
                    iconBgColorHex = "#2196F3",
                    sizeMb = "12 MB",
                    rating = 4.8,
                    isGame = false,
                    isFeatured = false,
                    packageName = "com.avanyx.novaplayer",
                    version = "2.5.0",
                    fullDescription = "Nova Player is the ultimate lightweight media player tailored for speed and efficiency. Enjoy crystal clear playback of your favorite video and audio formats without bloated menus or ads.",
                    featuresJson = converters.fromListToString(
                        listOf(
                            "Multi-format playback support",
                            "Ultra-minimalist interface",
                            "Hardware acceleration integration",
                            "Low battery consumption"
                        )
                    )
                ),
                StoreAppEntity(
                    id = "zen_editor",
                    name = "Zen Editor",
                    developer = "Creative Tools",
                    category = "Productivity",
                    categoryId = "productivity",
                    iconText = "ZE",
                    iconBgColorHex = "#009688",
                    sizeMb = "45 MB",
                    rating = 4.5,
                    isGame = false,
                    isFeatured = true,
                    packageName = "com.creativetools.zeneditor",
                    version = "3.1.2",
                    fullDescription = "Zen Editor removes all the clutter of modern word processors, leaving only you and your words. With dynamic themes, markdown previews, and offline sync support, it is the perfect workspace for creative writing.",
                    featuresJson = converters.fromListToString(
                        listOf(
                            "Distraction-free fullscreen layout",
                            "Full Markdown markup support",
                            "Cloud-sync & Offline editing options",
                            "Real-time word and character statistics"
                        )
                    )
                ),
                StoreAppEntity(
                    id = "cloud_sync",
                    name = "CloudSync",
                    developer = "AVANYX Utility",
                    category = "Tools",
                    categoryId = "tools",
                    iconText = "CS",
                    iconBgColorHex = "#FF9800",
                    sizeMb = "8 MB",
                    rating = 4.2,
                    isGame = false,
                    isFeatured = false,
                    packageName = "com.avanyx.cloudsync",
                    version = "1.1.0",
                    fullDescription = "CloudSync is a highly optimized backup utility that runs securely in the background, keeping your files safe and accessible across all your devices without performance overhead.",
                    featuresJson = converters.fromListToString(
                        listOf(
                            "Automated silent sync",
                            "Military-grade file encryption",
                            "Smart delta-compression transfers",
                            "Detailed transfer bandwidth logs"
                        )
                    )
                ),
                StoreAppEntity(
                    id = "pixel_quest",
                    name = "Pixel Quest",
                    developer = "Retro Arcade",
                    category = "Action",
                    categoryId = "action",
                    iconText = "PQ",
                    iconBgColorHex = "#E91E63",
                    sizeMb = "28 MB",
                    rating = 4.7,
                    isGame = true,
                    isFeatured = false,
                    packageName = "com.retroarcade.pixelquest",
                    version = "1.0.1",
                    fullDescription = "Pixel Quest is an authentic love letter to 80s arcade platformers. Guide your hero through dozens of hand-crafted screens filled with traps, hidden paths, and giant bosses.",
                    featuresJson = converters.fromListToString(
                        listOf(
                            "Authentic 8-bit chiptune audio",
                            "Responsive virtual retro d-pad",
                            "Dozens of challenging levels",
                            "Epic multi-phase boss fights"
                        )
                    )
                ),
                StoreAppEntity(
                    id = "speed_limit_3d",
                    name = "Speed Limit 3D",
                    developer = "AVANYX Sports",
                    category = "Racing",
                    categoryId = "racing",
                    iconText = "SL",
                    iconBgColorHex = "#9C27B0",
                    sizeMb = "85 MB",
                    rating = 4.6,
                    isGame = true,
                    isFeatured = true,
                    packageName = "com.avanyx.speedlimit3d",
                    version = "2.0.2",
                    fullDescription = "Put your pedal to the metal in Speed Limit 3D. Push your custom racecar to its limits on winding mountain roads, city streets, and professionally designed tracks.",
                    featuresJson = converters.fromListToString(
                        listOf(
                            "Highly detailed sports car models",
                            "Responsive tilt and touch steering",
                            "Dynamic rain, fog, and snow weather",
                            "Online global weekly time-trials"
                        )
                    )
                ),
                StoreAppEntity(
                    id = "math_genius",
                    name = "Math Genius",
                    developer = "EdTech Studio",
                    category = "Education",
                    categoryId = "education",
                    iconText = "MG",
                    iconBgColorHex = "#3F51B5",
                    sizeMb = "18 MB",
                    rating = 4.4,
                    isGame = false,
                    isFeatured = false,
                    packageName = "com.edtech.mathgenius",
                    version = "4.0.0",
                    fullDescription = "Sharpen your brain with Math Genius! Solve customized math questions that scale dynamically to your skill level, track your progress daily, and unlock decorative virtual trophies.",
                    featuresJson = converters.fromListToString(
                        listOf(
                            "Adaptive arithmetic difficulty scaling",
                            "Interactive animated graphing tools",
                            "Daily quick mental speed drills",
                            "Beautiful achievements display panel"
                        )
                    )
                ),
                StoreAppEntity(
                    id = "neon_arcade",
                    name = "Neon Arcade",
                    developer = "Synth Games",
                    category = "Arcade",
                    categoryId = "arcade",
                    iconText = "NA",
                    iconBgColorHex = "#00BCD4",
                    sizeMb = "15 MB",
                    rating = 4.8,
                    isGame = true,
                    isFeatured = false,
                    packageName = "com.synthgames.neonarcade",
                    version = "1.2.0",
                    fullDescription = "Neon Arcade is a bullet-hell modern classic. Direct your neon fighter craft through infinite waves of geometric vectors, gathering multiplier powerups to fuel your highscore.",
                    featuresJson = converters.fromListToString(
                        listOf(
                            "Full 120Hz display refresh support",
                            "Stunning glowing particle effects",
                            "Custom original synthwave music track",
                            "One-touch responsive thumb tracking"
                        )
                    )
                )
            )

            val initialCategories = listOf(
                CategoryEntity("casual", "Casual", "SportsEsports", 2),
                CategoryEntity("entertainment", "Entertainment", "Movie", 3),
                CategoryEntity("productivity", "Productivity", "Work", 5),
                CategoryEntity("tools", "Tools", "Build", 4),
                CategoryEntity("action", "Action", "FlashOn", 3),
                CategoryEntity("racing", "Racing", "DirectionsCar", 2),
                CategoryEntity("education", "Education", "School", 4),
                CategoryEntity("arcade", "Arcade", "Games", 3)
            )

            val initialDevelopers = listOf(
                DeveloperEntity("avanyx", "AVANYX", true, 4, 4.9),
                DeveloperEntity("creative_tools", "Creative Tools", true, 2, 4.7),
                DeveloperEntity("retro_arcade", "Retro Arcade", true, 3, 4.6)
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
                    id = "notif_1",
                    title = "AVANYX Store v1.0 Ready",
                    message = "Welcome to AVANYX Store! All applications and updates are verified with SHA-256 signatures.",
                    timestamp = System.currentTimeMillis() - 3600000,
                    isRead = false,
                    type = "SYSTEM"
                ),
                NotificationEntity(
                    id = "notif_2",
                    title = "Featured App Spotlight",
                    message = "Check out Bomb Rush 3D and Speed Limit 3D in the Games section today!",
                    timestamp = System.currentTimeMillis() - 86400000,
                    isRead = true,
                    type = "PROMOTION"
                )
            )

            val initialUpdates = listOf(
                AppUpdateEntity(
                    appId = "nova_player",
                    currentVersion = "2.4.0",
                    newVersion = "2.5.0",
                    updateSize = "12 MB",
                    releaseNotes = "Added hardware decoding support, dark mode enhancements, and bug fixes.",
                    isAvailable = true
                )
            )

            database.storeAppDao().insertApps(initialApps)
            database.categoryDao().insertCategories(initialCategories)
            database.developerDao().insertDevelopers(initialDevelopers)
            database.userSettingsDao().updateSettings(initialSettings)
            database.notificationDao().insertNotifications(initialNotifications)
            database.appUpdateDao().insertUpdates(initialUpdates)
        }
    }
}
