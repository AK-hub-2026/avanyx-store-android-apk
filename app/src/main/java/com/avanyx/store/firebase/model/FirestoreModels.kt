package com.avanyx.store.firebase.model

import com.google.firebase.firestore.DocumentId
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
    val developerUid: String = "",
    val ownerUid: String = "",
    val publicDeveloperId: String = "",
    val developerSlug: String = "",
    val displayName: String = "",
    val organizationName: String = "",
    val name: String = "",
    val email: String = "",
    val bio: String = "",
    val shortDescription: String = "",
    val country: String = "",
    val avatarUrl: String = "",
    val logoUrl: String = "",
    val bannerUrl: String = "",
    val verified: Boolean = false,
    val isVerified: Boolean = false,
    val developerStatus: String = "",
    val officialWebsite: String = "",
    val websiteUrl: String = "",
    val website: String = "",
    val githubUrl: String = "",
    val instagramUrl: String = "",
    val whatsappUrl: String = "",
    val youtubeUrl: String = "",
    val facebookUrl: String = "",
    val extraOtherLinks: String = "",
    val otherLinks: List<String> = emptyList(),
    val totalAppsPublished: Int = 0,
    val companyName: String = "",
    val supportEmail: String = "",
    val privacyPolicyUrl: String = "",
    val totalDownloads: Long = 0L,
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
    @DocumentId
    val id: String = "",
    val name: String = "",
    val developer: String = "",
    val developerUid: String = "",
    val category: String = "",
    val categoryId: String = "",
    val iconText: String = "",
    val iconBgColorHex: String = "#6750A4",
    val iconUrl: String = "",
    val logoUrl: String = "",
    val bannerUrl: String = "",
    val screenshots: List<String> = emptyList(),
    val sizeMb: String = "0 MB",
    val rating: Double = 0.0,
    val isGame: Boolean = false,
    val isFeatured: Boolean = false,
    val packageName: String = "",
    val downloadUrl: String = "",
    val checksumSha256: String = "",
    val version: String = "1.0.0",
    val versionCode: Long = 1L,
    val changelog: String = "",
    val fullDescription: String = "",
    val features: List<String> = emptyList(),
    val isPaid: Boolean = false,
    val price: Double = 0.0,
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
    val userName: String = "",
    val authorAvatarUrl: String = "",
    val userAvatarUrl: String = "",
    val rating: Int = 5,
    val comment: String = "",
    val timestamp: Long = System.currentTimeMillis(),
    val helpfulCount: Int = 0,
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
    val bannerImageUrl: String = "",
    val targetAppId: String = "",
    val targetType: String = "APP",
    val badgeText: String = "FEATURED",
    val displayOrder: Int = 0,
    val order: Int = 0,
    val gradient: String = "from-[#1E142F] to-[#12131C]",
    val ctaText: String = "View App",
    val isActive: Boolean = true
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

@IgnoreExtraProperties
data class FirestorePurchase(
    val id: String = "",
    val userId: String = "",
    val appId: String = "",
    val appName: String = "",
    val productId: String = "",
    val itemName: String = "",
    val amount: Double = 0.0,
    val currency: String = "INR",
    val paymentMethod: String = "UPI_APP",
    val status: String = "SUCCESS",
    val timestamp: Long = System.currentTimeMillis(),
    val transactionRef: String = "",
    val userEmail: String = "",
    val purchaseToken: String = "",
    val redeemCode: String = ""
) {
    @get:com.google.firebase.firestore.Exclude
    val transactionId: String
        get() = id.ifBlank { transactionRef }
}

@IgnoreExtraProperties
data class FirestoreProduct(
    val id: String = "",
    val appId: String = "",
    val title: String = "",
    val description: String = "",
    val price: Double = 0.0,
    val currency: String = "INR",
    val type: String = "INAPP", // INAPP, SUBSCRIPTION
    val active: Boolean = true,
    val createdAt: Long = System.currentTimeMillis()
)

@IgnoreExtraProperties
data class FirestoreReward(
    val id: String = "",
    val title: String = "",
    val description: String = "",
    val pointsCost: Int = 0,
    val couponCode: String = "",
    val discountPercent: Int = 0,
    val category: String = "GENERAL", // FESTIVAL, REFERRAL, BADGE, COUPON
    val badgeIcon: String = "star",
    val isFestival: Boolean = false,
    val expiryTimestamp: Long = 0L
)

@IgnoreExtraProperties
data class FirestoreRewardHistory(
    val id: String = "",
    val userId: String = "",
    val rewardId: String = "",
    val rewardTitle: String = "",
    val pointsDelta: Int = 0, // e.g. +50 for referral, -100 for redeemed coupon
    val type: String = "EARNED", // EARNED, REDEEMED, FESTIVAL_BONUS, REFERRAL_BONUS
    val timestamp: Long = System.currentTimeMillis()
)

@IgnoreExtraProperties
data class FirestorePurchaseNotification(
    val id: String = "",
    val userId: String = "",
    val purchaseId: String = "",
    val title: String = "",
    val message: String = "",
    val amount: Double = 0.0,
    val appName: String = "",
    val isRead: Boolean = false,
    val timestamp: Long = System.currentTimeMillis()
)
