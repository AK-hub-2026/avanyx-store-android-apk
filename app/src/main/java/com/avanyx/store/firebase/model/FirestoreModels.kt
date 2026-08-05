package com.avanyx.store.firebase.model

import com.google.firebase.firestore.IgnoreExtraProperties

@IgnoreExtraProperties
data class FirestoreUser(
    val uid: String = "",
    val displayName: String = "",
    val email: String = "",
    val phoneNumber: String = "",
    val photoUrl: String = "",
    val provider: String = "email",
    val role: String = "USER", // USER, DEVELOPER, ADMIN
    val status: String = "ACTIVE",
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val lastLogin: Long = System.currentTimeMillis()
)

@IgnoreExtraProperties
data class FirestoreDeveloper(
    val id: String = "",
    val uid: String = "",
    val name: String = "",
    val email: String = "",
    val website: String = "",
    val isVerified: Boolean = false,
    val totalAppsPublished: Int = 0,
    val companyName: String = "",
    val supportEmail: String = "",
    val privacyPolicyUrl: String = "",
    val totalDownloads: Long = 0L,
    val developerSlug: String = "",
    val createdAt: Long = System.currentTimeMillis()
)

@IgnoreExtraProperties
data class FirestoreAdmin(
    val uid: String = "",
    val email: String = "",
    val displayName: String = "",
    val permissions: List<String> = listOf("MODERATE_APPS", "MANAGE_USERS", "VIEW_ANALYTICS"),
    val createdAt: Long = System.currentTimeMillis()
)

@IgnoreExtraProperties
data class FirestoreApp(
    val id: String = "",
    val name: String = "",
    val developer: String = "",
    val developerUid: String = "",
    val category: String = "",
    val categoryId: String = "",
    val iconText: String = "",
    val iconBgColorHex: String = "#6750A4",
    val sizeMb: String = "0 MB",
    val rating: Double = 0.0,
    val isGame: Boolean = false,
    val isFeatured: Boolean = false,
    val packageName: String = "",
    val downloadUrl: String = "",
    val checksumSha256: String = "",
    val version: String = "1.0.0",
    val fullDescription: String = "",
    val features: List<String> = emptyList(),
    val status: String = "PUBLISHED", // DRAFT, PENDING_REVIEW, PUBLISHED, REJECTED
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

@IgnoreExtraProperties
data class FirestoreAppVersion(
    val id: String = "",
    val appId: String = "",
    val versionName: String = "1.0.0",
    val versionCode: Long = 1L,
    val downloadUrl: String = "",
    val changelog: String = "",
    val releaseDate: String = "",
    val isMandatory: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)

@IgnoreExtraProperties
data class FirestoreCategory(
    val id: String = "",
    val name: String = "",
    val iconName: String = "",
    val appCount: Int = 0
)

@IgnoreExtraProperties
data class FirestoreReview(
    val id: String = "",
    val appId: String = "",
    val userId: String = "",
    val authorName: String = "",
    val authorAvatarUrl: String = "",
    val rating: Int = 5,
    val comment: String = "",
    val timestamp: Long = System.currentTimeMillis(),
    val developerReply: String = "",
    val developerReplyTimestamp: Long = 0L,
    val likes: Int = 0,
    val verifiedInstall: Boolean = true
)

@IgnoreExtraProperties
data class FirestoreRating(
    val id: String = "",
    val appId: String = "",
    val userId: String = "",
    val rating: Int = 5,
    val timestamp: Long = System.currentTimeMillis()
)

@IgnoreExtraProperties
data class FirestoreWishlistItem(
    val id: String = "",
    val userId: String = "",
    val appId: String = "",
    val addedTimestamp: Long = System.currentTimeMillis()
)

@IgnoreExtraProperties
data class FirestoreDownload(
    val id: String = "",
    val userId: String = "",
    val appId: String = "",
    val appName: String = "",
    val status: String = "COMPLETED",
    val timestamp: Long = System.currentTimeMillis()
)

@IgnoreExtraProperties
data class FirestoreNotification(
    val id: String = "",
    val userId: String = "",
    val title: String = "",
    val message: String = "",
    val timestamp: Long = System.currentTimeMillis(),
    val isRead: Boolean = false,
    val type: String = "SYSTEM"
)

@IgnoreExtraProperties
data class FirestoreSettings(
    val userId: String = "",
    val isDarkMode: Boolean = false,
    val wifiOnlyDownloads: Boolean = false,
    val notificationsEnabled: Boolean = true,
    val autoUpdateApps: Boolean = true,
    val language: String = "English (US)",
    val updatedAt: Long = System.currentTimeMillis()
)

@IgnoreExtraProperties
data class FirestoreSearchHistory(
    val id: String = "",
    val userId: String = "",
    val query: String = "",
    val timestamp: Long = System.currentTimeMillis()
)

@IgnoreExtraProperties
data class FirestoreFeaturedBanner(
    val id: String = "",
    val title: String = "",
    val subtitle: String = "",
    val imageUrl: String = "",
    val targetAppId: String = ""
)

@IgnoreExtraProperties
data class FirestoreUpdateHistory(
    val id: String = "",
    val userId: String = "",
    val appId: String = "",
    val fromVersion: String = "",
    val toVersion: String = "",
    val timestamp: Long = System.currentTimeMillis()
)
