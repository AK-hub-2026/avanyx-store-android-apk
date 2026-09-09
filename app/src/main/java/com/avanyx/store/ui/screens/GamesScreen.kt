package com.avanyx.store.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.avanyx.store.data.model.AppActionState
import com.avanyx.store.data.repository.AppRepository
import com.avanyx.store.download.DownloadManagerEngine
import com.avanyx.store.manager.InstalledAppsManager
import com.avanyx.store.ui.components.AppCard
import com.avanyx.store.ui.components.CategoryChip
import com.avanyx.store.ui.components.FeaturedAppCard

@Composable
fun GamesScreen(
    repository: AppRepository,
    onNavigateToDetails: (String) -> Unit,
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

    val gamesList = remember(allApps) { allApps.filter { it.isGame } }
    val featuredGames = remember(gamesList) { gamesList.filter { it.isFeatured } }
    
    val gameCategories = listOf("All Games", "Casual", "Action", "Racing", "Arcade")
    var selectedCategory by remember { mutableStateOf("All Games") }

    val filteredGames = remember(gamesList, selectedCategory) {
        if (selectedCategory == "All Games") {
            gamesList
        } else {
            gamesList.filter { it.category.equals(selectedCategory, ignoreCase = true) }
        }
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .testTag("games_screen"),
        contentPadding = PaddingValues(bottom = 16.dp)
    ) {
        // Page Header
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Games",
                        style = MaterialTheme.typography.headlineMedium.copy(
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 28.sp,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                    )
                    Text(
                        text = "Top interactive experiences curated by AVANYX",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.secondaryContainer)
                        .clickable {
                            if (onNavigateToNotifications != null) onNavigateToNotifications()
                            else onShowMessage("Notification Center")
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Notifications,
                        contentDescription = "Notifications",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
        }

        // Featured Game Hero Card
        item {
            if (featuredGames.isNotEmpty()) {
                val heroGame = featuredGames.first()
                Column(
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)
                ) {
                    FeaturedAppCard(
                        app = heroGame,
                        onClick = { onNavigateToDetails(heroGame.id) },
                        onInstallClick = {
                            downloadEngine.startOrResumeDownload(
                                appId = heroGame.id,
                                appName = heroGame.name,
                                downloadUrl = heroGame.downloadUrl,
                                expectedChecksum = heroGame.checksumSha256
                            )
                            onShowMessage("Downloading ${heroGame.name}...")
                        }
                    )
                }
            }
        }

        // Category Selection
        item {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(gameCategories) { category ->
                    CategoryChip(
                        category = category,
                        isSelected = selectedCategory == category,
                        onClick = { selectedCategory = category }
                    )
                }
            }
        }

        // Section Title
        item {
            Text(
                text = "Discover Games",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 18.sp,
                    color = MaterialTheme.colorScheme.onBackground
                ),
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp)
            )
        }

        // Game list
        if (filteredGames.isEmpty()) {
            item {
                Text(
                    text = "No games found in this category.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)
                )
            }
        } else {
            items(filteredGames, key = { it.id }) { game ->
                val actionState = remember(game, installedMap, downloadsMap) {
                    appsManager.determineActionState(
                        appId = game.id,
                        packageName = game.packageName,
                        storeVersion = game.version,
                        storeVersionCode = game.versionCode,
                        storeSize = game.size,
                        installedApp = installedMap[game.packageName],
                        activeDownload = downloadsMap[game.id]
                    )
                }

                Column(modifier = Modifier.padding(horizontal = 12.dp)) {
                    AppCard(
                        app = game,
                        onClick = { onNavigateToDetails(game.id) },
                        actionState = actionState,
                        onActionClick = { state ->
                            when (state) {
                                is AppActionState.Install, is AppActionState.Update -> {
                                    downloadEngine.startOrResumeDownload(
                                        appId = game.id,
                                        appName = game.name,
                                        downloadUrl = game.downloadUrl,
                                        expectedChecksum = game.checksumSha256
                                    )
                                    onShowMessage("Starting download for ${game.name}...")
                                }
                                is AppActionState.Installed -> {
                                    val launched = appsManager.launchApp(context, game.packageName)
                                    if (!launched) {
                                        onShowMessage("${game.name} is installed.")
                                    }
                                }
                                is AppActionState.Paused -> {
                                    downloadEngine.startOrResumeDownload(
                                        appId = game.id,
                                        appName = game.name,
                                        downloadUrl = game.downloadUrl,
                                        expectedChecksum = game.checksumSha256
                                    )
                                }
                                is AppActionState.Downloading -> {
                                    downloadEngine.pauseDownload(game.id)
                                }
                                else -> {}
                            }
                        },
                        onInstallClick = {
                            downloadEngine.startOrResumeDownload(
                                appId = game.id,
                                appName = game.name,
                                downloadUrl = game.downloadUrl,
                                expectedChecksum = game.checksumSha256
                            )
                            onShowMessage("Downloading ${game.name}...")
                        },
                        onDeveloperClick = onNavigateToDeveloper
                    )
                }
            }
        }
    }
}
