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
fun AppsScreen(
    repository: AppRepository,
    onNavigateToDetails: (String) -> Unit,
    onShowMessage: (String) -> Unit,
    onNavigateToDeveloper: ((String) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val allApps by repository.getApps().collectAsState(initial = emptyList())
    val nonGamesList = remember(allApps) { repository.getNonGames() }
    val featuredApps = remember(nonGamesList) { nonGamesList.filter { it.isFeatured } }
    
    val appCategories = listOf("All Apps", "Productivity", "Tools", "Education", "Entertainment")
    var selectedCategory by remember { mutableStateOf("All Apps") }

    val filteredApps = remember(nonGamesList, selectedCategory) {
        if (selectedCategory == "All Apps") {
            nonGamesList
        } else {
            nonGamesList.filter { it.category.equals(selectedCategory, ignoreCase = true) }
        }
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .testTag("apps_screen"),
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
                    text = "Apps",
                    style = MaterialTheme.typography.headlineMedium.copy(
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 28.sp,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                )
                Text(
                    text = "Premium native software curated by AVANYX",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // Featured App Hero Card
        item {
            if (featuredApps.isNotEmpty()) {
                val heroApp = featuredApps.first()
                Column(
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)
                ) {
                    FeaturedAppCard(
                        app = heroApp,
                        onClick = { onNavigateToDetails(heroApp.id) },
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
                items(appCategories) { category ->
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
                text = "Discover Apps",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 18.sp,
                    color = MaterialTheme.colorScheme.onBackground
                ),
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp)
            )
        }

        // App list
        if (filteredApps.isEmpty()) {
            item {
                Text(
                    text = "No apps found in this category.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)
                )
            }
        } else {
            items(filteredApps) { app ->
                Column(modifier = Modifier.padding(horizontal = 12.dp)) {
                    AppCard(
                        app = app,
                        onClick = { onNavigateToDetails(app.id) },
                        onInstallClick = { onShowMessage("Downloading ${app.name}...") },
                        onDeveloperClick = onNavigateToDeveloper
                    )
                }
            }
        }
    }
}
