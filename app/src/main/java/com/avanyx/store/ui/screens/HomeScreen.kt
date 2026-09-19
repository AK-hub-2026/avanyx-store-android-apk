package com.avanyx.store.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
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
import com.avanyx.store.data.model.AppActionState
import com.avanyx.store.data.model.StoreApp
import com.avanyx.store.data.repository.AppRepository
import com.avanyx.store.download.DownloadManagerEngine
import com.avanyx.store.manager.InstalledAppsManager
import com.avanyx.store.ui.components.AppCard
import com.avanyx.store.ui.components.CategoryChip
import com.avanyx.store.ui.components.FeaturedAppCard

@Composable
fun HomeScreen(
    repository: AppRepository,
    onNavigateToDetails: (String) -> Unit,
    onNavigateToSearch: () -> Unit,
    onNavigateToProfile: () -> Unit,
    onShowMessage: (String) -> Unit,
    onNavigateToDeveloper: ((String) -> Unit)? = null,
    onNavigateToNotifications: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val appsManager = remember(context) { InstalledAppsManager.getInstance(context) }
    val downloadEngine = remember(context) { DownloadManagerEngine.getInstance(context) }

    val db = remember(context) { com.avanyx.store.data.database.AppDatabase.getInstance(context) }
    val unreadNotificationsCount by db.notificationDao().getUnreadCount().collectAsStateWithLifecycle(initialValue = 0)

    val allApps by repository.getApps().collectAsState(initial = emptyList())
    val installedApps by appsManager.installedAppsFlow.collectAsStateWithLifecycle(initialValue = emptyList())
    val downloadsMap by downloadEngine.downloadsMap.collectAsStateWithLifecycle()
    val installedMap = remember(installedApps) { installedApps.associateBy { it.packageName } }
    
    var isTimedOut by remember { mutableStateOf(false) }
    var isReloading by remember { mutableStateOf(false) }
    var lastSyncError by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(allApps) {
        val gamesCount = allApps.count {
            it.isGame ||
            it.category.contains("game", ignoreCase = true) ||
            it.categoryId.contains("game", ignoreCase = true) ||
            it.category.equals("Casual", ignoreCase = true) ||
            it.category.equals("Action", ignoreCase = true) ||
            it.category.equals("Arcade", ignoreCase = true) ||
            it.category.equals("Racing", ignoreCase = true)
        }
        val toolsCount = allApps.count {
            it.category.contains("Tool", ignoreCase = true) ||
            it.category.contains("Utility", ignoreCase = true) ||
            it.categoryId.contains("tools", ignoreCase = true)
        }
        android.util.Log.d("AVANYX_DEBUG", "HomeScreen apps = ${allApps.size}")
        android.util.Log.d("AVANYX_DEBUG", "Category Games = $gamesCount")
        android.util.Log.d("AVANYX_DEBUG", "Category Tools = $toolsCount")
        android.util.Log.d("HomeScreen", "=== HomeScreen Rendered App Count: ${allApps.size} (Games=$gamesCount, Tools=$toolsCount) ===")
        android.util.Log.d("HomeScreen", "HomeScreen Apps: ${allApps.map { "${it.name} (id=${it.id}, category=${it.category}, isGame=${it.isGame})" }}")
        if (allApps.isNotEmpty()) {
            isTimedOut = false
            isReloading = false
            lastSyncError = null
        } else {
            kotlinx.coroutines.delay(3500)
            if (allApps.isEmpty()) {
                isTimedOut = true
                isReloading = false
            }
        }
    }

    val featuredApps = remember(allApps) { allApps.filter { it.isFeatured } }
    val gamesList = remember(allApps) { allApps.filter { it.isGame } }
    val nonGamesList = remember(allApps) { allApps.filter { !it.isGame } }
    
    val categories = listOf("All", "For you", "Games", "Apps", "Tools", "Productivity", "Education", "Entertainment", "Top Charts")
    var selectedCategory by remember { mutableStateOf("All") }

    val displayApps = remember(selectedCategory, allApps) {
        when (selectedCategory.trim().lowercase()) {
            "all", "for you" -> allApps
            "games" -> allApps.filter {
                it.isGame ||
                it.category.contains("game", ignoreCase = true) ||
                it.categoryId.contains("game", ignoreCase = true) ||
                it.category.equals("Casual", ignoreCase = true) ||
                it.category.equals("Action", ignoreCase = true) ||
                it.category.equals("Arcade", ignoreCase = true) ||
                it.category.equals("Racing", ignoreCase = true)
            }
            "apps" -> allApps.filter { !it.isGame }
            "tools" -> allApps.filter {
                it.category.contains("Tool", ignoreCase = true) ||
                it.category.contains("Utility", ignoreCase = true) ||
                it.categoryId.contains("tools", ignoreCase = true)
            }
            "productivity" -> allApps.filter {
                it.category.contains("Productivity", ignoreCase = true) ||
                it.categoryId.contains("productivity", ignoreCase = true)
            }
            "education" -> allApps.filter {
                it.category.contains("Education", ignoreCase = true) ||
                it.categoryId.contains("education", ignoreCase = true)
            }
            "entertainment" -> allApps.filter {
                it.category.contains("Entertainment", ignoreCase = true) ||
                it.categoryId.contains("entertainment", ignoreCase = true)
            }
            "top charts" -> allApps.sortedByDescending { it.rating }
            else -> allApps.filter {
                it.category.equals(selectedCategory, ignoreCase = true) ||
                it.categoryId.equals(selectedCategory, ignoreCase = true) ||
                it.category.contains(selectedCategory, ignoreCase = true)
            }
        }
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .testTag("home_screen"),
        contentPadding = PaddingValues(bottom = 16.dp)
    ) {
        // App Bar / Header
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Title & Logo branding
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Custom stylized premium Avanyx Logo
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(11.dp))
                            .background(
                                androidx.compose.ui.graphics.Brush.linearGradient(
                                    colors = listOf(
                                        MaterialTheme.colorScheme.primary,
                                        Color(0xFF9C27B0)
                                    )
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        androidx.compose.foundation.Canvas(modifier = Modifier.size(18.dp)) {
                            val w = size.width
                            val h = size.height
                            val path = androidx.compose.ui.graphics.Path().apply {
                                moveTo(w * 0.5f, 0f)
                                lineTo(w, h)
                                lineTo(w * 0.75f, h)
                                lineTo(w * 0.5f, h * 0.4f)
                                lineTo(w * 0.25f, h)
                                lineTo(0f, h)
                                close()
                            }
                            drawPath(
                                path = path,
                                color = Color.White
                            )
                            drawRect(
                                color = Color.White,
                                topLeft = androidx.compose.ui.geometry.Offset(w * 0.35f, h * 0.65f),
                                size = androidx.compose.ui.geometry.Size(w * 0.3f, h * 0.12f)
                            )
                        }
                    }
                    Text(
                        text = "AVANYX",
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 22.sp,
                            letterSpacing = 1.sp,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                    )
                }

                Row(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Notification Bell Button
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.secondaryContainer)
                            .clickable {
                                if (onNavigateToNotifications != null) onNavigateToNotifications()
                                else onShowMessage("Notification Center")
                            }
                            .testTag("notification_bell_button"),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Notifications,
                            contentDescription = "Notifications",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(22.dp)
                        )
                        // Unread Dot Badge
                        if (unreadNotificationsCount > 0) {
                            Box(
                                modifier = Modifier
                                    .size(9.dp)
                                    .align(Alignment.TopEnd)
                                    .padding(top = 8.dp, end = 8.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFEF4444))
                            )
                        }
                    }

                    // Profile Avatar Button
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.secondaryContainer)
                            .clickable(onClick = onNavigateToProfile)
                            .testTag("profile_avatar_button"),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = androidx.compose.material.icons.Icons.Default.Person,
                            contentDescription = "Profile",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
            }
        }

        // Mock Search Bar (Navigates to search on tap)
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp)
                    .clip(RoundedCornerShape(100.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant)
                    .clickable(onClick = onNavigateToSearch)
                    .padding(horizontal = 18.dp, vertical = 14.dp)
                    .testTag("mock_search_bar"),
                contentAlignment = Alignment.CenterStart
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Search",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = "Search apps & games",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    )
                }
            }
        }

        // Featured Hero Banner
        item {
            if (featuredApps.isNotEmpty()) {
                val hero = featuredApps.first()
                Column(
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)
                ) {
                    FeaturedAppCard(
                        app = hero,
                        onClick = { onNavigateToDetails(hero.id) },
                        onInstallClick = {
                            downloadEngine.startOrResumeDownload(
                                appId = hero.id,
                                appName = hero.name,
                                downloadUrl = hero.downloadUrl,
                                expectedChecksum = hero.checksumSha256
                            )
                            onShowMessage("Downloading ${hero.name}...")
                        }
                    )
                }
            }
        }

        // Horizontal Categories chips
        item {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(categories) { category ->
                    CategoryChip(
                        category = category,
                        isSelected = selectedCategory == category,
                        onClick = {
                            selectedCategory = category
                            android.util.Log.d("HomeScreen", "=== Category Selected: '$category' ===")
                            coroutineScope.launch(Dispatchers.IO) {
                                try {
                                    val db = com.avanyx.store.data.database.AppDatabase.getInstance(context)
                                    val repo = com.avanyx.store.data.repository.FirestoreRepository(appDatabase = db)
                                    repo.syncAppsFromFirestore()
                                } catch (e: Exception) {
                                    android.util.Log.e("HomeScreen", "Category sync error", e)
                                }
                            }
                        }
                    )
                }
            }
        }

        // Selected Category Section Header
        item {
            SectionHeader(
                title = when (selectedCategory) {
                    "All" -> "All Published Apps"
                    "For you" -> "Recommended Apps"
                    "Games" -> "Games & Entertainment"
                    "Apps" -> "Applications"
                    "Top Charts" -> "Top Rated Charts"
                    else -> "$selectedCategory Apps"
                },
                onViewAllClick = { onShowMessage("Viewing $selectedCategory collection") }
            )
        }

        // Empty Category Feedback (when catalog has apps but none match this specific filter)
        if (allApps.isNotEmpty() && displayApps.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "No apps in \"$selectedCategory\" yet",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "${allApps.size} apps available in the store.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Button(
                            onClick = { selectedCategory = "All" },
                            modifier = Modifier.padding(top = 8.dp)
                        ) {
                            Text("Show All Apps")
                        }
                    }
                }
            }
        }

        // Recommended Apps Scroll List
        items(displayApps, key = { it.id }) { app ->
            val actionState = remember(app, installedMap, downloadsMap) {
                appsManager.determineActionState(
                    appId = app.id,
                    packageName = app.packageName,
                    storeVersion = app.version,
                    storeVersionCode = app.versionCode,
                    storeSize = app.size,
                    installedApp = installedMap[app.packageName],
                    activeDownload = downloadsMap[app.id]
                )
            }

            Column(modifier = Modifier.padding(horizontal = 12.dp)) {
                AppCard(
                    app = app,
                    onClick = { onNavigateToDetails(app.id) },
                    actionState = actionState,
                    onActionClick = { state ->
                        when (state) {
                            is AppActionState.Install, is AppActionState.Update -> {
                                downloadEngine.startOrResumeDownload(
                                    appId = app.id,
                                    appName = app.name,
                                    downloadUrl = app.downloadUrl,
                                    expectedChecksum = app.checksumSha256
                                )
                                onShowMessage("Starting download for ${app.name}...")
                            }
                            is AppActionState.Installed -> {
                                val launched = appsManager.launchApp(context, app.packageName)
                                if (!launched) {
                                    onShowMessage("${app.name} is installed.")
                                }
                            }
                            is AppActionState.Paused -> {
                                downloadEngine.startOrResumeDownload(
                                    appId = app.id,
                                    appName = app.name,
                                    downloadUrl = app.downloadUrl,
                                    expectedChecksum = app.checksumSha256
                                )
                            }
                            is AppActionState.Downloading -> {
                                downloadEngine.pauseDownload(app.id)
                            }
                            else -> {}
                        }
                    },
                    onInstallClick = {
                        downloadEngine.startOrResumeDownload(
                            appId = app.id,
                            appName = app.name,
                            downloadUrl = app.downloadUrl,
                            expectedChecksum = app.checksumSha256
                        )
                        onShowMessage("Starting download for ${app.name}...")
                    },
                    onDeveloperClick = onNavigateToDeveloper
                )
            }
        }

        // New & Updated Section Header
        if (gamesList.isNotEmpty()) {
            item {
                SectionHeader(
                    title = "New & Updated",
                    onViewAllClick = { onShowMessage("New releases update daily!") }
                )
            }

            // Horizontal Row for New & Updated
            item {
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(gamesList) { game ->
                        HomeHorizontalCard(
                            app = game,
                            onClick = { onNavigateToDetails(game.id) },
                            modifier = Modifier.width(130.dp)
                        )
                    }
                }
            }
        }

        if (allApps.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(320.dp)
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    if (!isTimedOut || isReloading) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.testTag("home_loading_spinner")
                        ) {
                            CircularProgressIndicator(
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(36.dp),
                                strokeWidth = 3.dp
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = if (isReloading) "Reloading live apps from AVANYX Store..." else "Loading live apps from AVANYX Store...",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    } else {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center,
                            modifier = Modifier.testTag("home_empty_state")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Refresh,
                                contentDescription = "Retry",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(40.dp)
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "No published apps available",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = lastSyncError ?: "Check back soon for new releases from AVANYX or tap retry to reload.",
                                style = MaterialTheme.typography.bodySmall,
                                color = if (lastSyncError != null) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(
                                onClick = {
                                    android.util.Log.i("HomeScreen", "=== [RELOAD ACTION] User tapped Reload/Retry Button ===")
                                    isTimedOut = false
                                    isReloading = true
                                    lastSyncError = null
                                    coroutineScope.launch(Dispatchers.IO) {
                                        try {
                                            android.util.Log.d("HomeScreen", "=== [RELOAD COROUTINE] Starting reload execution ===")
                                            val db = com.avanyx.store.data.database.AppDatabase.getInstance(context)
                                            val repo = com.avanyx.store.data.repository.FirestoreRepository(appDatabase = db)
                                            val result = repo.syncAppsFromFirestore()
                                            
                                            kotlinx.coroutines.withContext(Dispatchers.Main) {
                                                isReloading = false
                                                if (result.isFailure) {
                                                    val err = result.exceptionOrNull()
                                                    lastSyncError = "${err?.javaClass?.simpleName}: ${err?.message}"
                                                    isTimedOut = true
                                                    android.util.Log.e("HomeScreen", "=== [RELOAD FAILED] ${err?.javaClass?.simpleName}: ${err?.message} ===", err)
                                                } else {
                                                    val count = result.getOrDefault(0)
                                                    android.util.Log.i("HomeScreen", "=== [RELOAD SUCCESS] Synced count: $count ===")
                                                    if (count == 0) {
                                                        isTimedOut = true
                                                    }
                                                }
                                            }
                                        } catch (e: Throwable) {
                                            android.util.Log.e("HomeScreen", "=== [RELOAD EXCEPTION] ${e.javaClass.simpleName}: ${e.message} ===", e)
                                            kotlinx.coroutines.withContext(Dispatchers.Main) {
                                                isReloading = false
                                                lastSyncError = "${e.javaClass.simpleName}: ${e.message}"
                                                isTimedOut = true
                                            }
                                        }
                                    }
                                },
                                modifier = Modifier.testTag("retry_sync_button")
                            ) {
                                Text("Retry Sync")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SectionHeader(
    title: String,
    onViewAllClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium.copy(
                fontWeight = FontWeight.ExtraBold,
                fontSize = 18.sp,
                color = MaterialTheme.colorScheme.onBackground
            )
        )
        Text(
            text = "View all",
            style = MaterialTheme.typography.bodyMedium.copy(
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Bold
            ),
            modifier = Modifier.clickable(onClick = onViewAllClick)
        )
    }
}

@Composable
fun HomeHorizontalCard(
    app: StoreApp,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(4.dp),
        horizontalAlignment = Alignment.Start
    ) {
        com.avanyx.store.ui.components.AppIconView(
            app = app,
            size = 110.dp,
            cornerRadius = 20.dp,
            fontSize = 24.sp
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = app.name,
            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
            maxLines = 1,
            color = MaterialTheme.colorScheme.onBackground
        )
        Text(
            text = app.category,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1
        )
    }
}
