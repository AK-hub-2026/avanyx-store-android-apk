package com.avanyx.store.data.model

/**
 * Roles defining user access levels and system permissions.
 */
enum class UserRole {
    GUEST,
    USER,
    DEVELOPER,
    ADMIN
}

/**
 * Future-ready representation of a User's session and identity.
 * Prepares the architecture for Guest Mode, Sign In, Profile management, and Notifications.
 */
data class UserProfile(
    val id: String,
    val name: String,
    val email: String,
    val avatarUrl: String? = null,
    val isGuest: Boolean = false,
    val isNotificationsEnabled: Boolean = true,
    val role: UserRole = UserRole.USER,
    val joinedTimestamp: Long = System.currentTimeMillis()
)

/**
 * States representing the lifecycle of an application download/install pipeline.
 */
enum class DownloadStatus {
    IDLE,
    PENDING,
    WAITING,
    DOWNLOADING,
    PAUSED,
    RETRYING,
    VERIFYING,
    INSTALLING,
    COMPLETED,
    FAILED,
    CANCELED
}

/**
 * Data model for tracking real-time progress, speeds, and verification details in the Download Engine.
 */
data class DownloadInfo(
    val appId: String,
    val appName: String,
    val totalSizeBytes: Long,
    val downloadedBytes: Long,
    val status: DownloadStatus,
    val progress: Float = 0f, // Range from 0.0f to 1.0f
    val speedKbps: Float = 0f,
    val errorMessage: String? = null,
    val checksumSha256: String? = null
)

/**
 * Update metadata containing version comparison details and changelogs.
 */
data class AppUpdateInfo(
    val appId: String,
    val packageName: String = "",
    val appName: String = "",
    val currentVersion: String = "",
    val currentVersionCode: Long = 1L,
    val latestVersion: String = "",
    val latestVersionCode: Long = 1L,
    val updateSize: String = "",
    val changelog: String = "",
    val downloadUrl: String = "",
    val checksumSha256: String = "",
    val isMandatory: Boolean = false,
    val releaseDate: String = "Recent"
)

/**
 * Unified primary action state for an app in the store UI.
 * Rules:
 * - Package not installed -> INSTALL ("GET" or "INSTALL")
 * - Package installed + same or higher installed versionCode -> OPEN ("OPEN" or "Installed ✓")
 * - Package installed + higher store versionCode -> UPDATE ("UPDATE")
 * - Active download states -> DOWNLOADING, PAUSED, VERIFYING, INSTALLING
 */
sealed class AppActionState {
    object Install : AppActionState()
    data class Installed(val currentVersion: String) : AppActionState()
    data class Update(
        val currentVersion: String,
        val newVersion: String,
        val updateSize: String = ""
    ) : AppActionState()
    data class Downloading(val progress: Float, val speedKbps: Float = 0f) : AppActionState()
    object Paused : AppActionState()
    object Verifying : AppActionState()
    object Installing : AppActionState()
}

/**
 * Verified developer profiles providing metadata, badges, banners, and app catalog details.
 */
data class DeveloperInfo(
    val id: String,
    val name: String,
    val description: String = "",
    val email: String = "",
    val website: String? = null,
    val bannerUrl: String? = null,
    val logoUrl: String? = null,
    val country: String = "United States",
    val joinedDate: String = "Sep 2008",
    val followers: String = "1.2M",
    val downloads: String = "10B+",
    val rating: Double = 4.7,
    val isVerified: Boolean = true,
    val totalAppsPublished: Int = 12,
    val companyName: String? = null,
    val supportEmail: String? = null,
    val privacyPolicyUrl: String? = null,
    val totalDownloads: Long = 1000000000L,
    val developerSlug: String = ""
)

/**
 * App ratings & reviews model supporting developer replies and custom user-generated feedback.
 */
data class AppReview(
    val id: String,
    val appId: String,
    val authorName: String,
    val authorAvatarUrl: String? = null,
    val rating: Int, // 1 to 5 stars
    val comment: String,
    val timestamp: Long,
    val developerReply: String? = null,
    val developerReplyTimestamp: Long? = null,
    val likes: Int = 0,
    val verifiedInstall: Boolean = false,
    val edited: Boolean = false
)

/**
 * Threat intelligence levels for AVANYX Security Engine scan sequences.
 */
enum class SecurityStatus {
    UNKNOWN,
    SCANNING,
    SAFE,
    LOW_RISK,
    MEDIUM_RISK,
    HIGH_RISK,
    MALWARE_DETECTED
}

/**
 * Security validation snapshot details to satisfy safe download badges and installation pipeline requirements.
 */
data class AppSecurityCheck(
    val appId: String,
    val status: SecurityStatus,
    val lastScanTimestamp: Long = System.currentTimeMillis(),
    val signatureVerified: Boolean = true,
    val scanResultDetails: String = "No known security threats detected.",
    val riskScore: Int = 0 // Range: 0 (Completely Safe) to 100 (Critical Threat)
)

/**
 * Future Placeholder: Represents an item saved to the user's wishlist.
 */
data class WishlistItem(
    val id: String,
    val appId: String,
    val addedTimestamp: Long = System.currentTimeMillis()
)

/**
 * Future Placeholder: Represents an application currently installed on the local device.
 */
data class InstalledApp(
    val packageName: String,
    val versionName: String,
    val versionCode: Long,
    val lastUpdatedTimestamp: Long,
    val isSystemApp: Boolean = false
)

/**
 * Future Placeholder: Represents an item in the update queue/history.
 */
data class UpdateItem(
    val id: String,
    val appId: String,
    val status: DownloadStatus = DownloadStatus.IDLE,
    val scheduledTimestamp: Long = System.currentTimeMillis()
)

/**
 * Future Placeholder: Represents a notification message sent to the user.
 */
data class NotificationItem(
    val id: String,
    val title: String,
    val message: String,
    val timestamp: Long = System.currentTimeMillis(),
    val isRead: Boolean = false,
    val deepLinkUrl: String? = null
)

/**
 * Future Placeholder: Defines an app category for modular store filtering.
 */
data class Category(
    val id: String,
    val name: String,
    val iconUrl: String? = null,
    val parentCategoryId: String? = null
)

/**
 * Future Placeholder: Defines a curated collection of apps (e.g. "Editor's Choice").
 */
data class Collection(
    val id: String,
    val title: String,
    val description: String,
    val appIds: List<String> = emptyList(),
    val bannerImageUrl: String? = null
)

/**
 * Future Placeholder: Banner graphic displayed in home page carousels or featured rows.
 */
data class FeaturedBanner(
    val id: String,
    val title: String,
    val subtitle: String? = null,
    val imageUrl: String,
    val targetAppId: String? = null,
    val externalUrl: String? = null
)

/**
 * Future Placeholder: Search suggestion element for autocomplete results.
 */
data class SearchSuggestion(
    val query: String,
    val isTrending: Boolean = false,
    val categoryId: String? = null
)

/**
 * Future Placeholder: Declares access permissions required by an application.
 */
data class PermissionInfo(
    val name: String,
    val description: String,
    val isDangerous: Boolean = false
)

/**
 * Future Placeholder: Transparency card reporting how an application collects or shares user data.
 */
data class DataSafetyInfo(
    val appId: String,
    val dataCollected: List<String> = emptyList(),
    val dataShared: List<String> = emptyList(),
    val securityPractices: List<String> = emptyList()
)

data class UserSettings(
    val isDarkMode: Boolean = false,
    val wifiOnlyDownloads: Boolean = false,
    val notificationsEnabled: Boolean = true,
    val autoUpdateApps: Boolean = true,
    val sandboxMode: Boolean = false,
    val downloadLocation: String = "Internal Storage/AVANYX Downloads",
    val language: String = "English (US)"
)
