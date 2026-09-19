package com.avanyx.store.ui.screens

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.CorporateFare
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.OpenInBrowser
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PrivacyTip
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.layout.ContentScale
import coil.compose.AsyncImage
import com.avanyx.store.data.model.AppActionState
import com.avanyx.store.data.model.DownloadStatus
import com.avanyx.store.data.repository.AppRepository
import com.avanyx.store.download.DownloadManagerEngine
import com.avanyx.store.manager.InstalledAppsManager

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppDetailsScreen(
    appId: String,
    repository: AppRepository,
    onBack: () -> Unit,
    onShowMessage: (String) -> Unit,
    onDeveloperClick: ((String) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val allApps by repository.getApps().collectAsStateWithLifecycle(initialValue = emptyList())
    val app = remember(allApps, appId) { allApps.find { it.id == appId } ?: repository.getAppById(appId) }
    val reviews by repository.getReviewsForApp(appId).collectAsStateWithLifecycle(initialValue = emptyList())
    val coroutineScope = rememberCoroutineScope()
    var showReviewDialog by remember { mutableStateOf(false) }
    var reviewRating by remember { mutableIntStateOf(5) }
    var reviewComment by remember { mutableStateOf("") }
    var isSubmittingReview by remember { mutableStateOf(false) }
    var showTopMenu by remember { mutableStateOf(false) }
    var showShareSheet by remember { mutableStateOf(false) }
    var liveDeveloperProfile by remember { mutableStateOf<com.avanyx.store.firebase.model.FirestoreDeveloper?>(null) }

    LaunchedEffect(appId) {
        try {
            val db = com.avanyx.store.data.database.AppDatabase.getInstance(context)
            val fRepo = com.avanyx.store.data.repository.FirestoreRepository(appDatabase = db)
            fRepo.syncReviewsForApp(appId)
        } catch (_: Exception) {}
    }

    LaunchedEffect(app?.developerUid, app?.developer) {
        val devKey = app?.developerUid?.ifBlank { app.developer } ?: ""
        if (devKey.isNotBlank()) {
            try {
                val fService = com.avanyx.store.firebase.FirestoreService()
                val result = fService.getDeveloperProfile(devKey)
                if (result.isSuccess) {
                    liveDeveloperProfile = result.getOrNull()
                }
            } catch (_: Exception) {}
        }
    }

    val downloadEngine = remember(context) { DownloadManagerEngine.getInstance(context) }
    val appsManager = remember(context) { InstalledAppsManager.getInstance(context) }
    val downloadsMap by downloadEngine.downloadsMap.collectAsStateWithLifecycle()
    val installedApps by appsManager.installedAppsFlow.collectAsStateWithLifecycle(initialValue = emptyList())
    val downloadInfo = downloadsMap[appId]
    val installedApp = remember(installedApps, app) {
        if (app != null) installedApps.find { it.packageName == app.packageName } else null
    }

    if (app == null) {
        Box(
            modifier = modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "Application not found.",
                color = MaterialTheme.colorScheme.onBackground
            )
        }
        return
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .testTag("app_details_screen"),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // Back Button App Bar with Three-Dot Menu
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = onBack,
                    modifier = Modifier.testTag("back_button")
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Default.ArrowBack,
                        contentDescription = "Back",
                        tint = MaterialTheme.colorScheme.onBackground
                    )
                }
                Text(
                    text = "App Details",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.padding(start = 8.dp)
                )

                Spacer(modifier = Modifier.weight(1f))

                // Three-dot Menu
                Box {
                    IconButton(
                        onClick = { showTopMenu = true },
                        modifier = Modifier.testTag("app_three_dots_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.MoreVert,
                            contentDescription = "More Options",
                            tint = MaterialTheme.colorScheme.onBackground
                        )
                    }

                    val db = remember(context) { com.avanyx.store.data.database.AppDatabase.getInstance(context) }
                    val isWishlisted by db.wishlistDao().isWishlisted(app.id).collectAsStateWithLifecycle(initialValue = false)

                    DropdownMenu(
                        expanded = showTopMenu,
                        onDismissRequest = { showTopMenu = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text(if (isWishlisted) "Remove from Wishlist" else "Add to Wishlist") },
                            leadingIcon = {
                                Icon(
                                    imageVector = if (isWishlisted) Icons.Default.Star else Icons.Default.Star,
                                    contentDescription = null,
                                    tint = if (isWishlisted) Color(0xFFE11D48) else MaterialTheme.colorScheme.onSurface
                                )
                            },
                            onClick = {
                                showTopMenu = false
                                coroutineScope.launch(Dispatchers.IO) {
                                    val user = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser
                                    if (isWishlisted) {
                                        db.wishlistDao().removeFromWishlist(app.id)
                                        if (user != null) {
                                            com.avanyx.store.firebase.FirestoreService().removeWishlistItem(user.uid, app.id)
                                        }
                                    } else {
                                        db.wishlistDao().addToWishlist(com.avanyx.store.data.database.entity.WishlistItemEntity(appId = app.id))
                                        if (user != null) {
                                            com.avanyx.store.firebase.FirestoreService().saveWishlistItem(
                                                com.avanyx.store.firebase.model.FirestoreWishlistItem(
                                                    userId = user.uid,
                                                    appId = app.id,
                                                    addedTimestamp = System.currentTimeMillis()
                                                )
                                            )
                                        }
                                    }
                                }
                            },
                            modifier = Modifier.testTag("app_menu_wishlist")
                        )
                        DropdownMenuItem(
                            text = { Text("Share App") },
                            leadingIcon = { Icon(Icons.Default.Share, contentDescription = null) },
                            onClick = {
                                showTopMenu = false
                                showShareSheet = true
                            },
                            modifier = Modifier.testTag("app_menu_share")
                        )
                        DropdownMenuItem(
                            text = { Text("Visit Official Website") },
                            leadingIcon = { Icon(Icons.Default.Language, contentDescription = null) },
                            onClick = {
                                showTopMenu = false
                                val webUrl = liveDeveloperProfile?.officialWebsite?.takeIf { it.isNotBlank() }
                                    ?: "https://store-avanyx.pages.dev/app?id=${app.id}"
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(webUrl))
                                try {
                                    context.startActivity(intent)
                                } catch (e: Exception) {
                                    onShowMessage("Could not open browser")
                                }
                            },
                            modifier = Modifier.testTag("app_menu_website")
                        )
                        DropdownMenuItem(
                            text = { Text("Copy Store App Link") },
                            leadingIcon = { Icon(Icons.Default.ContentCopy, contentDescription = null) },
                            onClick = {
                                showTopMenu = false
                                val storeAppLink = "https://store-avanyx.pages.dev/app?id=${app.id}"
                                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                                val clip = android.content.ClipData.newPlainText("AVANYX App Link", storeAppLink)
                                clipboard.setPrimaryClip(clip)
                                onShowMessage("Official website app link copied!")
                            },
                            modifier = Modifier.testTag("app_menu_copy_link")
                        )
                        if (installedApp != null) {
                            HorizontalDivider()
                            DropdownMenuItem(
                                text = { Text("Uninstall App", color = Color(0xFFDC2626), fontWeight = FontWeight.Bold) },
                                leadingIcon = { Icon(Icons.Default.Delete, contentDescription = null, tint = Color(0xFFDC2626)) },
                                onClick = {
                                    showTopMenu = false
                                    appsManager.uninstallApp(context, app.packageName)
                                }
                            )
                        }
                    }
                }
            }
        }

        // Header Section (Icon, Title, Dev, Category, Install Button)
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 12.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.Top,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    // Custom App Icon / Live Logo
                    com.avanyx.store.ui.components.AppIconView(
                        app = app,
                        size = 88.dp,
                        cornerRadius = 22.dp,
                        fontSize = 28.sp
                    )

                    Spacer(modifier = Modifier.width(20.dp))

                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = app.name,
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 22.sp
                            ),
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.clickable {
                                if (onDeveloperClick != null) {
                                    val devIdentifier = if (app.developerUid.isNotBlank()) app.developerUid else app.developer
                                    onDeveloperClick(devIdentifier)
                                } else {
                                    onShowMessage("Developer: ${app.developer}")
                                }
                            }
                        ) {
                            Text(
                                text = app.developer,
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.Bold
                                )
                            )
                            Icon(
                                imageVector = Icons.Default.Info,
                                contentDescription = "View Company Page",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(16.dp).padding(start = 4.dp)
                            )
                        }
                        Text(
                            text = app.category,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Stats row (Rating, Size, Version)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                        .padding(vertical = 12.dp, horizontal = 16.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = app.rating.toString(),
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onBackground
                            )
                            Spacer(modifier = Modifier.width(2.dp))
                            Icon(
                                imageVector = Icons.Default.Star,
                                contentDescription = "Rating",
                                tint = Color(0xFFFFB300),
                                modifier = Modifier.size(16.dp)
                            )
                        }
                        Text(
                            text = "Rating",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Box(
                        modifier = Modifier
                            .width(1.dp)
                            .height(32.dp)
                            .background(MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                    )

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = app.size,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        Text(
                            text = "Size",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Box(
                        modifier = Modifier
                            .width(1.dp)
                            .height(32.dp)
                            .background(MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                    )

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = app.version,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        Text(
                            text = "Version",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Primary Interactive Install & Download System
                when (downloadInfo?.status) {
                    DownloadStatus.DOWNLOADING -> {
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            LinearProgressIndicator(
                                progress = { downloadInfo.progress },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(8.dp)
                                    .clip(RoundedCornerShape(4.dp)),
                                color = Color(0xFF10B981),
                                trackColor = MaterialTheme.colorScheme.surfaceVariant
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Downloading... ${(downloadInfo.progress * 100).toInt()}% (${String.format("%.1f", downloadInfo.speedKbps)} KB/s)",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color(0xFF10B981),
                                    fontWeight = FontWeight.Bold
                                )
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    OutlinedButton(
                                        onClick = { downloadEngine.pauseDownload(app.id) },
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                                    ) {
                                        Text("Pause", fontSize = 12.sp)
                                    }
                                    OutlinedButton(
                                        onClick = { downloadEngine.cancelDownload(app.id) },
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                                    ) {
                                        Text("Cancel", fontSize = 12.sp, color = Color(0xFFDC2626))
                                    }
                                }
                            }
                        }
                    }
                    DownloadStatus.PAUSED -> {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Button(
                                onClick = { downloadEngine.startOrResumeDownload(app.id, app.name, app.downloadUrl, app.checksumSha256) },
                                modifier = Modifier.weight(1f).height(48.dp),
                                shape = RoundedCornerShape(100.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                            ) {
                                Text("Resume Download", fontWeight = FontWeight.Bold, color = Color.White)
                            }
                            OutlinedButton(
                                onClick = { downloadEngine.cancelDownload(app.id) },
                                modifier = Modifier.height(48.dp),
                                shape = RoundedCornerShape(100.dp)
                            ) {
                                Text("Cancel", color = Color(0xFFDC2626))
                            }
                        }
                    }
                    DownloadStatus.VERIFYING -> {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                            LinearProgressIndicator(
                                modifier = Modifier.fillMaxWidth().height(6.dp),
                                color = Color(0xFF10B981)
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Verifying APK SHA-256 Checksum...",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFF10B981),
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                    DownloadStatus.INSTALLING -> {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                            LinearProgressIndicator(
                                modifier = Modifier.fillMaxWidth().height(6.dp),
                                color = Color(0xFF10B981)
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Installing Application...",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFF10B981),
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                    DownloadStatus.COMPLETED -> {
                        // OPEN -> Purple
                        Button(
                            onClick = {
                                val launched = appsManager.launchApp(context, app.packageName)
                                if (!launched) {
                                    onShowMessage("Launching ${app.name}...")
                                }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp)
                                .testTag("open_button"),
                            shape = RoundedCornerShape(100.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF7C3AED),
                                contentColor = Color.White
                            )
                        ) {
                            Text(
                                text = "OPEN",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 16.sp
                                )
                            )
                        }
                    }
                    DownloadStatus.FAILED -> {
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "Download Failed: ${downloadInfo.errorMessage ?: "Unknown error"}",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFFDC2626),
                                fontWeight = FontWeight.SemiBold
                            )
                            Button(
                                onClick = { downloadEngine.retryDownload(app.id, app.name, app.downloadUrl, app.checksumSha256) },
                                modifier = Modifier.fillMaxWidth().height(48.dp),
                                shape = RoundedCornerShape(100.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626))
                            ) {
                                Text("Retry Download", fontWeight = FontWeight.Bold, color = Color.White)
                            }
                        }
                    }
                    else -> {
                        val isInstalled = installedApp != null
                        val isUpdateAvailable = isInstalled && app.versionCode > (installedApp?.versionCode ?: 0)

                        if (isUpdateAvailable) {
                            // UPDATE -> Blue (Color(0xFF2563EB))
                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Button(
                                    onClick = {
                                        downloadEngine.startOrResumeDownload(
                                            appId = app.id,
                                            appName = app.name,
                                            downloadUrl = app.downloadUrl,
                                            expectedChecksum = app.checksumSha256
                                        )
                                        onShowMessage("Updating ${app.name} to v${app.version}...")
                                    },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(52.dp)
                                        .testTag("update_button"),
                                    shape = RoundedCornerShape(100.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFF2563EB),
                                        contentColor = Color.White
                                    )
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.ArrowUpward,
                                        contentDescription = null,
                                        modifier = Modifier.size(18.dp).padding(end = 4.dp)
                                    )
                                    Text(
                                        text = "UPDATE (${app.size})",
                                        style = MaterialTheme.typography.titleMedium.copy(
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 16.sp
                                        )
                                    )
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Button(
                                        onClick = {
                                            appsManager.launchApp(context, app.packageName)
                                        },
                                        modifier = Modifier.weight(1f).height(44.dp),
                                        shape = RoundedCornerShape(100.dp),
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = Color(0xFF7C3AED),
                                            contentColor = Color.White
                                        )
                                    ) {
                                        Text("OPEN", fontWeight = FontWeight.Bold)
                                    }

                                    Button(
                                        onClick = {
                                            appsManager.uninstallApp(context, app.packageName)
                                        },
                                        modifier = Modifier.height(44.dp),
                                        shape = RoundedCornerShape(100.dp),
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = Color(0xFFDC2626),
                                            contentColor = Color.White
                                        )
                                    ) {
                                        Text("UNINSTALL", fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        } else if (isInstalled) {
                            // OPEN -> Purple, UNINSTALL -> Red
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Button(
                                    onClick = {
                                        val launched = appsManager.launchApp(context, app.packageName)
                                        if (!launched) {
                                            onShowMessage("${app.name} is installed.")
                                        }
                                    },
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(52.dp)
                                        .testTag("open_button"),
                                    shape = RoundedCornerShape(100.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFF7C3AED),
                                        contentColor = Color.White
                                    )
                                ) {
                                    Text(
                                        text = "OPEN",
                                        style = MaterialTheme.typography.titleMedium.copy(
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 16.sp
                                        )
                                    )
                                }

                                Button(
                                    onClick = {
                                        appsManager.uninstallApp(context, app.packageName)
                                        onShowMessage("Opening uninstaller for ${app.name}...")
                                    },
                                    modifier = Modifier
                                        .height(52.dp)
                                        .testTag("uninstall_button"),
                                    shape = RoundedCornerShape(100.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFFDC2626),
                                        contentColor = Color.White
                                    )
                                ) {
                                    Icon(Icons.Default.Delete, contentDescription = "Uninstall", modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("UNINSTALL", fontWeight = FontWeight.Bold)
                                }
                            }
                        } else {
                            // GET (not installed) -> Green (Color(0xFF10B981))
                            Button(
                                onClick = {
                                    downloadEngine.startOrResumeDownload(
                                        appId = app.id,
                                        appName = app.name,
                                        downloadUrl = app.downloadUrl,
                                        expectedChecksum = app.checksumSha256
                                    )
                                    onShowMessage("Starting download for ${app.name}...")
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(52.dp)
                                    .testTag("install_button"),
                                shape = RoundedCornerShape(100.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color(0xFF10B981),
                                    contentColor = Color.White
                                )
                            ) {
                                Text(
                                    text = "GET (${app.size})",
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 16.sp
                                    )
                                )
                            }
                        }
                    }
                }
            }
        }

        // Screenshots Section
        if (app.screenshots.isNotEmpty()) {
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp)
                ) {
                    Text(
                        text = "Screenshots",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onBackground,
                        modifier = Modifier.padding(start = 20.dp, end = 20.dp, bottom = 12.dp)
                    )

                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 20.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(app.screenshots) { screenshotUrl ->
                            AsyncImage(
                                model = screenshotUrl,
                                contentDescription = "${app.name} screenshot",
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .size(width = 160.dp, height = 280.dp)
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(MaterialTheme.colorScheme.surfaceVariant)
                            )
                        }
                    }
                }
            }
        }

        // About / Description Section
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 12.dp)
            ) {
                Text(
                    text = "About this app",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                Text(
                    text = app.fullDescription,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    lineHeight = 22.sp
                )
            }
        }

        // Features List Section
        if (app.features.isNotEmpty()) {
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 12.dp)
                ) {
                    Text(
                        text = "Key Features",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onBackground,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    app.features.forEach { feature ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .clip(RoundedCornerShape(100.dp))
                                    .background(MaterialTheme.colorScheme.primary)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Text(
                                text = feature,
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }

        // What's New Section
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 12.dp)
            ) {
                Text(
                    text = "What's new",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onBackground,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                Text(
                    text = if (app.changelog.isNotBlank()) app.changelog else "Initial release on AVANYX Store! Standard stability improvements, fast downloads, and full support for dynamic Material Design 3.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // Ratings & Reviews Section
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
                        text = "Ratings & Reviews",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    TextButton(onClick = { showReviewDialog = true }) {
                        Text("Write a review")
                    }
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(vertical = 8.dp)
                ) {
                    Text(
                        text = String.format(java.util.Locale.US, "%.1f", app.rating),
                        style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Row {
                            for (i in 1..5) {
                                Icon(
                                    imageVector = Icons.Default.Star,
                                    contentDescription = null,
                                    tint = if (i <= app.rating.toInt()) Color(0xFFFFB800) else MaterialTheme.colorScheme.outlineVariant,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "${reviews.size} verified review${if (reviews.size == 1) "" else "s"}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                if (reviews.isEmpty()) {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp)
                    ) {
                        Text(
                            text = "No reviews yet. Be the first to share your feedback!",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        reviews.take(5).forEach { r ->
                            Card(
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                                ),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(12.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = r.userName,
                                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Row {
                                            for (s in 1..5) {
                                                Icon(
                                                    imageVector = Icons.Default.Star,
                                                    contentDescription = null,
                                                    tint = if (s <= r.rating.toInt()) Color(0xFFFFB800) else MaterialTheme.colorScheme.outlineVariant,
                                                    modifier = Modifier.size(14.dp)
                                                )
                                            }
                                        }
                                    }
                                    if (r.comment.isNotBlank()) {
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Text(
                                            text = r.comment,
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Dividers & Security Policies / Metadata Section
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 16.dp)
            ) {
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
                Spacer(modifier = Modifier.height(16.dp))

                // Privacy Policy Placeholder
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onShowMessage("Secure Sandbox privacy verification is enabled.") }
                        .padding(vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.PrivacyTip,
                        contentDescription = "Privacy Policy",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text(
                            text = "Privacy Policy",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        Text(
                            text = "Review developer's strict privacy policy",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // Data Safety Placeholder
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onShowMessage("This app compiles with standard AVANYX encryption.") }
                        .padding(vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = "Data Safety",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text(
                            text = "Data Safety",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        Text(
                            text = "No personal data is collected or shared",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }

    if (showReviewDialog) {
        AlertDialog(
            onDismissRequest = { showReviewDialog = false },
            title = { Text("Rate & Review", fontWeight = FontWeight.Bold) },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "How was your experience with ${app.name}?",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center
                    ) {
                        for (i in 1..5) {
                            IconButton(onClick = { reviewRating = i }) {
                                Icon(
                                    imageVector = Icons.Default.Star,
                                    contentDescription = "$i Stars",
                                    tint = if (i <= reviewRating) Color(0xFFFFB800) else MaterialTheme.colorScheme.outlineVariant,
                                    modifier = Modifier.size(32.dp)
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = reviewComment,
                        onValueChange = { reviewComment = it },
                        placeholder = { Text("Write your feedback (optional)...") },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 4
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (!isSubmittingReview) {
                            isSubmittingReview = true
                            coroutineScope.launch {
                                try {
                                    val currentUser = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser
                                    val uid = currentUser?.uid ?: "guest_user"
                                    val authorName = currentUser?.displayName?.takeIf { it.isNotBlank() } ?: "Verified User"
                                    val revId = java.util.UUID.randomUUID().toString()
                                    val newReview = com.avanyx.store.data.database.entity.AppReviewEntity(
                                        id = revId,
                                        appId = appId,
                                        userName = authorName,
                                        rating = reviewRating.toFloat(),
                                        comment = reviewComment.trim(),
                                        date = "Just now",
                                        createdTimestamp = System.currentTimeMillis()
                                    )
                                    repository.submitReview(newReview)
                                    val db = com.avanyx.store.data.database.AppDatabase.getInstance(context)
                                    val fRepo = com.avanyx.store.data.repository.FirestoreRepository(appDatabase = db)
                                    fRepo.submitReview(newReview, uid)
                                    onShowMessage("Review submitted successfully!")
                                    showReviewDialog = false
                                    reviewComment = ""
                                } catch (e: Exception) {
                                    onShowMessage("Error submitting review: ${e.message}")
                                } finally {
                                    isSubmittingReview = false
                                }
                            }
                        }
                    },
                    enabled = !isSubmittingReview
                ) {
                    Text(if (isSubmittingReview) "Submitting..." else "Submit")
                }
            },
            dismissButton = {
                TextButton(onClick = { showReviewDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // SHARE APP BOTTOM SHEET
    if (showShareSheet) {
        val appShareUrl = "https://store-avanyx.pages.dev/app?id=${app.id}"
        val devKey = app.developerUid.ifBlank { app.developer }
        val devShareUrl = "https://store-avanyx.pages.dev/developer?id=$devKey"
        val orgName = liveDeveloperProfile?.organizationName?.takeIf { it.isNotBlank() }
            ?: liveDeveloperProfile?.displayName?.takeIf { it.isNotBlank() }
            ?: app.developer.ifBlank { "AVANYX" }

        ModalBottomSheet(
            onDismissRequest = { showShareSheet = false },
            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
            containerColor = MaterialTheme.colorScheme.surface,
            dragHandle = { BottomSheetDefaults.DragHandle() },
            modifier = Modifier.testTag("app_share_bottom_sheet")
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp)
                    .padding(bottom = 36.dp)
            ) {
                Text(
                    text = "Share Application",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "Share verified app from official AVANYX Store",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(18.dp))

                // App Info Preview Card
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
                        com.avanyx.store.ui.components.AppIconView(
                            app = app,
                            size = 52.dp,
                            cornerRadius = 14.dp,
                            fontSize = 18.sp
                        )

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
                                text = "${app.developer} • ${app.category}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // ORGANIZATION DETAILS CARD (Tap to view developer profile)
                Text(
                    text = "Organization & Developer Details",
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.primary
                )

                Spacer(modifier = Modifier.height(6.dp))

                Card(
                    onClick = {
                        showShareSheet = false
                        if (onDeveloperClick != null) {
                            val targetDev = if (app.developerUid.isNotBlank()) app.developerUid else app.developer
                            onDeveloperClick(targetDev)
                        } else {
                            onShowMessage("Developer: $orgName")
                        }
                    },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f)
                    ),
                    border = BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.4f)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("app_share_sheet_organization_card")
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

                // Official Link Preview
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
                            text = appShareUrl,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f)
                        )
                        IconButton(
                            onClick = {
                                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                                val clip = android.content.ClipData.newPlainText("AVANYX App Link", appShareUrl)
                                clipboard.setPrimaryClip(clip)
                                onShowMessage("Official app link copied!")
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
                                val text = "Check out ${app.name} on AVANYX Store!\n" +
                                        "App Link: $appShareUrl\n" +
                                        "Developer Profile: $devShareUrl\n" +
                                        "Official Website: https://store-avanyx.pages.dev"
                                putExtra(Intent.EXTRA_TEXT, text)
                            }
                            context.startActivity(Intent.createChooser(shareIntent, "Share App"))
                            showShareSheet = false
                        },
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .testTag("app_share_sheet_share_btn")
                    ) {
                        Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Share App", fontWeight = FontWeight.Bold)
                    }

                    OutlinedButton(
                        onClick = {
                            val webUrl = liveDeveloperProfile?.officialWebsite?.takeIf { it.isNotBlank() }
                                ?: "https://store-avanyx.pages.dev/app?id=${app.id}"
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
