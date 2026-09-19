package com.avanyx.store.ui.screens

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.avanyx.store.data.model.DeveloperInfo
import com.avanyx.store.data.model.StoreApp
import com.avanyx.store.data.repository.AppRepository
import com.avanyx.store.firebase.FirestoreService
import com.avanyx.store.firebase.model.FirestoreDeveloper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

enum class SortOption {
    POPULAR, NEWEST, RATING, DOWNLOADS
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeveloperProfileScreen(
    developerId: String,
    repository: AppRepository,
    onBack: () -> Unit,
    onAppClick: (String) -> Unit,
    onShowMessage: (String) -> Unit,
    onDeveloperClick: ((String) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current

    val sharedPrefs = remember(context) {
        context.getSharedPreferences("avanyx_store_follows", Context.MODE_PRIVATE)
    }
    val followKey = remember(developerId) { "follow_${developerId.lowercase()}" }
    var isFollowing by remember(developerId) {
        mutableStateOf(sharedPrefs.getBoolean(followKey, false))
    }

    val baseDevInfo = remember(developerId) {
        repository.getDeveloperInfo(developerId)
    }

    var firestoreDev by remember { mutableStateOf<FirestoreDeveloper?>(null) }
    var isLoadingDev by remember { mutableStateOf(false) }

    LaunchedEffect(developerId) {
        isLoadingDev = true
        withContext(Dispatchers.IO) {
            try {
                val service = FirestoreService()
                val devResult = service.getDeveloperProfile(developerId)
                val dev = devResult.getOrNull()
                if (dev != null) {
                    firestoreDev = dev
                }
            } catch (e: Exception) {
                // Keep baseDevInfo on offline/error
            } finally {
                isLoadingDev = false
            }
        }
    }

    // Combine Room/Static with real live Firestore developer data
    val developerInfo = remember(baseDevInfo, firestoreDev) {
        val dev = firestoreDev
        if (dev != null) {
            baseDevInfo.copy(
                id = dev.id.ifBlank { dev.uid.ifBlank { baseDevInfo.id } },
                developerUid = dev.uid.ifBlank { dev.developerUid.ifBlank { dev.id } },
                name = dev.companyName.ifBlank { dev.name.ifBlank { dev.displayName.ifBlank { baseDevInfo.name } } },
                description = dev.bio.ifBlank { dev.shortDescription.ifBlank { baseDevInfo.description } },
                bio = dev.bio.ifBlank { baseDevInfo.bio },
                organizationName = dev.organizationName.ifBlank { baseDevInfo.organizationName.ifBlank { "AVANYX Technologies" } },
                website = dev.officialWebsite.ifBlank { dev.website },
                officialWebsite = dev.officialWebsite.ifBlank { dev.website },
                email = dev.supportEmail.ifBlank { dev.email.ifBlank { baseDevInfo.email } },
                bannerUrl = dev.bannerUrl.ifBlank { baseDevInfo.bannerUrl },
                logoUrl = dev.avatarUrl.ifBlank { dev.logoUrl.ifBlank { baseDevInfo.logoUrl } },
                avatarUrl = dev.avatarUrl.ifBlank { baseDevInfo.avatarUrl },
                country = dev.country.ifBlank { baseDevInfo.country },
                isVerified = dev.isVerified || dev.verified || baseDevInfo.isVerified,
                companyName = dev.companyName.ifBlank { baseDevInfo.companyName },
                supportEmail = dev.supportEmail.ifBlank { baseDevInfo.supportEmail },
                privacyPolicyUrl = dev.privacyPolicyUrl.ifBlank { baseDevInfo.privacyPolicyUrl },
                githubUrl = dev.githubUrl,
                instagramUrl = dev.instagramUrl,
                whatsappUrl = dev.whatsappUrl,
                youtubeUrl = dev.youtubeUrl,
                facebookUrl = dev.facebookUrl,
                extraOtherLinks = dev.extraOtherLinks,
                otherLinks = dev.otherLinks,
                totalDownloads = if (dev.totalDownloads > 0) dev.totalDownloads else baseDevInfo.totalDownloads,
                totalAppsPublished = if (dev.totalAppsPublished > 0) dev.totalAppsPublished else baseDevInfo.totalAppsPublished,
                downloads = if (dev.totalDownloads > 0) "${dev.totalDownloads}" else baseDevInfo.downloads
            )
        } else {
            baseDevInfo
        }
    }

    val allStoreApps by repository.getApps().collectAsStateWithLifecycle(initialValue = emptyList())

    val allDevApps = remember(allStoreApps, developerId, developerInfo.name) {
        val filtered = allStoreApps.filter { app ->
            (app.developerUid.isNotBlank() && (app.developerUid.equals(developerId, ignoreCase = true) || app.developerUid.equals(developerInfo.id, ignoreCase = true))) ||
                    app.developer.equals(developerInfo.name, ignoreCase = true) ||
                    app.developer.contains(developerId, ignoreCase = true) ||
                    (developerId.contains("avanyx", ignoreCase = true) && app.developer.contains("avanyx", ignoreCase = true))
        }
        if (filtered.isNotEmpty()) filtered else repository.getAppsByDeveloper(developerId)
    }

    var searchQuery by remember { mutableStateOf("") }
    var isGridView by remember { mutableStateOf(false) }
    var selectedSort by remember { mutableStateOf(SortOption.POPULAR) }
    var selectedCategoryFilter by remember { mutableStateOf("All") }

    // Featured app selection
    val featuredApp = remember(allDevApps) {
        allDevApps.firstOrNull { it.isFeatured } ?: allDevApps.firstOrNull()
    }

    // Filtered & sorted apps
    val displayedApps = remember(allDevApps, searchQuery, selectedSort, selectedCategoryFilter) {
        allDevApps.filter { app ->
            val matchesQuery = searchQuery.isBlank() || app.name.contains(searchQuery, ignoreCase = true) || app.category.contains(searchQuery, ignoreCase = true)
            val matchesCategory = when (selectedCategoryFilter) {
                "Games" -> app.isGame
                "Apps" -> !app.isGame
                "All" -> true
                else -> app.category.equals(selectedCategoryFilter, ignoreCase = true)
            }
            matchesQuery && matchesCategory
        }.sortedWith { a, b ->
            when (selectedSort) {
                SortOption.RATING -> b.rating.compareTo(a.rating)
                SortOption.POPULAR -> b.rating.compareTo(a.rating)
                SortOption.NEWEST -> b.version.compareTo(a.version)
                SortOption.DOWNLOADS -> b.size.compareTo(a.size)
            }
        }
    }

    val downloadEngine = remember(context) { com.avanyx.store.download.DownloadManagerEngine.getInstance(context) }
    val appsManager = remember(context) { com.avanyx.store.manager.InstalledAppsManager.getInstance(context) }
    val downloadsMap by downloadEngine.downloadsMap.collectAsStateWithLifecycle()
    val installedApps by appsManager.installedAppsFlow.collectAsStateWithLifecycle(initialValue = emptyList())
    val installedMap = remember(installedApps) { installedApps.associateBy { it.packageName } }
    var showTopMenu by remember { mutableStateOf(false) }
    var showShareSheet by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = developerInfo.name,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        if (developerInfo.isVerified) {
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(
                                imageVector = Icons.Default.Verified,
                                contentDescription = "Verified",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack, modifier = Modifier.testTag("dev_back_button")) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    Box {
                        IconButton(
                            onClick = { showTopMenu = true },
                            modifier = Modifier.testTag("dev_three_dots_button")
                        ) {
                            Icon(Icons.Default.MoreVert, contentDescription = "More Options")
                        }

                        DropdownMenu(
                            expanded = showTopMenu,
                            onDismissRequest = { showTopMenu = false }
                        ) {
                            DropdownMenuItem(
                                text = { Text("Share Developer Profile") },
                                leadingIcon = { Icon(Icons.Default.Share, contentDescription = null) },
                                onClick = {
                                    showTopMenu = false
                                    showShareSheet = true
                                },
                                modifier = Modifier.testTag("dev_menu_share")
                            )
                            DropdownMenuItem(
                                text = { Text("Visit Official Website") },
                                leadingIcon = { Icon(Icons.Default.Language, contentDescription = null) },
                                onClick = {
                                    showTopMenu = false
                                    val webUrl = developerInfo.officialWebsite?.takeIf { it.isNotBlank() } ?: "https://store-avanyx.pages.dev"
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(webUrl))
                                    try {
                                        context.startActivity(intent)
                                    } catch (e: Exception) {
                                        onShowMessage("Could not open browser")
                                    }
                                }
                            )
                            DropdownMenuItem(
                                text = { Text("Copy Store Profile Link") },
                                leadingIcon = { Icon(Icons.Default.ContentCopy, contentDescription = null) },
                                onClick = {
                                    showTopMenu = false
                                    val devKey = developerInfo.developerUid.ifBlank { developerInfo.id }
                                    val storeDevLink = "https://store-avanyx.pages.dev/developer?id=$devKey"
                                    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                                    val clip = android.content.ClipData.newPlainText("AVANYX Developer Link", storeDevLink)
                                    clipboard.setPrimaryClip(clip)
                                    onShowMessage("Official website profile link copied!")
                                }
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        modifier = modifier.testTag("developer_profile_screen")
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            // HERO BANNER & LOGO HEADER
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                ) {
                    // Banner Image / Gradient
                    if (!developerInfo.bannerUrl.isNullOrEmpty()) {
                        AsyncImage(
                            model = developerInfo.bannerUrl,
                            contentDescription = "Developer Banner",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.horizontalGradient(
                                        colors = listOf(
                                            MaterialTheme.colorScheme.primary,
                                            MaterialTheme.colorScheme.tertiary
                                        )
                                    )
                                )
                        )
                    }

                    // Scrim gradient
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.verticalGradient(
                                    colors = listOf(
                                        Color.Transparent,
                                        Color.Black.copy(alpha = 0.6f)
                                    )
                                )
                            )
                    )
                }

                // Profile Overlay Card
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .offset(y = (-36).dp),
                        verticalAlignment = Alignment.Bottom,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        // Logo Avatar
                        Surface(
                            shape = CircleShape,
                            shadowElevation = 6.dp,
                            border = BorderStroke(3.dp, MaterialTheme.colorScheme.surface),
                            modifier = Modifier.size(80.dp)
                        ) {
                            if (!developerInfo.logoUrl.isNullOrEmpty()) {
                                AsyncImage(
                                    model = developerInfo.logoUrl,
                                    contentDescription = "Developer Logo",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            } else {
                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .background(MaterialTheme.colorScheme.primaryContainer),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = developerInfo.name.take(2).uppercase(),
                                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                            }
                        }

                        // Persistent Action button (Follow / Following)
                        Button(
                            onClick = {
                                val nextState = !isFollowing
                                isFollowing = nextState
                                sharedPrefs.edit().putBoolean(followKey, nextState).apply()
                                if (nextState) {
                                    onShowMessage("You are now following ${developerInfo.name}")
                                } else {
                                    onShowMessage("Unfollowed ${developerInfo.name}")
                                }
                            },
                            shape = RoundedCornerShape(20.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isFollowing) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.primary,
                                contentColor = if (isFollowing) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onPrimary
                            ),
                            modifier = Modifier
                                .offset(y = (-8).dp)
                                .height(38.dp)
                        ) {
                            Icon(
                                imageVector = if (isFollowing) Icons.Default.Check else Icons.Default.Add,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = if (isFollowing) "Following" else "Follow",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    // Dev Name and Tagline
                    Column(modifier = Modifier.offset(y = (-20).dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = developerInfo.name,
                                style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.ExtraBold),
                                color = MaterialTheme.colorScheme.onBackground
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(
                                imageVector = Icons.Default.Verified,
                                contentDescription = "Verified",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(22.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = developerInfo.description,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            lineHeight = 20.sp
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // Organization Details (Tapping takes them to organization profile)
                        val currentOrgName = developerInfo.organizationName.ifBlank { "AVANYX Technologies" }
                        Surface(
                            shape = RoundedCornerShape(14.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.25f)),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onDeveloperClick?.invoke(currentOrgName) }
                                .testTag("dev_organization_banner")
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.CorporateFare,
                                        contentDescription = "Organization",
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(10.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "Organization",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Text(
                                        text = currentOrgName,
                                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                                Text(
                                    text = "View Org →",
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // OFFICIAL LINK BAR DISPLAYING ONLY FIRESTORE LINKS (NO HARDCODED FALLBACKS)
                        val linkItems = remember(developerInfo) {
                            val list = mutableListOf<DeveloperLinkData>()
                            val yt = developerInfo.youtubeUrl?.trim().orEmpty()
                            if (yt.isNotBlank()) {
                                list.add(
                                    DeveloperLinkData(
                                        title = "YouTube",
                                        url = yt,
                                        icon = Icons.Default.PlayCircle,
                                        brandColor = Color(0xFFFF0000),
                                        subtitle = "Channel"
                                    )
                                )
                            }
                            val ig = developerInfo.instagramUrl?.trim().orEmpty()
                            if (ig.isNotBlank()) {
                                list.add(
                                    DeveloperLinkData(
                                        title = "Instagram",
                                        url = ig,
                                        icon = Icons.Default.PhotoCamera,
                                        brandColor = Color(0xFFE1306C),
                                        subtitle = "Community"
                                    )
                                )
                            }
                            val fb = developerInfo.facebookUrl?.trim().orEmpty()
                            if (fb.isNotBlank()) {
                                list.add(
                                    DeveloperLinkData(
                                        title = "Facebook",
                                        url = fb,
                                        icon = Icons.Default.Public,
                                        brandColor = Color(0xFF1877F2),
                                        subtitle = "Official Page"
                                    )
                                )
                            }
                            val gh = developerInfo.githubUrl?.trim().orEmpty()
                            if (gh.isNotBlank()) {
                                list.add(
                                    DeveloperLinkData(
                                        title = "GitHub",
                                        url = gh,
                                        icon = Icons.Default.Code,
                                        brandColor = Color(0xFF24292E),
                                        subtitle = "Repository"
                                    )
                                )
                            }
                            val web = developerInfo.officialWebsite?.trim()?.takeIf { it.isNotBlank() }
                                ?: developerInfo.website?.trim()?.takeIf { it.isNotBlank() }.orEmpty()
                            if (web.isNotBlank()) {
                                list.add(
                                    DeveloperLinkData(
                                        title = "Official Website",
                                        url = web,
                                        icon = Icons.Default.Language,
                                        brandColor = Color(0xFF0F9D58),
                                        subtitle = "Website"
                                    )
                                )
                            }
                            list
                        }

                        if (linkItems.isNotEmpty()) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("dev_link_bar")
                            ) {
                                Text(
                                    text = "Official Links & Connect",
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onBackground
                                )
                                Spacer(modifier = Modifier.height(8.dp))

                                LazyRow(
                                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                                    contentPadding = PaddingValues(end = 12.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    items(linkItems) { link ->
                                        DeveloperLinkChip(
                                            item = link,
                                            onClick = {
                                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(link.url))
                                                try {
                                                    context.startActivity(intent)
                                                } catch (e: Exception) {
                                                    onShowMessage("Could not open ${link.title}: ${e.message}")
                                                }
                                            }
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))
                        }

                        // Stats Highlights Row
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            contentPadding = PaddingValues(end = 12.dp)
                        ) {
                            item {
                                DeveloperStatChip(
                                    icon = Icons.Default.Star,
                                    label = "${developerInfo.rating}",
                                    subtitle = "Rating"
                                )
                            }
                            item {
                                DeveloperStatChip(
                                    icon = Icons.Default.GetApp,
                                    label = developerInfo.downloads,
                                    subtitle = "Downloads"
                                )
                            }
                            item {
                                DeveloperStatChip(
                                    icon = Icons.Default.People,
                                    label = if (isFollowing) "${developerInfo.followers} (+1)" else developerInfo.followers,
                                    subtitle = "Followers"
                                )
                            }
                            item {
                                DeveloperStatChip(
                                    icon = Icons.Default.Apps,
                                    label = "${developerInfo.totalAppsPublished}",
                                    subtitle = "Apps"
                                )
                            }
                            item {
                                DeveloperStatChip(
                                    icon = Icons.Default.Public,
                                    label = developerInfo.country,
                                    subtitle = "Region"
                                )
                            }
                        }
                    }
                }
            }

            // FEATURED APP SECTION (PLAY STORE STYLE)
            if (featuredApp != null) {
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 8.dp)
                    ) {
                        Text(
                            text = "Featured app",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onBackground,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )

                        Card(
                            onClick = { onAppClick(featuredApp.id) },
                            shape = RoundedCornerShape(20.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                            ),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                // Horizontal Screenshot Carousel Mockup
                                LazyRow(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    modifier = Modifier.padding(bottom = 14.dp)
                                ) {
                                    items(3) { index ->
                                        Box(
                                            modifier = Modifier
                                                .width(140.dp)
                                                .height(200.dp)
                                                .clip(RoundedCornerShape(14.dp))
                                                .background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                                Icon(
                                                    imageVector = Icons.Default.Smartphone,
                                                    contentDescription = null,
                                                    tint = MaterialTheme.colorScheme.primary,
                                                    modifier = Modifier.size(36.dp)
                                                )
                                                Spacer(modifier = Modifier.height(6.dp))
                                                Text(
                                                    text = "Preview ${index + 1}",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                                )
                                            }
                                        }
                                    }
                                }

                                // Featured App Header Row
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    // App Icon Box
                                    Box(
                                        modifier = Modifier
                                            .size(52.dp)
                                            .clip(RoundedCornerShape(14.dp))
                                            .background(
                                                try {
                                                    Color(android.graphics.Color.parseColor(featuredApp.iconBgColorHex))
                                                } catch (e: Exception) {
                                                    MaterialTheme.colorScheme.primary
                                                }
                                            ),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = featuredApp.iconText,
                                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                            color = Color.White
                                        )
                                    }

                                    Spacer(modifier = Modifier.width(12.dp))

                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = featuredApp.name,
                                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                            color = MaterialTheme.colorScheme.onSurface,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Text(
                                            text = "${featuredApp.category} • ${featuredApp.shortDescription.take(30)}...",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                text = "${featuredApp.rating}",
                                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold)
                                            )
                                            Icon(
                                                imageVector = Icons.Default.Star,
                                                contentDescription = null,
                                                tint = Color(0xFFFFB800),
                                                modifier = Modifier.size(14.dp).padding(start = 2.dp)
                                            )
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text(
                                                text = featuredApp.size,
                                                style = MaterialTheme.typography.labelSmall,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.width(8.dp))

                                    Button(
                                        onClick = { onAppClick(featuredApp.id) },
                                        shape = RoundedCornerShape(16.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                                        modifier = Modifier.height(36.dp)
                                    ) {
                                        Text("GET", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // ALL APPS CATALOG HEADER & CONTROLS
            item {
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
                            text = "All apps (${displayedApps.size})",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onBackground
                        )

                        IconButton(onClick = { isGridView = !isGridView }) {
                            Icon(
                                imageVector = if (isGridView) Icons.Default.ViewList else Icons.Default.GridView,
                                contentDescription = "Toggle View",
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                    }

                    // Search Bar within catalog
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Search ${developerInfo.name} apps...") },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                        trailingIcon = {
                            if (searchQuery.isNotEmpty()) {
                                IconButton(onClick = { searchQuery = "" }) {
                                    Icon(Icons.Default.Clear, contentDescription = "Clear search")
                                }
                            }
                        },
                        singleLine = true,
                        shape = RoundedCornerShape(16.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                            focusedContainerColor = MaterialTheme.colorScheme.surface
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp)
                    )

                    // Category & Sort Chips Row
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(top = 4.dp, bottom = 12.dp)
                    ) {
                        items(listOf("All", "Apps", "Games")) { cat ->
                            FilterChip(
                                selected = selectedCategoryFilter == cat,
                                onClick = { selectedCategoryFilter = cat },
                                label = { Text(cat) },
                                shape = RoundedCornerShape(12.dp)
                            )
                        }

                        item {
                            FilterChip(
                                selected = selectedSort == SortOption.POPULAR,
                                onClick = { selectedSort = SortOption.POPULAR },
                                label = { Text("Popular") },
                                leadingIcon = { Icon(Icons.Default.TrendingUp, contentDescription = null, modifier = Modifier.size(16.dp)) },
                                shape = RoundedCornerShape(12.dp)
                            )
                        }

                        item {
                            FilterChip(
                                selected = selectedSort == SortOption.RATING,
                                onClick = { selectedSort = SortOption.RATING },
                                label = { Text("Top Rated") },
                                leadingIcon = { Icon(Icons.Default.Star, contentDescription = null, modifier = Modifier.size(16.dp)) },
                                shape = RoundedCornerShape(12.dp)
                            )
                        }
                    }
                }
            }

            // APPS LIST OR GRID ITEMS
            if (displayedApps.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = Icons.Default.SearchOff,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(48.dp)
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "No applications match your search filter.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            } else {
                items(displayedApps) { app ->
                    val actionState = remember(installedMap, downloadsMap, app) {
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

                    Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)) {
                        com.avanyx.store.ui.components.AppCard(
                            app = app,
                            onClick = { onAppClick(app.id) },
                            actionState = actionState,
                            onActionClick = { state ->
                                when (state) {
                                    is com.avanyx.store.data.model.AppActionState.Install,
                                    is com.avanyx.store.data.model.AppActionState.Update -> {
                                        downloadEngine.startOrResumeDownload(
                                            appId = app.id,
                                            appName = app.name,
                                            downloadUrl = app.downloadUrl,
                                            expectedChecksum = app.checksumSha256
                                        )
                                        onShowMessage("Starting download for ${app.name}...")
                                    }
                                    is com.avanyx.store.data.model.AppActionState.Installed -> {
                                        val launched = appsManager.launchApp(context, app.packageName)
                                        if (!launched) {
                                            onShowMessage("${app.name} is installed.")
                                        }
                                    }
                                    is com.avanyx.store.data.model.AppActionState.Paused -> {
                                        downloadEngine.startOrResumeDownload(
                                            appId = app.id,
                                            appName = app.name,
                                            downloadUrl = app.downloadUrl,
                                            expectedChecksum = app.checksumSha256
                                        )
                                    }
                                    is com.avanyx.store.data.model.AppActionState.Downloading -> {
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
                            onDeveloperClick = onDeveloperClick
                        )
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }

    if (showShareSheet) {
        val devKey = developerInfo.developerUid.ifBlank { developerInfo.id }
        val devShareUrl = "https://store-avanyx.pages.dev/developer?id=$devKey"
        val orgName = developerInfo.organizationName.ifBlank { "AVANYX Technologies" }

        ModalBottomSheet(
            onDismissRequest = { showShareSheet = false },
            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
            containerColor = MaterialTheme.colorScheme.surface,
            dragHandle = { BottomSheetDefaults.DragHandle() },
            modifier = Modifier.testTag("profile_share_sheet")
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 8.dp)
                    .padding(bottom = 32.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Share Developer Profile",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    IconButton(onClick = { showShareSheet = false }) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Developer Preview Card
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f)
                    ),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = CircleShape,
                            modifier = Modifier.size(48.dp),
                            color = MaterialTheme.colorScheme.primaryContainer
                        ) {
                            if (!developerInfo.logoUrl.isNullOrEmpty()) {
                                AsyncImage(
                                    model = developerInfo.logoUrl,
                                    contentDescription = null,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            } else {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = developerInfo.name.take(2).uppercase(),
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = developerInfo.name,
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                if (developerInfo.isVerified) {
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Icon(
                                        imageVector = Icons.Default.Verified,
                                        contentDescription = "Verified",
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                            Text(
                                text = "AVANYX Store Official Catalog",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // ORGANIZATION DETAILS ON THE PROFILE SHARE SCREEN
                Text(
                    text = "Organization Details",
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.primary
                )

                Spacer(modifier = Modifier.height(6.dp))

                Card(
                    onClick = {
                        showShareSheet = false
                        onDeveloperClick?.invoke(orgName)
                    },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f)
                    ),
                    border = BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.4f)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("share_sheet_organization_card")
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.CorporateFare,
                                contentDescription = "Organization",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(24.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = orgName,
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Tap to view Organization's Profile",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }

                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                            contentDescription = "View Organization",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Official Link preview
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Link,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = devShareUrl,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f)
                        )
                        IconButton(
                            onClick = {
                                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                                val clip = android.content.ClipData.newPlainText("AVANYX Developer Link", devShareUrl)
                                clipboard.setPrimaryClip(clip)
                                onShowMessage("Official link copied!")
                            },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.ContentCopy,
                                contentDescription = "Copy Link",
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Action Buttons: Share via Apps & Open Website
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = {
                            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                val text = "Check out ${developerInfo.name} on AVANYX Store!\n" +
                                        "Developer Profile: $devShareUrl\n" +
                                        "Official Website: https://store-avanyx.pages.dev"
                                putExtra(Intent.EXTRA_TEXT, text)
                            }
                            context.startActivity(Intent.createChooser(shareIntent, "Share Developer Profile"))
                            showShareSheet = false
                        },
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .testTag("share_sheet_share_btn")
                    ) {
                        Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Share Profile", fontWeight = FontWeight.Bold)
                    }

                    OutlinedButton(
                        onClick = {
                            val webUrl = developerInfo.officialWebsite?.takeIf { it.isNotBlank() } ?: "https://store-avanyx.pages.dev"
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(webUrl))
                            try {
                                context.startActivity(intent)
                            } catch (e: Exception) {
                                onShowMessage("Could not open website")
                            }
                        },
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.height(48.dp)
                    ) {
                        Icon(Icons.Default.OpenInBrowser, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Website", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun DeveloperStatChip(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    subtitle: String,
    modifier: Modifier = Modifier
) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)),
        modifier = modifier
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Column {
                Text(
                    text = label,
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun DeveloperAppListItem(
    app: StoreApp,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // App Icon
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(
                        try {
                            Color(android.graphics.Color.parseColor(app.iconBgColorHex))
                        } catch (e: Exception) {
                            MaterialTheme.colorScheme.primary
                        }
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = app.iconText,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = Color.White
                )
            }

            Spacer(modifier = Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = app.name,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Text(
                    text = "${app.category} • v${app.version} • ${app.size}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(2.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "${app.rating}",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = null,
                        tint = Color(0xFFFFB800),
                        modifier = Modifier.size(14.dp).padding(start = 2.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = if (app.isGame) "Game" else "App",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            Button(
                onClick = onClick,
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp),
                modifier = Modifier.height(36.dp)
            ) {
                Text(
                    text = "GET",
                    color = MaterialTheme.colorScheme.onSecondaryContainer,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

data class DeveloperLinkData(
    val title: String,
    val url: String,
    val icon: ImageVector,
    val brandColor: Color,
    val subtitle: String
)

@Composable
fun DeveloperLinkChip(
    item: DeveloperLinkData,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        border = BorderStroke(1.dp, item.brandColor.copy(alpha = 0.35f)),
        modifier = modifier.height(58.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(item.brandColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = item.icon,
                    contentDescription = item.title,
                    tint = item.brandColor,
                    modifier = Modifier.size(20.dp)
                )
            }

            Spacer(modifier = Modifier.width(10.dp))

            Column {
                Text(
                    text = item.title,
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = item.subtitle,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.width(6.dp))

            Icon(
                imageVector = Icons.Default.OpenInNew,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                modifier = Modifier.size(14.dp)
            )
        }
    }
}

