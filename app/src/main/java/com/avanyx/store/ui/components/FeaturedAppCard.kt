package com.avanyx.store.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.avanyx.store.data.model.StoreApp
import com.avanyx.store.ui.theme.AvanyxGradientEnd
import com.avanyx.store.ui.theme.AvanyxGradientStart

@Composable
fun FeaturedAppCard(
    app: StoreApp,
    onClick: () -> Unit,
    onInstallClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val isBuiltInStoreApp = remember(app.packageName, app.id, app.name, context.packageName) {
        app.packageName == context.packageName ||
        app.packageName == "com.avanyx.appstore.dev" ||
        app.packageName == "com.avanyx.store" ||
        app.id.equals("avanyx_store", ignoreCase = true) ||
        app.name.contains("AVANYX Store", ignoreCase = true)
    }

    val currentAppVersionCode = remember(context) {
        try {
            if (android.os.Build.VERSION.SDK_INT >= 28) {
                context.packageManager.getPackageInfo(context.packageName, 0).longVersionCode
            } else {
                @Suppress("DEPRECATION")
                context.packageManager.getPackageInfo(context.packageName, 0).versionCode.toLong()
            }
        } catch (_: Exception) {
            7L
        }
    }
    val hasStoreUpdate = isBuiltInStoreApp && (app.versionCode > currentAppVersionCode)

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(200.dp)
            .clip(RoundedCornerShape(24.dp))
            .background(
                brush = Brush.linearGradient(
                    colors = listOf(AvanyxGradientStart, AvanyxGradientEnd)
                )
            )
            .clickable(onClick = onClick)
            .testTag("featured_app_card_${app.id}")
    ) {
        // Overlay label top-right
        Surface(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(16.dp),
            color = Color.White.copy(alpha = 0.2f),
            shape = RoundedCornerShape(100.dp)
        ) {
            Text(
                text = if (app.isGame) "Featured Game" else "Featured App",
                color = Color.White,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
            )
        }

        // Bottom Content
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(20.dp)
        ) {
            Text(
                text = app.name,
                color = Color.White,
                style = MaterialTheme.typography.headlineSmall.copy(
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 22.sp
                )
            )
            
            Text(
                text = app.shortDescription,
                color = Color.White.copy(alpha = 0.85f),
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 1
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Action Pill
                if (isBuiltInStoreApp) {
                    if (hasStoreUpdate) {
                        Surface(
                            onClick = onInstallClick,
                            shape = RoundedCornerShape(100.dp),
                            color = Color(0xFF2563EB),
                            contentColor = Color.White,
                            modifier = Modifier.testTag("featured_update_${app.id}")
                        ) {
                            Text(
                                text = "Update",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 18.dp, vertical = 6.dp)
                            )
                        }
                    } else {
                        Surface(
                            shape = RoundedCornerShape(100.dp),
                            color = Color.White.copy(alpha = 0.25f),
                            contentColor = Color.White,
                            modifier = Modifier.testTag("featured_installed_${app.id}")
                        ) {
                            Text(
                                text = "Installed",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                            )
                        }
                    }
                } else {
                    Surface(
                        onClick = onInstallClick,
                        shape = RoundedCornerShape(100.dp),
                        color = Color.White,
                        contentColor = AvanyxGradientStart,
                        modifier = Modifier.testTag("featured_install_${app.id}")
                    ) {
                        Text(
                            text = "Install",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 18.dp, vertical = 6.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.width(8.dp))

                // Category tag
                Surface(
                    shape = RoundedCornerShape(100.dp),
                    color = Color.White.copy(alpha = 0.2f),
                    contentColor = Color.White
                ) {
                    Text(
                        text = app.category,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
            }
        }
    }
}
