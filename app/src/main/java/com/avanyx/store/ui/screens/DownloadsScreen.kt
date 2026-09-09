package com.avanyx.store.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import com.avanyx.store.data.model.DownloadInfo
import com.avanyx.store.data.model.DownloadStatus
import com.avanyx.store.download.DownloadManagerEngine

@Composable
fun DownloadsScreen(
    onBack: () -> Unit,
    onShowMessage: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val downloadEngine = remember(context) { DownloadManagerEngine.getInstance(context) }
    val downloadsMap by downloadEngine.downloadsMap.collectAsStateWithLifecycle()

    val downloadsList = remember(downloadsMap) { downloadsMap.values.toList() }

    val activeList = remember(downloadsList) {
        downloadsList.filter {
            it.status == DownloadStatus.DOWNLOADING ||
                    it.status == DownloadStatus.PAUSED ||
                    it.status == DownloadStatus.PENDING ||
                    it.status == DownloadStatus.WAITING ||
                    it.status == DownloadStatus.RETRYING ||
                    it.status == DownloadStatus.VERIFYING ||
                    it.status == DownloadStatus.INSTALLING
        }
    }

    val completedList = remember(downloadsList) {
        downloadsList.filter { it.status == DownloadStatus.COMPLETED }
    }

    val failedList = remember(downloadsList) {
        downloadsList.filter { it.status == DownloadStatus.FAILED }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .testTag("downloads_screen")
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
                    text = "Downloads & Storage",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.padding(start = 8.dp)
                )
            }

            if (completedList.isNotEmpty()) {
                TextButton(onClick = {
                    downloadEngine.clearCompletedDownloads()
                    onShowMessage("Cleared completed download queue.")
                }) {
                    Text(
                        text = "Clear History",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Active Downloads
            item {
                Text(
                    text = "Active Downloads (${activeList.size})",
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.primary
                )
            }

            if (activeList.isEmpty()) {
                item {
                    Text(
                        text = "No active downloads in progress.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                items(activeList, key = { it.appId }) { item ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = item.appName,
                                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                                    )
                                    Text(
                                        text = when (item.status) {
                                            DownloadStatus.PAUSED -> "Paused"
                                            DownloadStatus.VERIFYING -> "Verifying SHA-256..."
                                            DownloadStatus.INSTALLING -> "Installing Package..."
                                            else -> "Downloading... ${String.format("%.1f", item.speedKbps)} KB/s"
                                        },
                                        style = MaterialTheme.typography.bodySmall,
                                        color = if (item.status == DownloadStatus.PAUSED) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                                    )
                                }

                                Row {
                                    if (item.status == DownloadStatus.DOWNLOADING) {
                                        IconButton(onClick = {
                                            downloadEngine.pauseDownload(item.appId)
                                            onShowMessage("Download paused")
                                        }) {
                                            Icon(imageVector = Icons.Default.Pause, contentDescription = "Pause")
                                        }
                                    } else if (item.status == DownloadStatus.PAUSED) {
                                        IconButton(onClick = {
                                            downloadEngine.startOrResumeDownload(item.appId, item.appName, "")
                                            onShowMessage("Download resumed")
                                        }) {
                                            Icon(imageVector = Icons.Default.PlayArrow, contentDescription = "Resume")
                                        }
                                    }

                                    IconButton(onClick = {
                                        downloadEngine.cancelDownload(item.appId)
                                        onShowMessage("Download canceled")
                                    }) {
                                        Icon(imageVector = Icons.Default.Close, contentDescription = "Cancel", tint = MaterialTheme.colorScheme.error)
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            LinearProgressIndicator(
                                progress = { item.progress },
                                color = MaterialTheme.colorScheme.primary,
                                trackColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(6.dp)
                                    .clip(CircleShape)
                            )

                            Spacer(modifier = Modifier.height(6.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "${item.downloadedBytes / (1024 * 1024)} MB / ${item.totalSizeBytes / (1024 * 1024)} MB",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "${(item.progress * 100).toInt()}%",
                                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }
                }
            }

            // Failed Downloads
            if (failedList.isNotEmpty()) {
                item {
                    Text(
                        text = "Failed Downloads (${failedList.size})",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.error
                    )
                }

                items(failedList, key = { it.appId }) { item ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.6f))
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = item.appName,
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                                )
                                Text(
                                    text = item.errorMessage ?: "Download failed",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onErrorContainer
                                )
                            }
                            Button(
                                onClick = { downloadEngine.retryDownload(item.appId, item.appName, "") },
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                            ) {
                                Text("Retry", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }

            item {
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
            }

            // Completed Downloads
            item {
                Text(
                    text = "Completed & Verified (${completedList.size})",
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.primary
                )
            }

            if (completedList.isEmpty()) {
                item {
                    Text(
                        text = "No completed installations in history.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                items(completedList, key = { it.appId }) { item ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(MaterialTheme.colorScheme.secondaryContainer),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = "Completed",
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(16.dp))
                            Column {
                                Text(
                                    text = item.appName,
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                                )
                                Text(
                                    text = "Installed • Verified SHA-256",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        IconButton(onClick = { onShowMessage("Opening ${item.appName}!") }) {
                            Icon(imageVector = Icons.Default.Launch, contentDescription = "Launch")
                        }
                    }
                }
            }
        }
    }
}
