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
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.ui.text.style.TextOverflow
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

    val fRepo = remember(db) { com.avanyx.store.data.repository.FirestoreRepository(appDatabase = db) }
    val liveFeaturedBanners: List<com.avanyx.store.firebase.model.FirestoreFeaturedBanner> by fRepo.observeFeaturedBanners().collectAsStateWithLifecycle(initialValue = emptyList())

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
                // Title & Logo branding matching official store
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    androidx.compose.foundation.Image(
                        painter = androidx.compose.ui.res.painterResource(id = com.avanyx.store.R.drawable.avanyx_logo),
                        contentDescription = "AVANYX Logo",
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(11.dp))
                    )
                    Column {
                        Text(
                            text = "AVANYX Store",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 18.sp,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = androidx.compose.material.icons.Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = Color(0xFF10B981),
                                modifier = Modifier.size(11.dp)
                            )
                            Spacer(modifier = Modifier.width(3.dp))
                            Text(
                                text = "100% Verified APKs",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 10.sp,
                                    color = Color(0xFF10B981)
                                )
                            )
                        }
                    }
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

        // Quick Search Bar with AI Voice indicator
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp)
                    .clip(RoundedCornerShape(100.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f))
                    .clickable(onClick = onNavigateToSearch)
                    .padding(horizontal = 16.dp, vertical = 12.dp)
                    .testTag("home_search_bar"),
                contentAlignment = Alignment.CenterStart
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Search",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = "Search verified APKs, games, AI...",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                        modifier = Modifier.weight(1f)
                    )
                    Surface(
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Mic,
                            contentDescription = "Voice Search",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier
                                .size(28.dp)
                                .padding(5.dp)
                        )
                    }
                }
            }
        }

        // Market Headline & Subtitle matching web store
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp)
            ) {
                Text(
                    text = "AVANYX Store: Android App Marketplace",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 19.sp,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                )
                Spacer(modifier = Modifier.height(3.dp))
                Text(
                    text = "AVANYX Store is an independent Android application marketplace and developer publishing platform providing direct APK downloads with zero telemetry and verified package integrity.",
                    style = MaterialTheme.typography.bodySmall.copy(
                        fontSize = 12.sp,
                        lineHeight = 16.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                )
            }
        }

        // Horizontal Categories filter chips
        item {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 6.dp),
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

        // Dynamic Special Banners (Developer Console / Admin promoted highlights from Firestore)
        item {
            val banners = remember(liveFeaturedBanners, allApps) {
                if (liveFeaturedBanners.isNotEmpty()) {
                    liveFeaturedBanners
                } else {
                    listOf(
                        com.avanyx.store.firebase.model.FirestoreFeaturedBanner(
                            id = "banner_speed_limit",
                            title = "Speed Limit 3D",
                            subtitle = "High-octane arcade racing simulation with realistic physics engine",
                            badgeText = "TOP RACING GAME",
                            targetAppId = allApps.find { it.name.contains("Speed", ignoreCase = true) }?.id ?: "speed_limit_3d",
                            ctaText = "Play Now",
                            imageUrl = "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80"
                        ),
                        com.avanyx.store.firebase.model.FirestoreFeaturedBanner(
                            id = "promo_alok",
                            title = "Alok Developer",
                            subtitle = "AVANYX Store official production releases & verified security",
                            badgeText = "FEATURED PUBLISHER",
                            targetAppId = allApps.find { it.id.contains("avanyx", ignoreCase = true) }?.id ?: (allApps.firstOrNull()?.id ?: ""),
                            ctaText = "View App",
                            imageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80"
                        )
                    )
                }
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 6.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Campaign,
                            contentDescription = null,
                            tint = Color(0xFFFFB800),
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Special Banners & Promotions",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold),
                            color = MaterialTheme.colorScheme.onBackground
                        )
                    }
                    Surface(
                        shape = RoundedCornerShape(100.dp),
                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)
                    ) {
                        Text(
                            text = if (liveFeaturedBanners.isNotEmpty()) "Live Cloud" else "Featured",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, fontSize = 10.sp),
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                        )
                    }
                }

                androidx.compose.foundation.lazy.LazyRow(
                    contentPadding = PaddingValues(horizontal = 20.dp),
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    items(banners) { banner ->
                        val targetApp = remember(banner.targetAppId, allApps) {
                            allApps.find { it.id == banner.targetAppId || it.packageName == banner.targetAppId }
                        }
                        Card(
                            shape = RoundedCornerShape(22.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)),
                            modifier = Modifier
                                .width(280.dp)
                                .height(175.dp)
                                .clickable {
                                    if (banner.targetAppId.isNotBlank()) {
                                        onNavigateToDetails(banner.targetAppId)
                                    } else if (targetApp != null) {
                                        onNavigateToDetails(targetApp.id)
                                    } else {
                                        onShowMessage("Banner: ${banner.title}")
                                    }
                                }
                        ) {
                            Box(modifier = Modifier.fillMaxSize()) {
                                val bannerImg = banner.imageUrl.ifBlank { banner.bannerImageUrl }
                                if (bannerImg.isNotBlank()) {
                                    com.avanyx.store.ui.components.StoreImageView(
                                        urlOrData = bannerImg,
                                        contentDescription = banner.title,
                                        contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                } else {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .background(
                                                androidx.compose.ui.graphics.Brush.linearGradient(
                                                    colors = listOf(Color(0xFF31104B), Color(0xFF12131C))
                                                )
                                            )
                                    )
                                }

                                // Dark Scrim Overlay
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .background(
                                            androidx.compose.ui.graphics.Brush.verticalGradient(
                                                colors = listOf(
                                                    Color.Black.copy(alpha = 0.35f),
                                                    Color.Black.copy(alpha = 0.88f)
                                                )
                                            )
                                        )
                                )

                                Column(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .padding(14.dp),
                                    verticalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Surface(
                                        shape = RoundedCornerShape(100.dp),
                                        color = Color.Black.copy(alpha = 0.65f),
                                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.2f))
                                    ) {
                                        Text(
                                            text = banner.badgeText.ifBlank { "FEATURED" }.uppercase(),
                                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold, fontSize = 9.sp),
                                            color = Color.White,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                        )
                                    }

                                    Column {
                                        Text(
                                            text = banner.title,
                                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold),
                                            color = Color.White,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = banner.subtitle,
                                            style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp, lineHeight = 14.sp),
                                            color = Color.White.copy(alpha = 0.85f),
                                            maxLines = 2,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                text = banner.ctaText.ifBlank { "View App" },
                                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold),
                                                color = Color(0xFFA78BFA)
                                            )
                                            Spacer(modifier = Modifier.width(3.dp))
                                            Icon(
                                                imageVector = Icons.AutoMirrored.Default.ArrowForward,
                                                contentDescription = null,
                                                tint = Color(0xFFA78BFA),
                                                modifier = Modifier.size(12.dp)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Editor's Choice Spotlight (Full-width Special Banner from Admin / Console)
        item {
            val spotlightApp = remember(allApps) {
                allApps.find { it.id.contains("avanyx", ignoreCase = true) || it.name.contains("avanyx", ignoreCase = true) }
                    ?: allApps.firstOrNull { it.isFeatured }
                    ?: allApps.firstOrNull()
            }

            if (spotlightApp != null) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Star,
                                contentDescription = null,
                                tint = Color(0xFFFFB800),
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Editor's Choice Spotlight",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold),
                                color = MaterialTheme.colorScheme.onBackground
                            )
                        }

                        Surface(
                            shape = RoundedCornerShape(100.dp),
                            color = Color(0xFFD97706).copy(alpha = 0.15f),
                            border = BorderStroke(1.dp, Color(0xFFD97706).copy(alpha = 0.4f))
                        ) {
                            Text(
                                text = "VERIFIED FEATURE",
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, fontSize = 9.sp),
                                color = Color(0xFFF59E0B),
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Card(
                        shape = RoundedCornerShape(22.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(210.dp)
                            .clickable { onNavigateToDetails(spotlightApp.id) }
                            .testTag("editor_choice_spotlight")
                    ) {
                        Box(modifier = Modifier.fillMaxSize()) {
                            // Feature Graphic Image
                            if (spotlightApp.bannerUrl.isNotBlank()) {
                                com.avanyx.store.ui.components.StoreImageView(
                                    urlOrData = spotlightApp.bannerUrl,
                                    contentDescription = "${spotlightApp.name} Spotlight Banner",
                                    contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            } else {
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .background(
                                            androidx.compose.ui.graphics.Brush.linearGradient(
                                                colors = listOf(Color(0xFF1E3A8A), Color(0xFF4338CA), Color(0xFF6D28D9))
                                            )
                                        )
                                    )
                            }

                            // Dark Gradient Scrim
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(
                                        androidx.compose.ui.graphics.Brush.verticalGradient(
                                            colors = listOf(
                                                Color.Black.copy(alpha = 0.35f),
                                                Color.Black.copy(alpha = 0.9f)
                                            )
                                        )
                                    )
                            )

                            // Top Badges
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp)
                                    .align(Alignment.TopStart),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Surface(
                                        color = Color.Black.copy(alpha = 0.65f),
                                        shape = RoundedCornerShape(100.dp),
                                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.2f))
                                    ) {
                                        Text(
                                            text = "FEATURED SPOTLIGHT",
                                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold, fontSize = 9.sp),
                                            color = Color.White,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                        )
                                    }
                                    Surface(
                                        color = Color(0xFF10B981),
                                        shape = RoundedCornerShape(100.dp)
                                    ) {
                                        Text(
                                            text = "FREE",
                                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold, fontSize = 9.sp),
                                            color = Color.White,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                        )
                                    }
                                }

                                Surface(
                                    color = Color.Black.copy(alpha = 0.65f),
                                    shape = RoundedCornerShape(100.dp),
                                    border = BorderStroke(1.dp, Color(0xFF10B981).copy(alpha = 0.4f))
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.VerifiedUser,
                                            contentDescription = null,
                                            tint = Color(0xFF10B981),
                                            modifier = Modifier.size(12.dp)
                                        )
                                        Spacer(modifier = Modifier.width(3.dp))
                                        Text(
                                            text = "99% Clean",
                                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, fontSize = 9.sp),
                                            color = Color(0xFF10B981)
                                        )
                                    }
                                }
                            }

                            // Bottom Content Overlay
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp)
                                    .align(Alignment.BottomStart),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(
                                    shape = RoundedCornerShape(14.dp),
                                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.3f)),
                                    modifier = Modifier.size(52.dp)
                                ) {
                                    com.avanyx.store.ui.components.AppIconView(
                                        app = spotlightApp,
                                        size = 52.dp,
                                        cornerRadius = 14.dp,
                                        fontSize = 18.sp
                                    )
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = spotlightApp.name,
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold),
                                        color = Color.White,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = "${spotlightApp.developer} • ★ ${spotlightApp.rating} • ${spotlightApp.size}",
                                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                                        color = Color.White.copy(alpha = 0.85f),
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }

                                Button(
                                    onClick = {
                                        downloadEngine.startOrResumeDownload(
                                            appId = spotlightApp.id,
                                            appName = spotlightApp.name,
                                            downloadUrl = spotlightApp.downloadUrl,
                                            expectedChecksum = spotlightApp.checksumSha256
                                        )
                                        onShowMessage("Downloading ${spotlightApp.name}...")
                                    },
                                    shape = RoundedCornerShape(100.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black),
                                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                                    modifier = Modifier.height(36.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.ArrowDownward,
                                        contentDescription = null,
                                        modifier = Modifier.size(14.dp).padding(end = 2.dp)
                                    )
                                    Text("Get App", fontWeight = FontWeight.ExtraBold, fontSize = 12.sp)
                                }
                            }
                        }
                    }
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
                    onDeveloperClick = null
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
