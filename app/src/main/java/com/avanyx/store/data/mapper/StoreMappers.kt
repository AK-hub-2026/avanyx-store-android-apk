package com.avanyx.store.data.mapper

import com.avanyx.store.data.database.entity.AppReviewEntity
import com.avanyx.store.data.database.entity.AppUpdateEntity
import com.avanyx.store.data.database.entity.CategoryEntity
import com.avanyx.store.data.database.entity.DeveloperEntity
import com.avanyx.store.data.database.entity.NotificationEntity
import com.avanyx.store.data.database.entity.RecentActivityEntity
import com.avanyx.store.data.database.entity.StoreAppEntity
import com.avanyx.store.data.database.entity.UserSettingsEntity
import com.avanyx.store.data.model.AppReview
import com.avanyx.store.data.model.AppUpdateInfo
import com.avanyx.store.data.model.Category
import com.avanyx.store.data.model.DeveloperInfo
import com.avanyx.store.data.model.NotificationItem
import com.avanyx.store.data.model.StoreApp
import com.avanyx.store.data.database.Converters

private val converters = Converters()

fun StoreAppEntity.toDomain(): StoreApp {
    return StoreApp(
        id = id,
        name = name,
        developer = developer,
        category = category,
        iconText = iconText,
        iconBgColorHex = iconBgColorHex,
        version = version,
        versionCode = versionCode,
        changelog = changelog,
        size = sizeMb,
        shortDescription = if (fullDescription.length > 100) fullDescription.take(100) + "..." else fullDescription,
        fullDescription = fullDescription,
        features = converters.toListFromString(featuresJson),
        rating = rating,
        isGame = isGame,
        isFeatured = isFeatured,
        packageName = packageName,
        downloadUrl = downloadUrl,
        checksumSha256 = checksumSha256
    )
}

fun StoreApp.toEntity(
    categoryId: String = "utilities",
    riskScore: String = "LOW"
): StoreAppEntity {
    return StoreAppEntity(
        id = id,
        name = name,
        developer = developer,
        category = category,
        categoryId = categoryId,
        iconBgColorHex = iconBgColorHex,
        iconText = iconText,
        sizeMb = size,
        rating = rating,
        isGame = isGame,
        isFeatured = isFeatured,
        packageName = packageName,
        downloadUrl = downloadUrl,
        checksumSha256 = checksumSha256,
        version = version,
        versionCode = versionCode,
        changelog = changelog,
        fullDescription = fullDescription,
        featuresJson = converters.fromListToString(features),
        riskScore = riskScore
    )
}

fun CategoryEntity.toDomain(): Category {
    return Category(
        id = id,
        name = name,
        iconUrl = null,
        parentCategoryId = null
    )
}

fun DeveloperEntity.toDomain(): DeveloperInfo {
    return DeveloperInfo(
        id = id,
        name = name,
        email = "support@${name.lowercase().replace(" ", "")}.com",
        isVerified = verified,
        totalAppsPublished = totalApps,
        totalDownloads = 100000L,
        developerSlug = id
    )
}

fun NotificationEntity.toDomain(): NotificationItem {
    return NotificationItem(
        id = id,
        title = title,
        message = message,
        timestamp = timestamp,
        isRead = isRead,
        deepLinkUrl = null
    )
}

fun AppUpdateEntity.toDomain(): AppUpdateInfo {
    return AppUpdateInfo(
        appId = appId,
        packageName = packageName,
        appName = appName,
        currentVersion = currentVersion,
        currentVersionCode = currentVersionCode,
        latestVersion = newVersion,
        latestVersionCode = newVersionCode,
        updateSize = updateSize,
        changelog = releaseNotes,
        downloadUrl = downloadUrl,
        checksumSha256 = checksumSha256,
        isMandatory = false,
        releaseDate = "Recent"
    )
}

fun AppReviewEntity.toDomain(): AppReview {
    return AppReview(
        id = id,
        appId = appId,
        authorName = userName,
        rating = rating.toInt(),
        comment = comment,
        timestamp = createdTimestamp
    )
}
