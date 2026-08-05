package com.avanyx.store.data.database.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "store_apps",
    indices = [
        Index(value = ["categoryId"]),
        Index(value = ["isGame"]),
        Index(value = ["isFeatured"]),
        Index(value = ["packageName"], unique = true)
    ]
)
data class StoreAppEntity(
    @PrimaryKey val id: String,
    val name: String,
    val developer: String,
    val category: String,
    val categoryId: String = "utilities",
    val iconBgColorHex: String = "#3F51B5",
    val iconText: String = "APP",
    val sizeMb: String = "15 MB",
    val rating: Double = 4.5,
    val isGame: Boolean = false,
    val isFeatured: Boolean = false,
    val packageName: String = "com.avanyx.app",
    val downloadUrl: String = "",
    val checksumSha256: String = "",
    val version: String = "1.0.0",
    val fullDescription: String = "",
    val featuresJson: String = "",
    val riskScore: String = "LOW",
    val createdDate: Long = System.currentTimeMillis(),
    val updatedDate: Long = System.currentTimeMillis()
)

@Entity(tableName = "developers")
data class DeveloperEntity(
    @PrimaryKey val id: String,
    val name: String,
    val verified: Boolean = true,
    val totalApps: Int = 1,
    val rating: Double = 4.8,
    val iconUrl: String = "",
    val createdDate: Long = System.currentTimeMillis(),
    val updatedDate: Long = System.currentTimeMillis()
)

@Entity(tableName = "categories")
data class CategoryEntity(
    @PrimaryKey val id: String,
    val name: String,
    val iconName: String = "Category",
    val appCount: Int = 0,
    val createdDate: Long = System.currentTimeMillis(),
    val updatedDate: Long = System.currentTimeMillis()
)

@Entity(tableName = "installed_apps")
data class InstalledAppEntity(
    @PrimaryKey val packageName: String,
    val appId: String,
    val appName: String,
    val version: String,
    val installedTimestamp: Long = System.currentTimeMillis(),
    val updatedDate: Long = System.currentTimeMillis()
)

@Entity(tableName = "downloaded_apps")
data class DownloadedAppEntity(
    @PrimaryKey val appId: String,
    val appName: String,
    val downloadUrl: String,
    val filePath: String = "",
    val fileSizeBytes: Long = 0L,
    val checksumSha256: String = "",
    val downloadedTimestamp: Long = System.currentTimeMillis(),
    val status: String = "COMPLETED"
)

@Entity(tableName = "wishlist_items")
data class WishlistItemEntity(
    @PrimaryKey val appId: String,
    val addedTimestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "search_history")
data class SearchHistoryEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val query: String,
    val timestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "notifications")
data class NotificationEntity(
    @PrimaryKey val id: String,
    val title: String,
    val message: String,
    val timestamp: Long = System.currentTimeMillis(),
    val isRead: Boolean = false,
    val type: String = "GENERAL"
)

@Entity(tableName = "user_settings")
data class UserSettingsEntity(
    @PrimaryKey val id: Int = 1,
    val isDarkMode: Boolean = false,
    val wifiOnlyDownloads: Boolean = false,
    val notificationsEnabled: Boolean = true,
    val autoUpdateApps: Boolean = true,
    val sandboxMode: Boolean = false,
    val downloadLocation: String = "Internal Storage/AVANYX Downloads",
    val language: String = "English (US)",
    val createdDate: Long = System.currentTimeMillis(),
    val updatedDate: Long = System.currentTimeMillis()
)

@Entity(tableName = "download_history")
data class DownloadHistoryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val appId: String,
    val packageName: String,
    val version: String,
    val sizeBytes: Long,
    val timestamp: Long = System.currentTimeMillis(),
    val status: String,
    val checksumSha256: String,
    val installStatus: String
)

@Entity(tableName = "recent_activity")
data class RecentActivityEntity(
    @PrimaryKey val id: String,
    val title: String,
    val timestamp: Long = System.currentTimeMillis(),
    val type: String
)

@Entity(tableName = "favorite_developers")
data class FavoriteDeveloperEntity(
    @PrimaryKey val developerId: String,
    val developerName: String,
    val addedTimestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "app_updates")
data class AppUpdateEntity(
    @PrimaryKey val appId: String,
    val currentVersion: String,
    val newVersion: String,
    val updateSize: String,
    val releaseNotes: String,
    val isAvailable: Boolean = true,
    val lastChecked: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "app_reviews",
    indices = [Index(value = ["appId"])]
)
data class AppReviewEntity(
    @PrimaryKey val id: String,
    val appId: String,
    val userName: String,
    val rating: Float,
    val comment: String,
    val date: String,
    val createdTimestamp: Long = System.currentTimeMillis()
)
