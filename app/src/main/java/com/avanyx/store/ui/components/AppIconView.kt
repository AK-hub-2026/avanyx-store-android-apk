package com.avanyx.store.ui.components

import android.graphics.drawable.Drawable
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Android
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.avanyx.store.R
import com.avanyx.store.data.database.entity.InstalledAppEntity
import com.avanyx.store.data.model.StoreApp

@Composable
fun AppIconView(
    app: StoreApp,
    size: Dp = 60.dp,
    cornerRadius: Dp = 16.dp,
    fontSize: TextUnit = 20.sp,
    modifier: Modifier = Modifier
) {
    AppIconView(
        appName = app.name,
        appId = app.id,
        iconUrl = app.iconUrl,
        logoUrl = app.logoUrl,
        iconBgColorHex = app.iconBgColorHex,
        iconText = app.iconText,
        size = size,
        cornerRadius = cornerRadius,
        fontSize = fontSize,
        modifier = modifier
    )
}

@Composable
fun AppIconView(
    appName: String,
    appId: String = "",
    iconUrl: String = "",
    logoUrl: String = "",
    iconBgColorHex: String = "",
    iconText: String = "",
    size: Dp = 48.dp,
    cornerRadius: Dp = 12.dp,
    fontSize: TextUnit = 16.sp,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val imageTarget = when {
        iconUrl.isNotBlank() -> iconUrl
        logoUrl.isNotBlank() -> logoUrl
        else -> null
    }

    val isAvanyxStore = appId.contains("avanyx", ignoreCase = true) ||
            appName.contains("AVANYX Store", ignoreCase = true) ||
            appName.equals("AVANYX", ignoreCase = true)

    val bgColor = try {
        Color(android.graphics.Color.parseColor(iconBgColorHex.ifBlank { "#6750A4" }))
    } catch (_: Exception) {
        Color(0xFF6750A4)
    }

    Box(
        modifier = modifier
            .size(size)
            .clip(RoundedCornerShape(cornerRadius))
            .background(bgColor),
        contentAlignment = Alignment.Center
    ) {
        if (imageTarget != null && imageTarget.startsWith("http")) {
            AsyncImage(
                model = ImageRequest.Builder(context)
                    .data(imageTarget)
                    .crossfade(true)
                    .build(),
                contentDescription = "$appName icon",
                contentScale = ContentScale.Crop,
                modifier = Modifier.size(size)
            )
        } else if (isAvanyxStore) {
            Image(
                painter = painterResource(id = R.drawable.avanyx_logo),
                contentDescription = "AVANYX Store Logo",
                modifier = Modifier.size(size)
            )
        } else {
            val label = when {
                iconText.isNotBlank() -> iconText
                appName.length >= 2 -> appName.take(2).uppercase()
                appName.isNotEmpty() -> appName.uppercase()
                else -> "AV"
            }
            Text(
                text = label,
                color = Color.White,
                fontWeight = FontWeight.ExtraBold,
                fontSize = fontSize
            )
        }
    }
}

@Composable
fun InstalledAppIconView(
    app: InstalledAppEntity,
    matchedStoreApp: StoreApp?,
    size: Dp = 48.dp,
    cornerRadius: Dp = 12.dp,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current

    if (matchedStoreApp != null) {
        AppIconView(
            app = matchedStoreApp,
            size = size,
            cornerRadius = cornerRadius,
            fontSize = (size.value * 0.35f).sp,
            modifier = modifier
        )
    } else {
        val packageIconDrawable: Drawable? = remember(app.packageName) {
            try {
                context.packageManager.getApplicationIcon(app.packageName)
            } catch (_: Throwable) {
                null
            }
        }

        Box(
            modifier = modifier
                .size(size)
                .clip(RoundedCornerShape(cornerRadius))
                .background(Color(0xFF3B82F6).copy(alpha = 0.2f)),
            contentAlignment = Alignment.Center
        ) {
            if (packageIconDrawable != null) {
                AsyncImage(
                    model = ImageRequest.Builder(context)
                        .data(packageIconDrawable)
                        .crossfade(true)
                        .build(),
                    contentDescription = "${app.appName} icon",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.size(size)
                )
            } else {
                val label = if (app.appName.length >= 2) app.appName.take(2).uppercase() else "AP"
                Text(
                    text = label,
                    color = Color(0xFF3B82F6),
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = (size.value * 0.35f).sp
                )
            }
        }
    }
}

