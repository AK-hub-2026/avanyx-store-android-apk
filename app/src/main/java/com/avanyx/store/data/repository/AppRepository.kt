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
        val isGoogle = developerIdOrName.contains("google", ignoreCase = true)
        val isAvanyx = developerIdOrName.contains("avanyx", ignoreCase = true)
        val devName = when {
            isGoogle -> "Google LLC"
            isAvanyx -> "AVANYX"
            else -> developerIdOrName.replace("_", " ").replace("-", " ").capitalize()
        }
        return com.avanyx.store.data.model.DeveloperInfo(
            id = developerIdOrName.lowercase().replace(" ", "_"),
            name = devName,
            description = when {
                isGoogle -> "Apps from Google to help you get the most out of your day, across all your devices."
                isAvanyx -> "Next-generation modern mobile utilities, productivity engines, and immersive gaming experiences by AVANYX Studios."
                else -> "Official application catalog and modern software published by $devName."
            },
            email = "support@${devName.lowercase().replace(" ", "")}.com",
            website = "https://${devName.lowercase().replace(" ", "")}.com",
            bannerUrl = if (isGoogle) "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&w=1200&q=80" else "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
            logoUrl = if (isGoogle) "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&w=200&q=80" else "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80",
            country = "United States",
            joinedDate = if (isGoogle) "Sep 2008" else "Jan 2024",
            followers = if (isGoogle) "120M" else "2.4M",
            downloads = if (isGoogle) "10B+" else "50M+",
            rating = if (isGoogle) 4.6 else 4.9,
            isVerified = true,
            totalAppsPublished = if (isGoogle) 48 else 12
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
}

class LocalDemoAppRepository : AppRepository {
    private val appsList = listOf(
        StoreApp(
            id = "bomb_rush_3d",
            name = "Bomb Rush 3D",
            developer = "AVANYX",
            category = "Casual",
            iconText = "B3D",
            iconBgColorHex = "#6750A4",
            version = "1.0.4",
            size = "42 MB",
            shortDescription = "Run, jump, collect coins, avoid bombs, and cross tricky gaps in a fun 3D endless runner.",
            fullDescription = "Run, jump, collect coins, avoid bombs, and cross tricky gaps in a fun 3D endless runner adventure.\n\nTest your reflexes as you speed through beautifully styled 3D courses. Challenge yourself to achieve the highest scores, customize your run with powerups, and unlock special rewards!",
            features = listOf(
                "Smooth 3D gameplay",
                "Endless running excitement",
                "Collect shiny coins",
                "Avoid hazardous bombs",
                "Jump over dangerous gaps",
                "Beat your friends' high scores",
                "Simple, responsive swipe controls"
            ),
            rating = 4.9,
            isGame = true,
            isFeatured = true,
            packageName = "com.avanyx.bombrush3d",
            downloadUrl = "https://github.com/aosp-mirror/platform_development/raw/master/samples/ApiDemos/ApiDemos.apk",
            checksumSha256 = "d3b07384d113edec49eaa6238ad5ff00"
        ),
        StoreApp(
            id = "nova_player",
            name = "Nova Player",
            developer = "AVANYX",
            category = "Entertainment",
            iconText = "NP",
            iconBgColorHex = "#2196F3",
            version = "2.5.0",
            size = "12 MB",
            shortDescription = "A lightweight media player with a minimalist UI and multi-format audio/video support.",
            fullDescription = "Nova Player is the ultimate lightweight media player tailored for speed and efficiency. Enjoy crystal clear playback of your favorite video and audio formats without bloated menus or ads.",
            features = listOf(
                "Multi-format playback support",
                "Ultra-minimalist interface",
                "Hardware acceleration integration",
                "Low battery consumption"
            ),
            rating = 4.8,
            isGame = false,
            isFeatured = false,
            packageName = "com.avanyx.novaplayer"
        ),
        StoreApp(
            id = "zen_editor",
            name = "Zen Editor",
            developer = "Creative Tools",
            category = "Productivity",
            iconText = "ZE",
            iconBgColorHex = "#009688",
            version = "3.1.2",
            size = "45 MB",
            shortDescription = "An immersive, distraction-free markdown text editor designed for writers and developers.",
            fullDescription = "Zen Editor removes all the clutter of modern word processors, leaving only you and your words. With dynamic themes, markdown previews, and offline sync support, it is the perfect workspace for creative writing.",
            features = listOf(
                "Distraction-free fullscreen layout",
                "Full Markdown markup support",
                "Cloud-sync & Offline editing options",
                "Real-time word and character statistics"
            ),
            rating = 4.5,
            isGame = false,
            isFeatured = true,
            packageName = "com.creativetools.zeneditor"
        ),
        StoreApp(
            id = "cloud_sync",
            name = "CloudSync",
            developer = "AVANYX Utility",
            category = "Tools",
            iconText = "CS",
            iconBgColorHex = "#FF9800",
            version = "1.1.0",
            size = "8 MB",
            shortDescription = "Backup and synchronize your personal files instantly with high-speed encryption.",
            fullDescription = "CloudSync is a highly optimized backup utility that runs securely in the background, keeping your files safe and accessible across all your devices without performance overhead.",
            features = listOf(
                "Automated silent sync",
                "Military-grade file encryption",
                "Smart delta-compression transfers",
                "Detailed transfer bandwidth logs"
            ),
            rating = 4.2,
            isGame = false,
            isFeatured = false,
            packageName = "com.avanyx.cloudsync"
        ),
        StoreApp(
            id = "pixel_quest",
            name = "Pixel Quest",
            developer = "Retro Arcade",
            category = "Action",
            iconText = "PQ",
            iconBgColorHex = "#E91E63",
            version = "1.0.1",
            size = "28 MB",
            shortDescription = "Embark on an epic 8-bit platforming journey through dungeons, secrets, and boss fights.",
            fullDescription = "Pixel Quest is an authentic love letter to 80s arcade platformers. Guide your hero through dozens of hand-crafted screens filled with traps, hidden paths, and giant bosses.",
            features = listOf(
                "Authentic 8-bit chiptune audio",
                "Responsive virtual retro d-pad",
                "Dozens of challenging levels",
                "Epic multi-phase boss fights"
            ),
            rating = 4.7,
            isGame = true,
            isFeatured = false,
            packageName = "com.retroarcade.pixelquest"
        ),
        StoreApp(
            id = "speed_limit_3d",
            name = "Speed Limit 3D",
            developer = "AVANYX Sports",
            category = "Racing",
            iconText = "SL",
            iconBgColorHex = "#9C27B0",
            version = "2.0.2",
            size = "85 MB",
            shortDescription = "High-octane asphalt racing simulator featuring realistic drift physics and dynamic weather.",
            fullDescription = "Put your pedal to the metal in Speed Limit 3D. Push your custom racecar to its limits on winding mountain roads, city streets, and professionally designed tracks.",
            features = listOf(
                "Highly detailed sports car models",
                "Responsive tilt and touch steering",
                "Dynamic rain, fog, and snow weather",
                "Online global weekly time-trials"
            ),
            rating = 4.6,
            isGame = true,
            isFeatured = true,
            packageName = "com.avanyx.speedlimit3d"
        ),
        StoreApp(
            id = "math_genius",
            name = "Math Genius",
            developer = "EdTech Studio",
            category = "Education",
            iconText = "MG",
            iconBgColorHex = "#3F51B5",
            version = "4.0.0",
            size = "18 MB",
            shortDescription = "Gamified math puzzles and quick mental arithmetic challenges for all ages.",
            fullDescription = "Sharpen your brain with Math Genius! Solve customized math questions that scale dynamically to your skill level, track your progress daily, and unlock decorative virtual trophies.",
            features = listOf(
                "Adaptive arithmetic difficulty scaling",
                "Interactive animated graphing tools",
                "Daily quick mental speed drills",
                "Beautiful achievements display panel"
            ),
            rating = 4.4,
            isGame = false,
            isFeatured = false,
            packageName = "com.edtech.mathgenius"
        ),
        StoreApp(
            id = "neon_arcade",
            name = "Neon Arcade",
            developer = "Synth Games",
            category = "Arcade",
            iconText = "NA",
            iconBgColorHex = "#00BCD4",
            version = "1.2.0",
            size = "15 MB",
            shortDescription = "A fast-paced synthwave neon shooting adventure with a pumping electronic soundtrack.",
            fullDescription = "Neon Arcade is a bullet-hell modern classic. Direct your neon fighter craft through infinite waves of geometric vectors, gathering multiplier powerups to fuel your highscore.",
            features = listOf(
                "Full 120Hz display refresh support",
                "Stunning glowing particle effects",
                "Custom original synthwave music track",
                "One-touch responsive thumb tracking"
            ),
            rating = 4.8,
            isGame = true,
            isFeatured = false,
            packageName = "com.synthgames.neonarcade"
        )
    )

    override fun getApps(): Flow<List<StoreApp>> = flowOf(appsList)

    override fun getAppById(id: String): StoreApp? {
        return appsList.find { it.id == id }
    }

    override fun searchApps(query: String): List<StoreApp> {
        if (query.isBlank()) return appsList
        return appsList.filter {
            it.name.contains(query, ignoreCase = true) ||
            it.developer.contains(query, ignoreCase = true) ||
            it.category.contains(query, ignoreCase = true)
        }
    }

    override fun getGames(): List<StoreApp> = appsList.filter { it.isGame }

    override fun getNonGames(): List<StoreApp> = appsList.filter { !it.isGame }

    override fun getFeatured(): List<StoreApp> = appsList.filter { it.isFeatured }
}
