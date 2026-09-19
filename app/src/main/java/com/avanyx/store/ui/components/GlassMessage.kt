package com.avanyx.store.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

enum class GlassMessageType {
    ERROR,
    WARNING,
    INFO,
    SUCCESS
}

data class GlassMessageData(
    val title: String,
    val description: String,
    val type: GlassMessageType = GlassMessageType.ERROR,
    val actionLabel: String? = null,
    val onAction: (() -> Unit)? = null
)

@Composable
fun GlassMessageCard(
    messageData: GlassMessageData,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
    autoDismissMs: Long? = 5000L
) {
    if (autoDismissMs != null && autoDismissMs > 0) {
        LaunchedEffect(messageData) {
            delay(autoDismissMs)
            onDismiss()
        }
    }

    val (accentColor, icon, containerBg, border) = when (messageData.type) {
        GlassMessageType.ERROR -> Quadruple(
            Color(0xFFEF4444),
            Icons.Default.ErrorOutline,
            Color(0xFF2D1215).copy(alpha = 0.85f),
            Color(0xFFEF4444).copy(alpha = 0.35f)
        )
        GlassMessageType.WARNING -> Quadruple(
            Color(0xFFF59E0B),
            Icons.Default.WarningAmber,
            Color(0xFF2E2310).copy(alpha = 0.85f),
            Color(0xFFF59E0B).copy(alpha = 0.35f)
        )
        GlassMessageType.INFO -> Quadruple(
            Color(0xFF3B82F6),
            Icons.Default.Info,
            Color(0xFF101E38).copy(alpha = 0.85f),
            Color(0xFF3B82F6).copy(alpha = 0.35f)
        )
        GlassMessageType.SUCCESS -> Quadruple(
            Color(0xFF10B981),
            Icons.Default.CheckCircleOutline,
            Color(0xFF0D281E).copy(alpha = 0.85f),
            Color(0xFF10B981).copy(alpha = 0.35f)
        )
    }

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .testTag("glass_message_card"),
        shape = RoundedCornerShape(20.dp),
        color = containerBg,
        border = BorderStroke(1.dp, border),
        shadowElevation = 8.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(accentColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = messageData.title,
                    tint = accentColor,
                    modifier = Modifier.size(22.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = messageData.title,
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = messageData.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White.copy(alpha = 0.8f)
                )

                if (messageData.actionLabel != null && messageData.onAction != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(
                        onClick = {
                            messageData.onAction.invoke()
                            onDismiss()
                        },
                        contentPadding = PaddingValues(horizontal = 0.dp, vertical = 0.dp),
                        modifier = Modifier.height(28.dp)
                    ) {
                        Text(
                            text = messageData.actionLabel,
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                            color = accentColor
                        )
                    }
                }
            }

            IconButton(
                onClick = onDismiss,
                modifier = Modifier.size(32.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Dismiss",
                    tint = Color.White.copy(alpha = 0.6f),
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

private data class Quadruple<A, B, C, D>(
    val first: A,
    val second: B,
    val third: C,
    val fourth: D
)
