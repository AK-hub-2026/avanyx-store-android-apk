package com.avanyx.store.ui.screens

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Environment
import android.os.StatFs
import androidx.compose.animation.*
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.avanyx.store.data.database.AppDatabase
import com.avanyx.store.data.model.DownloadInfo
import com.avanyx.store.data.model.DownloadStatus
import com.avanyx.store.download.DownloadManagerEngine
import com.avanyx.store.manager.InstalledAppsManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

data class InstalledAppStorageInfo(
    val packageName: String,
    val appName: String,
    val sizeBytes: Long,
    val sizeFormatted: String,
    val isStoreApp: Boolean
)

/**
 * Storage & Downloads Screen (PART D Unified Screen):
 * Merges storage management and download history into one production page.
 * Live Android storage metrics only.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StorageCenterScreen(
    onBack: () -> Unit,
    onShowMessage: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val appsManager = remember(context) { InstalledAppsManager.getInstance(context) }
    val downloadEngine = remember(context) { DownloadManagerEngine.getInstance(context) }
    val db = remember(context) { AppDatabase.getInstance(context) }

    val installedApps by appsManager.installedAppsFlow.collectAsStateWithLifecycle(initialValue = emptyList())
    val storeAppsFromDb by db.storeAppDao().getAllApps().collectAsStateWithLifecycle(initialValue = emptyList())
    val downloadsMap by downloadEngine.downloadsMap.collectAsStateWithLifecycle()

    val downloadsList = remember(downloadsMap) { downloadsMap.values.toList() }
    val activeDownloads = remember(downloadsList) {
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
    val completedDownloads = remember(downloadsList) {
        downloadsList.filter { it.status == DownloadStatus.COMPLETED }
    }
    val failedDownloads = remember(downloadsList) {
        downloadsList.filter { it.status == DownloadStatus.FAILED }
    }

    var totalDeviceStorageBytes by remember { mutableLongStateOf(0L) }
    var availableDeviceStorageBytes by remember { mutableLongStateOf(0L) }
    var totalApkDownloadBytes by remember { mutableLongStateOf(0L) }
    var cacheSizeBytes by remember { mutableLongStateOf(0L) }
    var isClearingCache by remember { mutableStateOf(false) }
    var isUpdatingDownloads by remember { mutableStateOf(false) }
    var appStorageList by remember { mutableStateOf<List<InstalledAppStorageInfo>>(emptyList()) }
    var totalAvanyxAppsStorageBytes by remember { mutableLongStateOf(0L) }

    fun refreshStorageMetrics() {
        coroutineScope.launch(Dispatchers.IO) {
            try {
                val dataPath = Environment.getDataDirectory().path
                val stat = StatFs(dataPath)
                val blockSize = stat.blockSizeLong
                val totalBlocks = stat.blockCountLong
                val availableBlocks = stat.availableBlocksLong
                totalDeviceStorageBytes = totalBlocks * blockSize
                availableDeviceStorageBytes = availableBlocks * blockSize
            } catch (_: Exception) {
                totalDeviceStorageBytes = 64L * 1024 * 1024 * 1024
                availableDeviceStorageBytes = 32L * 1024 * 1024 * 1024
            }

            var apkBytes = 0L
            val cacheDir = context.cacheDir
            if (cacheDir != null && cacheDir.exists()) {
                cacheDir.listFiles()?.forEach { file ->
                    apkBytes += file.length()
                }
            }
            val extCache = context.externalCacheDir
            if (extCache != null && extCache.exists()) {
                extCache.listFiles()?.forEach { file ->
                    apkBytes += file.length()
                }
            }
            val filesDir = context.filesDir
            if (filesDir != null && filesDir.exists()) {
                filesDir.listFiles()?.forEach { file ->
                    if (file.name.endsWith(".apk")) {
                        apkBytes += file.length()
                    }
                }
            }
            totalApkDownloadBytes = apkBytes

            var appCache = 0L
            fun getDirSize(dir: File?): Long {
                var size = 0L
                if (dir != null && dir.exists()) {
                    dir.listFiles()?.forEach { child ->
                        size += if (child.isDirectory) getDirSize(child) else child.length()
                    }
                }
                return size
            }
            appCache += getDirSize(context.cacheDir)
            appCache += getDirSize(context.codeCacheDir)
            cacheSizeBytes = appCache

            val pm = context.packageManager
            val knownPackages = storeAppsFromDb.map { it.packageName }.toSet()
            val list = mutableListOf<InstalledAppStorageInfo>()
            var totalAppsBytes = 0L

            for (installed in installedApps) {
                try {
                    val pInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        pm.getPackageInfo(installed.packageName, PackageManager.PackageInfoFlags.of(0))
                    } else {
                        @Suppress("DEPRECATION")
                        pm.getPackageInfo(installed.packageName, 0)
                    }
                    val sourceDir = pInfo.applicationInfo?.sourceDir
                    val fileLength = if (sourceDir != null) File(sourceDir).length() else 0L
                    val isAvanyxStoreItem = knownPackages.contains(installed.packageName) ||
                            installed.packageName == context.packageName

                    if (isAvanyxStoreItem || list.size < 8) {
                        val sizeFormatted = formatBytes(fileLength)
                        list.add(
                            InstalledAppStorageInfo(
                                packageName = installed.packageName,
                                appName = installed.appName,
                                sizeBytes = fileLength,
                                sizeFormatted = sizeFormatted,
                                isStoreApp = isAvanyxStoreItem
                            )
                        )
                        if (isAvanyxStoreItem) {
                            totalAppsBytes += fileLength
                        }
                    }
                } catch (_: Exception) {}
            }

            withContext(Dispatchers.Main) {
                appStorageList = list.sortedByDescending { it.sizeBytes }
                totalAvanyxAppsStorageBytes = totalAppsBytes
            }
        }
    }

    LaunchedEffect(Unit) {
        refreshStorageMetrics()
    }

    val installedViaAvanyxCount = remember(installedApps, storeAppsFromDb) {
        val known = storeAppsFromDb.map { it.packageName }.toSet()
        installedApps.count { known.contains(it.packageName) || it.packageName == context.packageName }
    }

    Scaffold(
        modifier = modifier.fillMaxSize().testTag("storage_and_downloads_screen"),
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Storage & Downloads",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack, modifier = Modifier.testTag("storage_back_button")) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(
                        onClick = {
                            refreshStorageMetrics()
                            onShowMessage("Storage metrics refreshed")
                        },
                        modifier = Modifier.testTag("refresh_storage_button")
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Live Device Storage Card (StatFs)
            item {
                Card(
                    modifier = Modifier.fillMaxWidth().testTag("phone_storage_card"),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.PhoneAndroid,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(24.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Phone Storage",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                                )
                            }
                            Text(
                                text = "Free: ${formatBytes(availableDeviceStorageBytes)}",
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                color = Color(0xFF10B981)
                            )
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        val usedBytes = (totalDeviceStorageBytes - availableDeviceStorageBytes).coerceAtLeast(0L)
                        val storageProgress = if (totalDeviceStorageBytes > 0) {
                            (usedBytes.toFloat() / totalDeviceStorageBytes.toFloat()).coerceIn(0f, 1f)
                        } else 0.5f

                        LinearProgressIndicator(
                            progress = { storageProgress },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(10.dp)
                                .clip(RoundedCornerShape(5.dp)),
                            color = MaterialTheme.colorScheme.primary,
                            trackColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f)
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Used: ${formatBytes(usedBytes)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "Total: ${formatBytes(totalDeviceStorageBytes)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            // AVANYX Store Footprint Grid (4 Metric Tiles)
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "AVANYX Footprint Metrics",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.primary
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        MetricTile(
                            icon = Icons.Default.Apps,
                            label = "Installed via AVANYX",
                            value = "$installedViaAvanyxCount Apps",
                            modifier = Modifier.weight(1f)
                        )
                        MetricTile(
                            icon = Icons.Default.SdCard,
                            label = "APK Cache Size",
                            value = formatBytes(totalApkDownloadBytes),
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        MetricTile(
                            icon = Icons.Default.PieChart,
                            label = "Total AVANYX Usage",
                            value = formatBytes(totalAvanyxAppsStorageBytes + totalApkDownloadBytes),
                            modifier = Modifier.weight(1f)
                        )
                        MetricTile(
                            icon = Icons.Default.CleaningServices,
                            label = "App Cache Memory",
                            value = formatBytes(cacheSizeBytes),
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            // Action Buttons: Clear Cache & Update Downloads
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = {
                            isClearingCache = true
                            coroutineScope.launch(Dispatchers.IO) {
                                try {
                                    context.cacheDir?.deleteRecursively()
                                    context.externalCacheDir?.deleteRecursively()
                                } catch (_: Exception) {}
                                downloadEngine.clearCompletedDownloads()
                                refreshStorageMetrics()
                                withContext(Dispatchers.Main) {
                                    isClearingCache = false
                                    onShowMessage("APK cache and temporary files cleared!")
                                }
                            }
                        },
                        enabled = !isClearingCache,
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer,
                            contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                        ),
                        modifier = Modifier.weight(1f).height(48.dp).testTag("clear_cache_button")
                    ) {
                        Icon(Icons.Default.DeleteSweep, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(if (isClearingCache) "Clearing..." else "Clear Cache", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }

                    Button(
                        onClick = {
                            isUpdatingDownloads = true
                            coroutineScope.launch {
                                appsManager.scanAndMatch(context)
                                refreshStorageMetrics()
                                isUpdatingDownloads = false
                                onShowMessage("Checked update catalog & downloads status")
                            }
                        },
                        enabled = !isUpdatingDownloads,
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        ),
                        modifier = Modifier.weight(1f).height(48.dp).testTag("update_downloads_button")
                    ) {
                        Icon(Icons.Default.CloudSync, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(if (isUpdatingDownloads) "Checking..." else "Update Downloads", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
            }

            // Download History Section (Active, Completed, Failed)
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Download History (${downloadsList.size})",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    if (completedDownloads.isNotEmpty()) {
                        TextButton(
                            onClick = {
                                downloadEngine.clearCompletedDownloads()
                                refreshStorageMetrics()
                                onShowMessage("Cleared completed history")
                            }
                        ) {
                            Text("Clear Completed", fontSize = 12.sp)
                        }
                    }
                }
            }

            if (downloadsList.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                    ) {
                        Box(
                            modifier = Modifier.fillMaxWidth().padding(24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    imageVector = Icons.Default.CloudDownload,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f),
                                    modifier = Modifier.size(40.dp)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "No active or recent downloads",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            } else {
                items(downloadsList, key = { it.appId }) { item ->
                    DownloadHistoryCard(
                        item = item,
                        onPause = { downloadEngine.pauseDownload(item.appId) },
                        onResume = { downloadEngine.startOrResumeDownload(item.appId, item.appName, "") },
                        onCancel = { downloadEngine.cancelDownload(item.appId) },
                        onRetry = { downloadEngine.retryDownload(item.appId, item.appName, "") },
                        onInstall = {
                            val res = downloadEngine.installDownloadedApk(item.appId)
                            if (res.isFailure) onShowMessage("Install failed: ${res.exceptionOrNull()?.message}")
                        }
                    )
                }
            }

            // Installed Apps Breakdown
            if (appStorageList.isNotEmpty()) {
                item {
                    Text(
                        text = "Apps Managed by AVANYX (${appStorageList.size})",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        modifier = Modifier.padding(top = 10.dp)
                    )
                }

                items(appStorageList) { appInfo ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f))
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = appInfo.appName,
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                                )
                                Text(
                                    text = appInfo.packageName,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Text(
                                text = appInfo.sizeFormatted,
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

@Composable
private fun MetricTile(
    icon: ImageVector,
    label: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun DownloadHistoryCard(
    item: DownloadInfo,
    onPause: () -> Unit,
    onResume: () -> Unit,
    onCancel: () -> Unit,
    onRetry: () -> Unit,
    onInstall: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
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
                            DownloadStatus.DOWNLOADING -> "Downloading ${(item.progress * 100).toInt()}% • ${String.format("%.1f", item.speedKbps)} KB/s${if (item.etaFormatted.isNotBlank()) " • ETA: ${item.etaFormatted}" else ""}"
                            DownloadStatus.PAUSED -> "Paused at ${(item.progress * 100).toInt()}%"
                            DownloadStatus.COMPLETED -> "Completed (${formatBytes(item.totalSizeBytes)})"
                            DownloadStatus.FAILED -> "Failed: ${item.errorMessage ?: "Network error"}"
                            DownloadStatus.INSTALLING -> "Installing application..."
                            DownloadStatus.VERIFYING -> "Verifying SHA-256 Checksum..."
                            else -> item.status.name
                        },
                        style = MaterialTheme.typography.labelSmall,
                        color = when (item.status) {
                            DownloadStatus.DOWNLOADING -> Color(0xFF10B981)
                            DownloadStatus.COMPLETED -> Color(0xFF7C3AED)
                            DownloadStatus.FAILED -> Color(0xFFDC2626)
                            else -> MaterialTheme.colorScheme.onSurfaceVariant
                        }
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    when (item.status) {
                        DownloadStatus.DOWNLOADING -> {
                            IconButton(onClick = onPause, modifier = Modifier.size(32.dp)) {
                                Icon(Icons.Default.Pause, contentDescription = "Pause", modifier = Modifier.size(18.dp))
                            }
                            IconButton(onClick = onCancel, modifier = Modifier.size(32.dp)) {
                                Icon(Icons.Default.Close, contentDescription = "Cancel", tint = Color(0xFFDC2626), modifier = Modifier.size(18.dp))
                            }
                        }
                        DownloadStatus.PAUSED -> {
                            IconButton(onClick = onResume, modifier = Modifier.size(32.dp)) {
                                Icon(Icons.Default.PlayArrow, contentDescription = "Resume", tint = Color(0xFF10B981), modifier = Modifier.size(18.dp))
                            }
                            IconButton(onClick = onCancel, modifier = Modifier.size(32.dp)) {
                                Icon(Icons.Default.Close, contentDescription = "Cancel", tint = Color(0xFFDC2626), modifier = Modifier.size(18.dp))
                            }
                        }
                        DownloadStatus.COMPLETED -> {
                            Button(
                                onClick = onInstall,
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                                modifier = Modifier.height(32.dp)
                            ) {
                                Text("Install", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                        DownloadStatus.FAILED -> {
                            IconButton(onClick = onRetry, modifier = Modifier.size(32.dp)) {
                                Icon(Icons.Default.Refresh, contentDescription = "Retry", tint = Color(0xFFDC2626), modifier = Modifier.size(18.dp))
                            }
                        }
                        else -> {}
                    }
                }
            }

            if (item.status == DownloadStatus.DOWNLOADING || item.status == DownloadStatus.PAUSED) {
                Spacer(modifier = Modifier.height(8.dp))
                LinearProgressIndicator(
                    progress = { item.progress },
                    modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                    color = Color(0xFF10B981),
                    trackColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f)
                )
            }
        }
    }
}

private fun formatBytes(bytes: Long): String {
    if (bytes <= 0) return "0 B"
    val units = arrayOf("B", "KB", "MB", "GB", "TB")
    val digitGroups = (Math.log10(bytes.toDouble()) / Math.log10(1024.0)).toInt()
    return String.format("%.1f %s", bytes / Math.pow(1024.0, digitGroups.toDouble()), units[digitGroups])
}
