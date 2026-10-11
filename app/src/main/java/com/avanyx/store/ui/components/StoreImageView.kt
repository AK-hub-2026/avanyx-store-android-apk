package com.avanyx.store.ui.components

import android.graphics.BitmapFactory
import android.util.Base64
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import coil.compose.AsyncImage

/**
 * Universal Image Composable supporting:
 * 1. HTTP/HTTPS Network URLs (via Coil AsyncImage)
 * 2. Base64 Data URIs (data:image/png;base64,... or raw Base64 from Developer Console)
 * 3. Graceful fallback placeholder
 */
@Composable
fun StoreImageView(
    urlOrData: String,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    contentScale: ContentScale = ContentScale.Crop,
    placeholder: (@Composable () -> Unit)? = null
) {
    val cleanUrl = remember(urlOrData) { urlOrData.trim() }

    val decodedBitmap = remember(cleanUrl) {
        if (cleanUrl.isNotBlank() && (cleanUrl.startsWith("data:image") || cleanUrl.startsWith("data:application") || (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://") && cleanUrl.length > 100))) {
            try {
                var base64Data = if (cleanUrl.contains("base64,")) {
                    cleanUrl.substringAfter("base64,")
                } else {
                    cleanUrl
                }.trim().replace("\n", "").replace("\r", "").replace(" ", "")

                // Fix missing padding if truncated
                val missingPadding = (4 - (base64Data.length % 4)) % 4
                if (missingPadding > 0) {
                    base64Data += "=".repeat(missingPadding)
                }

                val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)
                BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
            } catch (_: Throwable) {
                null
            }
        } else null
    }

    Box(modifier = modifier) {
        when {
            decodedBitmap != null -> {
                Image(
                    bitmap = decodedBitmap.asImageBitmap(),
                    contentDescription = contentDescription,
                    contentScale = contentScale,
                    modifier = Modifier.fillMaxSize()
                )
            }
            cleanUrl.startsWith("http") -> {
                AsyncImage(
                    model = cleanUrl,
                    contentDescription = contentDescription,
                    contentScale = contentScale,
                    modifier = Modifier.fillMaxSize()
                )
            }
            placeholder != null -> {
                placeholder()
            }
            else -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                )
            }
        }
    }
}
