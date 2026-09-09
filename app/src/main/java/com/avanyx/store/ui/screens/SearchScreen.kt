package com.avanyx.store.ui.screens

import android.content.Intent
import android.speech.RecognizerIntent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.avanyx.store.data.model.StoreApp
import com.avanyx.store.data.repository.AppRepository
import com.avanyx.store.data.search.AISearchProvider
import com.avanyx.store.data.search.AISearchResult
import com.avanyx.store.ui.components.AppCard
import com.avanyx.store.ui.components.GlassMessageCard
import com.avanyx.store.ui.components.GlassMessageData
import com.avanyx.store.ui.components.GlassMessageType
import kotlinx.coroutines.launch

@Composable
fun SearchScreen(
    repository: AppRepository,
    onNavigateToDetails: (String) -> Unit,
    onShowMessage: (String) -> Unit,
    onNavigateToDeveloper: ((String) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val focusManager = LocalFocusManager.current

    var searchQuery by remember { mutableStateOf("") }
    var isAiSearchMode by remember { mutableStateOf(false) }

    var isAiLoading by remember { mutableStateOf(false) }
    var aiResult by remember { mutableStateOf<AISearchResult?>(null) }
    var glassError by remember { mutableStateOf<GlassMessageData?>(null) }

    val aiProvider = remember(repository) { AISearchProvider(repository) }

    var recentSearches by remember {
        mutableStateOf(listOf("Google Photos", "AVANYX Launcher", "Camera Pro", "Racing 3D"))
    }

    val trendingKeywords = remember {
        listOf("AI Assistant", "VPN Proxy", "Crypto Wallet", "Cyberpunk", "Audiobook", "Photo Editor", "Cloud Gaming")
    }

    val popularCategories = remember {
        listOf("Games", "Tools", "Productivity", "Social", "Entertainment", "Finance", "Action", "Puzzle")
    }

    val allApps by repository.getApps().collectAsState(initial = emptyList())

    val searchResults = remember(searchQuery, allApps) {
        if (searchQuery.isBlank()) emptyList() else allApps.filter {
            it.name.contains(searchQuery, ignoreCase = true) ||
                    it.developer.contains(searchQuery, ignoreCase = true) ||
                    it.category.contains(searchQuery, ignoreCase = true)
        }
    }

    // Voice Speech Launcher
    val voiceSpeechLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == android.app.Activity.RESULT_OK) {
            val spokenText = result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)?.firstOrNull()
            if (!spokenText.isNullOrEmpty()) {
                searchQuery = spokenText
                onShowMessage("Voice recognized: '$spokenText'")
            }
        }
    }

    // Permission Launcher for RECORD_AUDIO
    val recordAudioPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_PROMPT, "Speak to search AVANYX Store...")
            }
            try {
                voiceSpeechLauncher.launch(intent)
            } catch (e: Throwable) {
                onShowMessage("Voice Speech Recognition unavailable on this device.")
            }
        } else {
            glassError = GlassMessageData(
                title = "Permission Required",
                description = "Microphone access is required for Voice Speech search.",
                type = GlassMessageType.WARNING
            )
        }
    }

    fun executeAiSearch() {
        if (searchQuery.isBlank()) return
        isAiLoading = true
        glassError = null
        scope.launch {
            try {
                val res = aiProvider.searchWithAI(searchQuery, allApps)
                aiResult = res
                if (!res.isSuccess) {
                    glassError = GlassMessageData(
                        title = "AI Engine Notice",
                        description = res.errorMessage ?: "AI query completed with partial results.",
                        type = GlassMessageType.INFO
                    )
                }
            } catch (e: Throwable) {
                glassError = GlassMessageData(
                    title = "AI Search Provider Notice",
                    description = "AI query unavailable. Normal catalog search remains fully operational.",
                    type = GlassMessageType.INFO
                )
            } finally {
                isAiLoading = false
            }
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .testTag("search_screen")
    ) {
        // Search Header Title
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Search & Discover",
                    style = MaterialTheme.typography.headlineMedium.copy(
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 28.sp,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                )

                // Search Mode Toggle (Normal vs AI)
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
                ) {
                    Row(modifier = Modifier.padding(2.dp)) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(18.dp))
                                .background(if (!isAiSearchMode) MaterialTheme.colorScheme.primary else Color.Transparent)
                                .clickable {
                                    isAiSearchMode = false
                                    glassError = null
                                }
                                .padding(horizontal = 10.dp, vertical = 6.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Normal",
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = if (!isAiSearchMode) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(18.dp))
                                .background(if (isAiSearchMode) Color(0xFF9C27B0) else Color.Transparent)
                                .clickable {
                                    isAiSearchMode = true
                                    if (searchQuery.isNotBlank()) executeAiSearch()
                                }
                                .padding(horizontal = 10.dp, vertical = 6.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.AutoAwesome,
                                    contentDescription = "AI Search",
                                    tint = if (isAiSearchMode) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.size(12.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "AI Search",
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = if (isAiSearchMode) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }

        // Search Input Field Bar
        Surface(
            shape = RoundedCornerShape(28.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
            border = BorderStroke(1.dp, if (isAiSearchMode) Color(0xFF9C27B0).copy(alpha = 0.4f) else MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 4.dp)
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = {
                    searchQuery = it
                    if (isAiSearchMode && it.isBlank()) {
                        aiResult = null
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("search_text_input"),
                placeholder = {
                    Text(
                        text = if (isAiSearchMode) "Ask AI e.g. 'Best privacy tools for Android'..." else "Search apps, games, developers...",
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                    )
                },
                leadingIcon = {
                    Icon(
                        imageVector = if (isAiSearchMode) Icons.Default.AutoAwesome else Icons.Default.Search,
                        contentDescription = "Search Icon",
                        tint = if (isAiSearchMode) Color(0xFF9C27B0) else MaterialTheme.colorScheme.primary
                    )
                },
                trailingIcon = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(
                                onClick = {
                                    searchQuery = ""
                                    aiResult = null
                                },
                                modifier = Modifier.testTag("clear_search_button")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Clear,
                                    contentDescription = "Clear search",
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        IconButton(
                            onClick = { recordAudioPermissionLauncher.launch(android.Manifest.permission.RECORD_AUDIO) },
                            modifier = Modifier.testTag("voice_search_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Mic,
                                contentDescription = "Voice Search",
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(28.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = Color.Transparent,
                    unfocusedContainerColor = Color.Transparent,
                    focusedBorderColor = Color.Transparent,
                    unfocusedBorderColor = Color.Transparent
                ),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                keyboardActions = KeyboardActions(onSearch = {
                    focusManager.clearFocus()
                    if (searchQuery.isNotBlank() && !recentSearches.contains(searchQuery)) {
                        recentSearches = listOf(searchQuery) + recentSearches.take(5)
                    }
                    if (isAiSearchMode) {
                        executeAiSearch()
                    }
                })
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Content Area
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .weight(1f),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
        ) {
            if (glassError != null) {
                item {
                    GlassMessageCard(
                        messageData = glassError!!,
                        onDismiss = { glassError = null },
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                }
            }

            if (isAiSearchMode && searchQuery.isNotBlank()) {
                // AI SEARCH RESULTS MODE
                if (isAiLoading) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(180.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                CircularProgressIndicator(color = Color(0xFF9C27B0))
                                Spacer(modifier = Modifier.height(12.dp))
                                Text(
                                    text = "Analyzing query with AI Knowledge Engine...",
                                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                } else if (aiResult != null) {
                    item {
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = Color(0xFF1E102E).copy(alpha = 0.85f),
                            border = BorderStroke(1.dp, Color(0xFF9C27B0).copy(alpha = 0.35f)),
                            shadowElevation = 6.dp,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp)
                        ) {
                            Column(modifier = Modifier.padding(18.dp)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.AutoAwesome,
                                        contentDescription = null,
                                        tint = Color(0xFFD8B4FE),
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Text(
                                        text = aiResult!!.sourceTitle,
                                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                        color = Color.White
                                    )
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                Text(
                                    text = aiResult!!.summary,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = Color.White.copy(alpha = 0.9f)
                                )

                                if (!aiResult!!.sourceUrl.isNullOrEmpty()) {
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Text(
                                        text = "Source Index: ${aiResult!!.sourceUrl}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Color(0xFFD8B4FE)
                                    )
                                }
                            }
                        }
                    }

                    if (aiResult!!.matchedApps.isNotEmpty()) {
                        item {
                            Text(
                                text = "AI Recommended Apps",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onBackground,
                                modifier = Modifier.padding(vertical = 8.dp)
                            )
                        }

                        items(aiResult!!.matchedApps) { app ->
                            AppCard(
                                app = app,
                                onClick = { onNavigateToDetails(app.id) },
                                onInstallClick = { onShowMessage("Downloading ${app.name}...") },
                                modifier = Modifier.padding(vertical = 4.dp)
                            )
                        }
                    }
                }
            } else if (searchQuery.isBlank()) {
                // DISCOVERY MODE (EMPTY QUERY)

                // 1. RECENT SEARCHES
                if (recentSearches.isNotEmpty()) {
                    item {
                        Column(modifier = Modifier.padding(vertical = 8.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Recent Searches",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onBackground
                                )
                                TextTextButton(
                                    text = "Clear",
                                    onClick = { recentSearches = emptyList() }
                                )
                            }

                            LazyRow(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.padding(top = 4.dp)
                            ) {
                                items(recentSearches) { recent ->
                                    SuggestionChip(
                                        onClick = { searchQuery = recent },
                                        label = { Text(recent) },
                                        icon = { Icon(Icons.Default.History, contentDescription = null, modifier = Modifier.size(16.dp)) },
                                        shape = RoundedCornerShape(12.dp),
                                        colors = SuggestionChipDefaults.suggestionChipColors(
                                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                                        )
                                    )
                                }
                            }
                        }
                    }
                }

                // 2. TRENDING SEARCHES
                item {
                    Column(modifier = Modifier.padding(vertical = 12.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(bottom = 8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.TrendingUp,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Trending Searches",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onBackground
                            )
                        }

                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(trendingKeywords) { keyword ->
                                FilterChip(
                                    selected = false,
                                    onClick = { searchQuery = keyword },
                                    label = { Text(keyword) },
                                    shape = RoundedCornerShape(16.dp),
                                    leadingIcon = {
                                        Text("#", fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.primary)
                                    }
                                )
                            }
                        }
                    }
                }

                // 3. POPULAR CATEGORIES
                item {
                    Column(modifier = Modifier.padding(vertical = 12.dp)) {
                        Text(
                            text = "Popular Categories",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onBackground,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )

                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            items(popularCategories) { cat ->
                                Surface(
                                    shape = RoundedCornerShape(16.dp),
                                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)),
                                    modifier = Modifier.clickable { searchQuery = cat }
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = when (cat) {
                                                "Games" -> Icons.Default.SportsEsports
                                                "Tools" -> Icons.Default.Build
                                                "Productivity" -> Icons.Default.Work
                                                "Social" -> Icons.Default.People
                                                "Finance" -> Icons.Default.AttachMoney
                                                else -> Icons.Default.Category
                                            },
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.size(18.dp)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = cat,
                                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // 4. SUGGESTED DEVELOPERS
                item {
                    Column(modifier = Modifier.padding(vertical = 12.dp)) {
                        Text(
                            text = "Suggested Developers",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onBackground,
                            modifier = Modifier.padding(bottom = 10.dp)
                        )

                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            SuggestedDeveloperCard(
                                devId = "google",
                                name = "Google LLC",
                                category = "Productivity & Utilities",
                                logoUrl = "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&w=200&q=80",
                                isVerified = true,
                                onClick = {
                                    if (onNavigateToDeveloper != null) {
                                        onNavigateToDeveloper("google")
                                    } else {
                                        searchQuery = "Google"
                                    }
                                },
                                modifier = Modifier.weight(1f)
                            )

                            SuggestedDeveloperCard(
                                devId = "avanyx",
                                name = "AVANYX Studios",
                                category = "Mobile Utilities & Gaming",
                                logoUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80",
                                isVerified = true,
                                onClick = {
                                    if (onNavigateToDeveloper != null) {
                                        onNavigateToDeveloper("avanyx")
                                    } else {
                                        searchQuery = "AVANYX"
                                    }
                                },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }

                // 5. RECOMMENDED APPS
                item {
                    Column(modifier = Modifier.padding(vertical = 12.dp)) {
                        Text(
                            text = "Recommended for you",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onBackground,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                    }
                }

                items(allApps.take(4)) { app ->
                    AppCard(
                        app = app,
                        onClick = { onNavigateToDetails(app.id) },
                        onInstallClick = { onShowMessage("Downloading ${app.name}...") },
                        modifier = Modifier.padding(vertical = 4.dp)
                    )
                }

            } else {
                // NORMAL SEARCH RESULTS MODE
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Results for '$searchQuery' (${searchResults.size})",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onBackground
                        )
                    }
                }

                if (searchResults.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(250.dp)
                                .testTag("search_empty_state"),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    imageVector = Icons.Default.SearchOff,
                                    contentDescription = "No results",
                                    modifier = Modifier.size(64.dp),
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                Text(
                                    text = "No applications match '$searchQuery'",
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "Try searching for categories or switch to AI Search mode",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                                    modifier = Modifier.padding(top = 4.dp)
                                )
                            }
                        }
                    }
                } else {
                    items(searchResults) { app ->
                        AppCard(
                            app = app,
                            onClick = { onNavigateToDetails(app.id) },
                            onInstallClick = { onShowMessage("Downloading ${app.name}...") },
                            modifier = Modifier.padding(vertical = 4.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun SuggestedDeveloperCard(
    devId: String,
    name: String,
    category: String,
    logoUrl: String,
    isVerified: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        ),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Surface(
                shape = CircleShape,
                shadowElevation = 2.dp,
                modifier = Modifier.size(48.dp)
            ) {
                AsyncImage(
                    model = logoUrl,
                    contentDescription = name,
                    modifier = Modifier.fillMaxSize()
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = name,
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                if (isVerified) {
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        imageVector = Icons.Default.Verified,
                        contentDescription = "Verified",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }
            Text(
                text = category,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
fun TextTextButton(
    text: String,
    onClick: () -> Unit
) {
    Text(
        text = text,
        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 8.dp, vertical = 4.dp)
    )
}

private fun String?.isNull_orEmpty(): Boolean = this == null || this.trim().isEmpty()
