package com.avanyx.store.ui.screens

import androidx.compose.animation.*
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.avanyx.store.data.database.entity.AppUpdateEntity
import com.avanyx.store.data.database.entity.InstalledAppEntity
import com.avanyx.store.data.model.DownloadInfo
import com.avanyx.store.data.model.DownloadStatus
import com.avanyx.store.data.model.StoreApp
import com.avanyx.store.data.repository.AppRepository
import com.avanyx.store.download.DownloadManagerEngine
import com.avanyx.store.manager.InstalledAppsManager
import com.avanyx.store.ui.components.AppIconView
import com.avanyx.store.ui.components.InstalledAppIconView
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.launch

enum class MyAppsTab(val title: String) {
    INSTALLED("Installed"),
    UPDATES("Updates"),
    DOWNLOADS("Downloads"),
    WISHLIST("Wishlist")
}

@Composable
fun MyAppsScreen(
    onBack: () -> Unit,
    onShowMessage: (String) -> Unit,
    repository: AppRepository? = null,
    onNavigateToDetails: ((String) -> Unit)? = null,
    onNavigateToDeveloper: ((String) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val appsManager = remember(context) { InstalledAppsManager.getInstance(context) }
    val downloadEngine = remember(context) { DownloadManagerEngine.getInstance(context) }

    val installedApps by appsManager.installedAppsFlow.collectAsStateWithLifecycle(initialValue = emptyList())
    val availableUpdates by appsManager.availableUpdatesFlow.collectAsStateWithLifecycle(initialValue = emptyList())
    val downloadsMap by downloadEngine.downloadsMap.collectAsStateWithLifecycle()
    val allStoreApps by (repository?.getApps() ?: flowOf(emptyList())).collectAsStateWithLifecycle(initialValue = emptyList())
    val wishlistApps by (repository?.getWishlistAppsFlow() ?: flowOf(emptyList())).collectAsStateWithLifecycle(initialValue = emptyList())

    var selectedTab by remember { mutableStateOf(MyAppsTab.INSTALLED) }
    var isScanning by remember { mutableStateOf(false) }
    var searchQuery by remember { mutableStateOf("") }
    var hideSystemApps by remember { mutableStateOf(true) }

    // Initial background scan & matching
    LaunchedEffect(Unit) {
        if (installedApps.isEmpty()) {
            isScanning = true
            appsManager.scanAndMatch(context)
            isScanning = false
        }
    }

    val onRefresh = {
        scope.launch {
            isScanning = true
            val result = appsManager.scanAndMatch(context)
            isScanning = false
            if (result.isSuccess) {
                onShowMessage("Scanned ${result.scannedCount} apps. ${result.updatesCount} update(s) available.")
            } else {
                onShowMessage("Scan complete: ${result.errorMessage ?: "Success"}")
            }
        }
    }

    val filteredInstalledApps = remember(installedApps, allStoreApps, searchQuery, hideSystemApps) {
        val storePackageNames = allStoreApps.map { it.packageName.lowercase() }.toSet()
        val storeAppIds = allStoreApps.map { it.id.lowercase() }.toSet()
        val currentPackage = context.packageName.lowercase()

        installedApps.filter { app ->
            val pkg = app.packageName.lowercase()
            // Strictly show only AVANYX Store catalog apps
            val isAvanyxCatalogApp = storePackageNames.contains(pkg) ||
                    storeAppIds.contains(pkg) ||
                    pkg == currentPackage ||
                    pkg.startsWith("com.avanyx") ||
                    app.appName.contains("AVANYX", ignoreCase = true)

            val matchesQuery = searchQuery.isBlank() ||
                    app.appName.contains(searchQuery, ignoreCase = true) ||
                    app.packageName.contains(searchQuery, ignoreCase = true)

            val matchesSystem = if (hideSystemApps) !app.isSystemApp else true

            isAvanyxCatalogApp && matchesQuery && matchesSystem
        }.sortedBy { it.appName.lowercase() }
    }

    val downloadsList = remember(downloadsMap) { downloadsMap.values.toList() }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .testTag("my_apps_screen")
    ) {
        // App Bar Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack, modifier = Modifier.testTag("my_apps_back_button")) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = MaterialTheme.colorScheme.onBackground
                    )
                }
                Text(
                    text = "My Apps & Games",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.padding(start = 8.dp)
                )
            }

            IconButton(
                onClick = { onRefresh() },
                enabled = !isScanning,
                modifier = Modifier.testTag("refresh_installed_button")
            ) {
                if (isScanning) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.primary
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Check Updates",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }

        // 4-Tab Selector Row (Installed, Updates, Downloads, Wishlist)
        TabRow(
            selectedTabIndex = selectedTab.ordinal,
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.primary,
            modifier = Modifier.fillMaxWidth()
        ) {
            MyAppsTab.values().forEach { tab ->
                val badgeCount = when (tab) {
                    MyAppsTab.INSTALLED -> filteredInstalledApps.size
                    MyAppsTab.UPDATES -> availableUpdates.size
                    MyAppsTab.DOWNLOADS -> downloadsList.count { it.status == DownloadStatus.DOWNLOADING || it.status == DownloadStatus.COMPLETED }
                    MyAppsTab.WISHLIST -> wishlistApps.size
                }

                Tab(
                    selected = selectedTab == tab,
                    onClick = { selectedTab = tab },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = tab.title,
                                fontWeight = if (selectedTab == tab) FontWeight.Bold else FontWeight.Normal
                            )
                            if (badgeCount > 0) {
                                Spacer(modifier = Modifier.width(6.dp))
                                Surface(
                                    shape = CircleShape,
                                    color = if (tab == MyAppsTab.UPDATES && selectedTab == tab) Color(0xFF10B981)
                                    else if (selectedTab == tab) MaterialTheme.colorScheme.primary
                                    else MaterialTheme.colorScheme.surfaceVariant,
                                    modifier = Modifier.padding(1.dp)
                                ) {
                                    Text(
                                        text = badgeCount.toString(),
                                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                        color = if (selectedTab == tab) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 1.dp),
                                        fontSize = 10.sp
                                    )
                                }
                            }
                        }
                    }
                )
            }
        }

        // TAB CONTENT
        val storeAppsMapByPkg = remember(allStoreApps) { allStoreApps.associateBy { it.packageName } }
        val storeAppsMapById = remember(allStoreApps) { allStoreApps.associateBy { it.id } }

        when (selectedTab) {
            MyAppsTab.INSTALLED -> {
                InstalledTabContent(
                    installedApps = filteredInstalledApps,
                    storeAppsMapByPkg = storeAppsMapByPkg,
                    storeAppsMapById = storeAppsMapById,
                    isScanning = isScanning,
                    searchQuery = searchQuery,
                    onSearchQueryChange = { searchQuery = it },
                    hideSystemApps = hideSystemApps,
                    onToggleHideSystemApps = { hideSystemApps = !hideSystemApps },
                    onOpenApp = { pkg ->
                        val launched = appsManager.launchApp(context, pkg)
                        if (!launched) {
                            onShowMessage("Could not launch package: $pkg")
                        }
                    },
                    onUninstallApp = { pkg ->
                        appsManager.uninstallApp(context, pkg)
                        onShowMessage("Opening uninstaller...")
                    },
                    onDeveloperClick = onNavigateToDeveloper,
                    onNavigateToDetails = onNavigateToDetails
                )
            }

            MyAppsTab.UPDATES -> {
                UpdatesTabContent(
                    updates = availableUpdates,
                    onUpdateApp = { update ->
                        downloadEngine.startOrResumeDownload(
                            appId = update.appId,
                            appName = update.appName,
                            downloadUrl = update.downloadUrl,
                            expectedChecksum = update.checksumSha256
                        )
                        onShowMessage("Downloading update for ${update.appName}...")
                    },
                    onUpdateAll = {
                        availableUpdates.forEach { update ->
                            downloadEngine.startOrResumeDownload(
                                appId = update.appId,
                                appName = update.appName,
                                downloadUrl = update.downloadUrl,
                                expectedChecksum = update.checksumSha256
                            )
                        }
                        onShowMessage("Updating ${availableUpdates.size} applications...")
                    },
                    onNavigateToDetails = onNavigateToDetails,
                    onDeveloperClick = onNavigateToDeveloper
                )
            }

            MyAppsTab.DOWNLOADS -> {
                DownloadsTabContent(
                    downloadsList = downloadsList,
                    onPause = { appId -> downloadEngine.pauseDownload(appId) },
                    onResume = { info ->
                        downloadEngine.startOrResumeDownload(
                            appId = info.appId,
                            appName = info.appName,
                            downloadUrl = "",
                            expectedChecksum = info.checksumSha256
                        )
                    },
                    onCancel = { appId -> downloadEngine.cancelDownload(appId) },
                    onInstall = { appId ->
                        val res = downloadEngine.installDownloadedApk(appId)
                        if (!res.isSuccess) {
                            onShowMessage(res.exceptionOrNull()?.message ?: "Installation failed")
                        }
                    },
                    onClearHistory = {
                        downloadEngine.clearCompletedDownloads()
                        onShowMessage("Cleared completed download queue.")
                    }
                )
            }

            MyAppsTab.WISHLIST -> {
                WishlistTabContent(
                    wishlistApps = wishlistApps,
                    installedApps = installedApps,
                    downloadsMap = downloadsMap,
                    onNavigateToDetails = onNavigateToDetails,
                    onDeveloperClick = onNavigateToDeveloper,
                    onInstallApp = { app ->
                        downloadEngine.startOrResumeDownload(
                            appId = app.id,
                            appName = app.name,
                            downloadUrl = app.downloadUrl,
                            expectedChecksum = app.checksumSha256
                        )
                        onShowMessage("Downloading ${app.name}...")
                    },
                    onOpenApp = { pkg ->
                        appsManager.launchApp(context, pkg)
                    },
                    onUninstallApp = { pkg ->
                        appsManager.uninstallApp(context, pkg)
                    },
                    onRemoveWishlist = { appId ->
                        scope.launch {
                            repository?.toggleWishlist(appId)
                            onShowMessage("Removed from wishlist")
                        }
                    }
                )
            }
        }
    }
}

@Composable
private fun InstalledTabContent(
    installedApps: List<InstalledAppEntity>,
    storeAppsMapByPkg: Map<String, StoreApp>,
    storeAppsMapById: Map<String, StoreApp>,
    isScanning: Boolean,
    searchQuery: String,
    onSearchQueryChange: (String) -> Unit,
    hideSystemApps: Boolean,
    onToggleHideSystemApps: () -> Unit,
    onOpenApp: (String) -> Unit,
    onUninstallApp: (String) -> Unit,
    onDeveloperClick: ((String) -> Unit)?,
    onNavigateToDetails: ((String) -> Unit)?
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // Search & Filter Header
        item {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = onSearchQueryChange,
                placeholder = { Text("Search installed apps...", fontSize = 14.sp) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, modifier = Modifier.size(20.dp)) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { onSearchQueryChange("") }) {
                            Icon(Icons.Default.Close, contentDescription = "Clear", modifier = Modifier.size(18.dp))
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(16.dp),
                singleLine = true
            )
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${installedApps.size} Installed Applications",
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onBackground
                )

                FilterChip(
                    selected = hideSystemApps,
                    onClick = onToggleHideSystemApps,
                    label = { Text("Hide System Apps", fontSize = 11.sp) },
                    leadingIcon = {
                        Icon(
                            imageVector = if (hideSystemApps) Icons.Default.Check else Icons.Default.Apps,
                            contentDescription = null,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                )
            }
        }

        if (isScanning && installedApps.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
        } else if (installedApps.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.Inbox,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "No applications matching filter",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        } else {
            items(installedApps, key = { it.packageName }) { app ->
                val matchedStoreApp = storeAppsMapByPkg[app.packageName] ?: storeAppsMapById[app.packageName]
                InstalledAppCardFull(
                    app = app,
                    matchedStoreApp = matchedStoreApp,
                    onOpenClick = { onOpenApp(app.packageName) },
                    onUninstallClick = { onUninstallApp(app.packageName) },
                    onDeveloperClick = onDeveloperClick,
                    onNavigateToDetails = onNavigateToDetails
                )
            }
        }
    }
}

@Composable
private fun InstalledAppCardFull(
    app: InstalledAppEntity,
    matchedStoreApp: StoreApp?,
    onOpenClick: () -> Unit,
    onUninstallClick: () -> Unit,
    onDeveloperClick: ((String) -> Unit)?,
    onNavigateToDetails: ((String) -> Unit)?
) {
    val devName = matchedStoreApp?.developer?.ifBlank { "AVANYX" } ?: "AVANYX"

    Surface(
        onClick = {
            if (matchedStoreApp != null && onNavigateToDetails != null) {
                onNavigateToDetails(matchedStoreApp.id)
            }
        },
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    InstalledAppIconView(
                        app = app,
                        matchedStoreApp = matchedStoreApp,
                        size = 48.dp,
                        cornerRadius = 12.dp
                    )

                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = app.appName,
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            if (app.isSystemApp) {
                                Spacer(modifier = Modifier.width(6.dp))
                                Surface(
                                    shape = RoundedCornerShape(4.dp),
                                    color = MaterialTheme.colorScheme.surfaceVariant,
                                    modifier = Modifier.padding(1.dp)
                                ) {
                                    Text(
                                        text = "SYSTEM",
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                    )
                                }
                            }
                        }

                        // Developer Name (Clickable)
                        Text(
                            text = devName,
                            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                            color = MaterialTheme.colorScheme.primary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.clickable {
                                onDeveloperClick?.invoke(devName)
                            }
                        )

                        Text(
                            text = "v${app.version} • ${app.packageName}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Action Buttons: OPEN (Purple) & UNINSTALL (Red)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = onOpenClick,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF8B5CF6),
                        contentColor = Color.White
                    ),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.weight(1f).height(36.dp),
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("OPEN", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                if (!app.isSystemApp) {
                    Button(
                        onClick = onUninstallClick,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFFEF4444),
                            contentColor = Color.White
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f).height(36.dp),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("UNINSTALL", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun UpdatesTabContent(
    updates: List<AppUpdateEntity>,
    onUpdateApp: (AppUpdateEntity) -> Unit,
    onUpdateAll: () -> Unit,
    onNavigateToDetails: ((String) -> Unit)?,
    onDeveloperClick: ((String) -> Unit)?
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        if (updates.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(280.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = Color(0xFF10B981),
                            modifier = Modifier.size(56.dp)
                        )
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = "All Applications Up to Date",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Your apps and games are currently on their latest releases.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        } else {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${updates.size} Update(s) Available",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold),
                        color = MaterialTheme.colorScheme.onBackground
                    )

                    Button(
                        onClick = onUpdateAll,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF3B82F6),
                            contentColor = Color.White
                        ),
                        shape = RoundedCornerShape(100.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 4.dp),
                        modifier = Modifier.height(34.dp)
                    ) {
                        Text("Update All", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            items(updates, key = { "update_${it.appId}" }) { update ->
                Surface(
                    onClick = { onNavigateToDetails?.invoke(update.appId) },
                    shape = RoundedCornerShape(18.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.7f),
                    border = BorderStroke(1.dp, Color(0xFF3B82F6).copy(alpha = 0.4f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            AppIconView(
                                appName = update.appName,
                                appId = update.appId,
                                size = 46.dp,
                                cornerRadius = 12.dp
                            )

                            Column {
                                Text(
                                    text = update.appName,
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onSurface,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = "v${update.currentVersion} → v${update.newVersion} • ${update.updateSize}",
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                                    color = Color(0xFF3B82F6)
                                )
                                if (update.releaseNotes.isNotBlank()) {
                                    Text(
                                        text = update.releaseNotes,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.width(8.dp))

                        Button(
                            onClick = { onUpdateApp(update) },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF3B82F6),
                                contentColor = Color.White
                            ),
                            shape = RoundedCornerShape(14.dp),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                            modifier = Modifier.height(36.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.ArrowUpward,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp).padding(end = 2.dp)
                            )
                            Text("UPDATE", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DownloadsTabContent(
    downloadsList: List<DownloadInfo>,
    onPause: (String) -> Unit,
    onResume: (DownloadInfo) -> Unit,
    onCancel: (String) -> Unit,
    onInstall: (String) -> Unit,
    onClearHistory: () -> Unit
) {
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
        downloadsList.filter { it.status == DownloadStatus.COMPLETED || it.status == DownloadStatus.FAILED }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        if (completedDownloads.isNotEmpty()) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onClearHistory) {
                        Text("Clear Completed History", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }
        }

        if (activeDownloads.isEmpty() && completedDownloads.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(280.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.CloudDownload,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f),
                            modifier = Modifier.size(56.dp)
                        )
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = "No Active or Recent Downloads",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Downloaded applications and updates will appear here.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        if (activeDownloads.isNotEmpty()) {
            item {
                Text(
                    text = "Active Tasks (${activeDownloads.size})",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onBackground
                )
            }

            items(activeDownloads, key = { "active_${it.appId}" }) { item ->
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = item.appName,
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "${(item.progress * 100).toInt()}%",
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.primary
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        LinearProgressIndicator(
                            progress = { item.progress },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(RoundedCornerShape(3.dp)),
                            color = MaterialTheme.colorScheme.primary
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "${item.status.name} • ${String.format("%.1f", item.speedKbps / 1024f)} MB/s",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                if (item.status == DownloadStatus.DOWNLOADING) {
                                    IconButton(onClick = { onPause(item.appId) }, modifier = Modifier.size(32.dp)) {
                                        Icon(Icons.Default.Pause, contentDescription = "Pause", modifier = Modifier.size(18.dp))
                                    }
                                } else if (item.status == DownloadStatus.PAUSED) {
                                    IconButton(onClick = { onResume(item) }, modifier = Modifier.size(32.dp)) {
                                        Icon(Icons.Default.PlayArrow, contentDescription = "Resume", modifier = Modifier.size(18.dp))
                                    }
                                }
                                IconButton(onClick = { onCancel(item.appId) }, modifier = Modifier.size(32.dp)) {
                                    Icon(Icons.Default.Close, contentDescription = "Cancel", modifier = Modifier.size(18.dp))
                                }
                            }
                        }
                    }
                }
            }
        }

        if (completedDownloads.isNotEmpty()) {
            item {
                Text(
                    text = "Completed & Stored (${completedDownloads.size})",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onBackground
                )
            }

            items(completedDownloads, key = { "comp_${it.appId}" }) { item ->
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = item.appName,
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = if (item.status == DownloadStatus.COMPLETED) "Ready to install" else "Download failed",
                                style = MaterialTheme.typography.labelSmall,
                                color = if (item.status == DownloadStatus.COMPLETED) Color(0xFF10B981) else MaterialTheme.colorScheme.error
                            )
                        }

                        if (item.status == DownloadStatus.COMPLETED) {
                            Button(
                                onClick = { onInstall(item.appId) },
                                shape = RoundedCornerShape(12.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                modifier = Modifier.height(34.dp)
                            ) {
                                Text("Install", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun WishlistTabContent(
    wishlistApps: List<StoreApp>,
    installedApps: List<InstalledAppEntity>,
    downloadsMap: Map<String, DownloadInfo>,
    onNavigateToDetails: ((String) -> Unit)?,
    onDeveloperClick: ((String) -> Unit)?,
    onInstallApp: (StoreApp) -> Unit,
    onOpenApp: (String) -> Unit,
    onUninstallApp: (String) -> Unit,
    onRemoveWishlist: (String) -> Unit
) {
    if (wishlistApps.isEmpty()) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(32.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    imageVector = Icons.Default.FavoriteBorder,
                    contentDescription = null,
                    modifier = Modifier.size(64.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Your Wishlist is Empty",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onBackground
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Save your favorite apps and games from AVANYX Store to view and install them here anytime.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
            }
        }
    } else {
        val installedMap = remember(installedApps) { installedApps.associateBy { it.packageName } }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            contentPadding = PaddingValues(bottom = 24.dp)
        ) {
            item {
                Text(
                    text = "${wishlistApps.size} Saved Applications",
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.padding(vertical = 4.dp)
                )
            }

            items(wishlistApps, key = { it.id }) { app ->
                val dlInfo = downloadsMap[app.id]
                val installed = installedMap[app.packageName]
                val actionState: com.avanyx.store.data.model.AppActionState = when {
                    dlInfo != null && (dlInfo.status == DownloadStatus.DOWNLOADING || dlInfo.status == DownloadStatus.PENDING) ->
                        com.avanyx.store.data.model.AppActionState.Downloading(
                            progress = dlInfo.progress,
                            speedKbps = dlInfo.speedKbps
                        )
                    installed != null && app.versionCode > installed.versionCode ->
                        com.avanyx.store.data.model.AppActionState.Update(
                            currentVersion = installed.version,
                            newVersion = app.version,
                            updateSize = app.size
                        )
                    installed != null ->
                        com.avanyx.store.data.model.AppActionState.Installed(currentVersion = installed.version)
                    else ->
                        com.avanyx.store.data.model.AppActionState.Install
                }

                com.avanyx.store.ui.components.AppCard(
                    app = app,
                    actionState = actionState,
                    onClick = { onNavigateToDetails?.invoke(app.id) },
                    onInstallClick = { onInstallApp(app) },
                    onActionClick = { state ->
                        when (state) {
                            is com.avanyx.store.data.model.AppActionState.Install,
                            is com.avanyx.store.data.model.AppActionState.Update -> onInstallApp(app)
                            is com.avanyx.store.data.model.AppActionState.Installed -> onOpenApp(app.packageName)
                            else -> {}
                        }
                    },
                    onDeveloperClick = onDeveloperClick,
                    onUninstallClick = { onUninstallApp(app.packageName) }
                )
            }
        }
    }
}
