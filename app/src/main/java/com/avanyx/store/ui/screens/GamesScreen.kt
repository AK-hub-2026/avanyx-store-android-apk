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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.avanyx.store.data.repository.AppRepository
import com.avanyx.store.ui.components.AppCard
import com.avanyx.store.ui.components.CategoryChip
import com.avanyx.store.ui.components.FeaturedAppCard

@Composable
fun GamesScreen(
    repository: AppRepository,
    onNavigateToDetails: (String) -> Unit,
    onShowMessage: (String) -> Unit,
    onNavigateToDeveloper: ((String) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val allApps by repository.getApps().collectAsState(initial = emptyList())
    val gamesList = remember(allApps) { repository.getGames() }
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
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 16.dp)
            ) {
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
                        onInstallClick = { onShowMessage("Downloads are coming in the next AVANYX Store phase.") }
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
            items(filteredGames) { game ->
                Column(modifier = Modifier.padding(horizontal = 12.dp)) {
                    AppCard(
                        app = game,
                        onClick = { onNavigateToDetails(game.id) },
                        onInstallClick = { onShowMessage("Downloading ${game.name}...") },
                        onDeveloperClick = onNavigateToDeveloper
                    )
                }
            }
        }
    }
}
