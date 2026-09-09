package com.avanyx.store.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.avanyx.store.data.database.AppDatabase
import com.avanyx.store.data.database.entity.NotificationEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun NotificationsScreen(
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val db = remember(context) { AppDatabase.getInstance(context) }
    val notificationDao = remember(db) { db.notificationDao() }

    val notificationsList by notificationDao.getNotifications().collectAsStateWithLifecycle(initialValue = emptyList())
    val unreadCount by notificationDao.getUnreadCount().collectAsStateWithLifecycle(initialValue = 0)

    // Pre-populate default notification items if Room table is empty
    LaunchedEffect(notificationsList) {
        if (notificationsList.isEmpty()) {
            scope.launch(Dispatchers.IO) {
                val defaultNotifications = listOf(
                    NotificationEntity(
                        id = "notif_1",
                        title = "AVANYX Protect Verification",
                        message = "All local APK packages verified cleanly against official SHA-256 signatures.",
                        timestamp = System.currentTimeMillis() - (10 * 60 * 1000),
                        isRead = false,
                        type = "SECURITY"
                    ),
                    NotificationEntity(
                        id = "notif_2",
                        title = "New App Version Available",
                        message = "AVANYX Launcher v2.4 brings dark frosted glass widget themes and gesture navigation.",
                        timestamp = System.currentTimeMillis() - (2 * 60 * 60 * 1000),
                        isRead = false,
                        type = "UPDATE"
                    ),
                    NotificationEntity(
                        id = "notif_3",
                        title = "Welcome to AVANYX Store",
                        message = "Explore high-performance native apps with sandbox security and zero fee distribution.",
                        timestamp = System.currentTimeMillis() - (24 * 60 * 60 * 1000),
                        isRead = true,
                        type = "WELCOME"
                    )
                )
                notificationDao.insertNotifications(defaultNotifications)
            }
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .testTag("notifications_screen")
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = MaterialTheme.colorScheme.onBackground
                    )
                }
                Text(
                    text = "Notification Center",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.padding(start = 8.dp)
                )
                if (unreadCount > 0) {
                    Spacer(modifier = Modifier.width(8.dp))
                    Surface(
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.primary
                    ) {
                        Text(
                            text = unreadCount.toString(),
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = Color.White,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                        )
                    }
                }
            }

            Row {
                if (unreadCount > 0) {
                    TextButton(
                        onClick = {
                            scope.launch(Dispatchers.IO) {
                                notificationDao.markAllAsRead()
                            }
                        }
                    ) {
                        Text(
                            text = "Mark all read",
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
                if (notificationsList.isNotEmpty()) {
                    IconButton(
                        onClick = {
                            scope.launch(Dispatchers.IO) {
                                notificationDao.clearAll()
                            }
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.DeleteSweep,
                            contentDescription = "Clear All Notifications",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (notificationsList.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(250.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = Icons.Default.NotificationsNone,
                                contentDescription = null,
                                modifier = Modifier.size(64.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = "No notifications yet",
                                style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            } else {
                items(notificationsList, key = { it.id }) { item ->
                    val formattedTime = remember(item.timestamp) {
                        val diffMs = System.currentTimeMillis() - item.timestamp
                        val minutes = diffMs / (1000 * 60)
                        val hours = minutes / 60
                        val days = hours / 24
                        when {
                            minutes < 1 -> "Just now"
                            minutes < 60 -> "${minutes}m ago"
                            hours < 24 -> "${hours}h ago"
                            days < 7 -> "${days}d ago"
                            else -> SimpleDateFormat("MMM dd", Locale.getDefault()).format(Date(item.timestamp))
                        }
                    }

                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = if (item.isRead) MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                        else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.85f),
                        border = BorderStroke(
                            1.dp,
                            if (item.isRead) MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
                            else MaterialTheme.colorScheme.primary.copy(alpha = 0.35f)
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                if (!item.isRead) {
                                    scope.launch(Dispatchers.IO) {
                                        notificationDao.markAsRead(item.id)
                                    }
                                }
                            }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(
                                        when (item.type.uppercase()) {
                                            "SECURITY" -> Color(0xFF10B981).copy(alpha = 0.2f)
                                            "UPDATE" -> MaterialTheme.colorScheme.primaryContainer
                                            else -> Color(0xFFF59E0B).copy(alpha = 0.2f)
                                        }
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = when (item.type.uppercase()) {
                                        "SECURITY" -> Icons.Default.Security
                                        "UPDATE" -> Icons.Default.SystemUpdate
                                        else -> Icons.Default.Notifications
                                    },
                                    contentDescription = null,
                                    tint = when (item.type.uppercase()) {
                                        "SECURITY" -> Color(0xFF10B981)
                                        "UPDATE" -> MaterialTheme.colorScheme.primary
                                        else -> Color(0xFFF59E0B)
                                    },
                                    modifier = Modifier.size(20.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(14.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = item.title,
                                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = formattedTime,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = item.message,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
