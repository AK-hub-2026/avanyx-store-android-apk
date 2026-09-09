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
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
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
    val appsManager = remember(context) { InstalledAppsManager.getInstance(context) }
    val downloadEngine = remember(context) { DownloadManagerEngine.getInstance(context) }

    val allApps by repository.getApps().collectAsState(initial = emptyList())
    val installedApps by appsManager.installedAppsFlow.collectAsStateWithLifecycle(initialValue = emptyList())
    val downloadsMap by downloadEngine.downloadsMap.collectAsStateWithLifecycle()
    val installedMap = remember(installedApps) { installedApps.associateBy { it.packageName } }
    
    LaunchedEffect(allApps) {
        android.util.Log.d("HomeScreen", "=== HomeScreen Rendered App Count: ${allApps.size} ===")
        android.util.Log.d("HomeScreen", "HomeScreen Apps: ${allApps.map { "${it.name} (id=${it.id}, isGame=${it.isGame})" }}")
    }

    val featuredApps = remember(allApps) { allApps.filter { it.isFeatured } }
    val gamesList = remember(allApps) { allApps.filter { it.isGame } }
    val nonGamesList = remember(allApps) { allApps.filter { !it.isGame } }
    
    val categories = listOf("For you", "Top Charts", "Categories", "New Releases", "Offline Games")
    var selectedCategory by remember { mutableStateOf("For you") }

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
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .align(Alignment.TopEnd)
                                .padding(top = 8.dp, end = 8.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFEF4444))
                        )
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
                        onInstallClick = { onShowMessage("Downloads are coming in the next AVANYX Store phase.") }
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
                        onClick = { selectedCategory = category }
                    )
                }
            }
        }

        // Recommended Apps Section Header
        item {
            SectionHeader(
                title = "Recommended Apps",
                onViewAllClick = { onShowMessage("Extended catalog coming soon!") }
            )
        }

        // Recommended Apps Scroll List
        val displayApps = if (nonGamesList.isNotEmpty()) nonGamesList else allApps
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
        Box(
            modifier = Modifier
                .size(110.dp)
                .clip(RoundedCornerShape(20.dp))
                .background(Color(android.graphics.Color.parseColor(app.iconBgColorHex))),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = app.iconText,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 24.sp
            )
        }
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
