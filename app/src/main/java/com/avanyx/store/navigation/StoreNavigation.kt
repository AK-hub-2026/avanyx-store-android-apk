package com.avanyx.store.navigation

import androidx.compose.animation.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.avanyx.store.data.repository.AppRepository
import com.avanyx.store.data.model.DownloadStatus
import com.avanyx.store.download.DownloadManagerEngine
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.avanyx.store.ui.components.StoreBottomBar
import com.avanyx.store.ui.screens.AppDetailsScreen
import com.avanyx.store.ui.screens.AppsScreen
import com.avanyx.store.ui.screens.DeveloperProfileScreen
import com.avanyx.store.ui.screens.GamesScreen
import com.avanyx.store.ui.screens.HomeScreen
import com.avanyx.store.ui.screens.MyAppsScreen
import com.avanyx.store.ui.screens.ProfileScreen
import com.avanyx.store.ui.screens.SearchScreen
import com.avanyx.store.utils.Constants
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

import com.avanyx.store.ui.screens.auth.ForgotPasswordScreen
import com.avanyx.store.ui.screens.auth.LoginScreen
import com.avanyx.store.ui.screens.auth.PhoneOtpScreen
import com.avanyx.store.ui.screens.auth.RegisterScreen
import com.avanyx.store.ui.screens.onboarding.IntroScreen
import com.avanyx.store.ui.screens.splash.SplashScreen
import androidx.lifecycle.viewmodel.compose.viewModel
import com.avanyx.store.ui.viewmodel.AuthViewModel

// Route constants for secondary screens
private const val ROUTE_SETTINGS = "settings"
private const val ROUTE_DOWNLOADS = "downloads"
private const val ROUTE_MY_APPS = "my_apps"
private const val ROUTE_WISHLIST = "wishlist"
private const val ROUTE_NOTIFICATIONS = "notifications"
private const val ROUTE_ABOUT = "about"
private const val ROUTE_CATEGORIES = "categories"

@Composable
fun StoreNavigation(
    repository: AppRepository,
    modifier: Modifier = Modifier,
    navController: NavHostController = rememberNavController(),
    authViewModel: AuthViewModel = viewModel()
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val snackbarHostState = remember { SnackbarHostState() }
    val coroutineScope = rememberCoroutineScope()

    val showSnackbar: (String) -> Unit = { message ->
        coroutineScope.launch {
            snackbarHostState.currentSnackbarData?.dismiss()
            snackbarHostState.showSnackbar(message)
        }
    }

    // Bottom navigation is active only on primary store landing modules
    val shouldShowBottomBar = when (currentRoute) {
        Constants.ROUTE_HOME -> true
        Constants.ROUTE_GAMES -> true
        Constants.ROUTE_APPS -> true
        Constants.ROUTE_SEARCH -> true
        else -> false
    }

    Scaffold(
        modifier = modifier.fillMaxSize().testTag("store_scaffold"),
        snackbarHost = { SnackbarHost(hostState = snackbarHostState, modifier = Modifier.testTag("store_snackbar")) },
        bottomBar = {
            if (shouldShowBottomBar) {
                StoreBottomBar(
                    currentRoute = currentRoute,
                    onNavigate = { route ->
                        navController.navigate(route) {
                            popUpTo(Constants.ROUTE_HOME) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                )
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Constants.ROUTE_SPLASH,
            modifier = Modifier.padding(innerPadding)
        ) {
            // ==========================================
            // AUTHENTICATION & ONBOARDING FLOW (PHASE 2 & 3)
            // ==========================================

            composable(Constants.ROUTE_SPLASH) {
                SplashScreen(
                    onNavigateToHome = {
                        navController.navigate(Constants.ROUTE_HOME) {
                            popUpTo(Constants.ROUTE_SPLASH) { inclusive = true }
                        }
                    },
                    onNavigateToIntro = {
                        navController.navigate(Constants.ROUTE_INTRO) {
                            popUpTo(Constants.ROUTE_SPLASH) { inclusive = true }
                        }
                    },
                    onNavigateToLogin = {
                        navController.navigate(Constants.ROUTE_LOGIN) {
                            popUpTo(Constants.ROUTE_SPLASH) { inclusive = true }
                        }
                    }
                )
            }

            composable(Constants.ROUTE_INTRO) {
                IntroScreen(
                    onFinishOnboarding = {
                        navController.navigate(Constants.ROUTE_LOGIN) {
                            popUpTo(Constants.ROUTE_INTRO) { inclusive = true }
                        }
                    }
                )
            }

            composable(Constants.ROUTE_LOGIN) {
                LoginScreen(
                    authViewModel = authViewModel,
                    onNavigateToHome = {
                        navController.navigate(Constants.ROUTE_HOME) {
                            popUpTo(Constants.ROUTE_LOGIN) { inclusive = true }
                        }
                    },
                    onNavigateToRegister = {
                        navController.navigate(Constants.ROUTE_REGISTER)
                    },
                    onNavigateToForgotPassword = {
                        navController.navigate(Constants.ROUTE_FORGOT_PASSWORD)
                    },
                    onNavigateToPhoneOtp = {
                        navController.navigate(Constants.ROUTE_PHONE_OTP)
                    },
                    onShowMessage = showSnackbar
                )
            }

            composable(Constants.ROUTE_REGISTER) {
                RegisterScreen(
                    authViewModel = authViewModel,
                    onNavigateToHome = {
                        navController.navigate(Constants.ROUTE_HOME) {
                            popUpTo(Constants.ROUTE_LOGIN) { inclusive = true }
                        }
                    },
                    onNavigateToLogin = {
                        navController.popBackStack()
                    },
                    onShowMessage = showSnackbar
                )
            }

            composable(Constants.ROUTE_FORGOT_PASSWORD) {
                ForgotPasswordScreen(
                    authViewModel = authViewModel,
                    onBackToLogin = { navController.popBackStack() },
                    onShowMessage = showSnackbar
                )
            }

            composable(Constants.ROUTE_PHONE_OTP) {
                PhoneOtpScreen(
                    authViewModel = authViewModel,
                    onNavigateToHome = {
                        navController.navigate(Constants.ROUTE_HOME) {
                            popUpTo(Constants.ROUTE_LOGIN) { inclusive = true }
                        }
                    },
                    onBackToLogin = { navController.popBackStack() },
                    onShowMessage = showSnackbar
                )
            }

            // ==========================================
            // SECONDARY STORE SCREENS
            // ==========================================

            composable(ROUTE_SETTINGS) {
                SettingsScreen(
                    onBack = { navController.popBackStack() },
                    onShowMessage = showSnackbar
                )
            }

            composable(ROUTE_DOWNLOADS) {
                DownloadsScreen(
                    onBack = { navController.popBackStack() },
                    onShowMessage = showSnackbar
                )
            }

            composable(ROUTE_MY_APPS) {
                MyAppsScreen(
                    onBack = { navController.popBackStack() },
                    onShowMessage = showSnackbar,
                    repository = repository,
                    onNavigateToDetails = { appId ->
                        navController.navigate("app_details/$appId")
                    }
                )
            }

            composable(ROUTE_WISHLIST) {
                WishlistScreen(
                    onBack = { navController.popBackStack() },
                    onShowMessage = showSnackbar
                )
            }

            composable(ROUTE_NOTIFICATIONS) {
                NotificationsScreen(
                    onBack = { navController.popBackStack() }
                )
            }

            composable(ROUTE_ABOUT) {
                AboutScreen(
                    onBack = { navController.popBackStack() }
                )
            }

            composable(ROUTE_CATEGORIES) {
                CategoriesScreen(
                    onBack = { navController.popBackStack() },
                    onCategoryClick = { category ->
                        showSnackbar("Selected Category: $category")
                        navController.popBackStack()
                    }
                )
            }

            // ==========================================
            // PRIMARY STORE CHANNELS
            // ==========================================

            composable(Constants.ROUTE_HOME) {
                HomeScreen(
                    repository = repository,
                    onNavigateToDetails = { appId ->
                        navController.navigate("app_details/$appId")
                    },
                    onNavigateToSearch = {
                        navController.navigate(Constants.ROUTE_SEARCH)
                    },
                    onNavigateToProfile = {
                        navController.navigate(Constants.ROUTE_PROFILE)
                    },
                    onShowMessage = showSnackbar,
                    onNavigateToDeveloper = { devName ->
                        navController.navigate("developer_profile/$devName")
                    },
                    onNavigateToNotifications = {
                        navController.navigate(ROUTE_NOTIFICATIONS)
                    }
                )
            }

            composable(Constants.ROUTE_GAMES) {
                GamesScreen(
                    repository = repository,
                    onNavigateToDetails = { appId ->
                        navController.navigate("app_details/$appId")
                    },
                    onShowMessage = showSnackbar,
                    onNavigateToDeveloper = { devName ->
                        navController.navigate("developer_profile/$devName")
                    },
                    onNavigateToNotifications = {
                        navController.navigate(ROUTE_NOTIFICATIONS)
                    }
                )
            }

            composable(Constants.ROUTE_APPS) {
                AppsScreen(
                    repository = repository,
                    onNavigateToDetails = { appId ->
                        navController.navigate("app_details/$appId")
                    },
                    onShowMessage = showSnackbar,
                    onNavigateToDeveloper = { devName ->
                        navController.navigate("developer_profile/$devName")
                    },
                    onNavigateToNotifications = {
                        navController.navigate(ROUTE_NOTIFICATIONS)
                    }
                )
            }

            composable(Constants.ROUTE_SEARCH) {
                SearchScreen(
                    repository = repository,
                    onNavigateToDetails = { appId ->
                        navController.navigate("app_details/$appId")
                    },
                    onNavigateToDeveloper = { devId ->
                        navController.navigate("developer_profile/$devId")
                    },
                    onShowMessage = showSnackbar
                )
            }

            composable(
                route = Constants.ROUTE_APP_DETAILS,
                arguments = listOf(navArgument("appId") { type = NavType.StringType })
            ) { backStackEntry ->
                val appId = backStackEntry.arguments?.getString("appId") ?: ""
                AppDetailsScreen(
                    appId = appId,
                    repository = repository,
                    onBack = { navController.popBackStack() },
                    onShowMessage = showSnackbar,
                    onDeveloperClick = { devName ->
                        val devId = devName.lowercase().replace(" ", "_")
                        navController.navigate("developer_profile/$devId")
                    }
                )
            }

            composable(
                route = Constants.ROUTE_DEVELOPER_PROFILE,
                arguments = listOf(navArgument("developerId") { type = NavType.StringType })
            ) { backStackEntry ->
                val devId = backStackEntry.arguments?.getString("developerId") ?: "avanyx"
                DeveloperProfileScreen(
                    developerId = devId,
                    repository = repository,
                    onBack = { navController.popBackStack() },
                    onAppClick = { appId ->
                        navController.navigate("app_details/$appId")
                    },
                    onShowMessage = showSnackbar
                )
            }

            composable(Constants.ROUTE_PROFILE) {
                ProfileScreen(
                    authViewModel = authViewModel,
                    onBack = { navController.popBackStack() },
                    onShowMessage = showSnackbar,
                    onNavigateToLogin = {
                        navController.navigate(Constants.ROUTE_LOGIN) {
                            popUpTo(Constants.ROUTE_HOME) { inclusive = true }
                        }
                    },
                    onNavigateToSettings = {
                        navController.navigate(ROUTE_SETTINGS)
                    },
                    onNavigateToDownloads = {
                        navController.navigate(ROUTE_DOWNLOADS)
                    },
                    onNavigateToMyApps = {
                        navController.navigate(ROUTE_MY_APPS)
                    },
                    onNavigateToWishlist = {
                        navController.navigate(ROUTE_WISHLIST)
                    }
                )
            }
        }
    }
}

// ==========================================================
// COMPOSABLE VISUAL PLACEHOLDERS FOR FUTURE PHASES
// ==========================================================



@Composable
private fun OnboardingScreen(
    onFinished: () -> Unit,
    modifier: Modifier = Modifier
) {
    var stepIndex by remember { mutableStateOf(0) }
    val steps = listOf(
        OnboardingStep(
            title = "Next-Gen Discovery",
            description = "Explore high-performance, sandboxed applications and games custom-styled for modern Android devices.",
            icon = Icons.Default.Apps
        ),
        OnboardingStep(
            title = "AVANYX Protect Security",
            description = "Every APK undergoes strict signature validation, checksum verification, and threat analysis in our secure engine.",
            icon = Icons.Default.Security
        ),
        OnboardingStep(
            title = "Developer Freedom",
            description = "We offer a zero-monetization-fee distribution platform with advanced diagnostic sandboxing and instant updates.",
            icon = Icons.Default.Code
        )
    )

    val currentStep = steps[stepIndex]

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End
        ) {
            TextButton(onClick = onFinished) {
                Text(text = "Skip", color = MaterialTheme.colorScheme.primary)
            }
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(110.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = currentStep.icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onPrimaryContainer,
                    modifier = Modifier.size(54.dp)
                )
            }
            Spacer(modifier = Modifier.height(32.dp))
            Text(
                text = currentStep.title,
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold),
                color = MaterialTheme.colorScheme.onBackground,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = currentStep.description,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp)
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(bottom = 32.dp)
            ) {
                steps.forEachIndexed { index, _ ->
                    Box(
                        modifier = Modifier
                            .size(if (index == stepIndex) 16.dp else 8.dp, 8.dp)
                            .clip(CircleShape)
                            .background(
                                if (index == stepIndex) MaterialTheme.colorScheme.primary
                                else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f)
                            )
                    )
                }
            }

            Button(
                onClick = {
                    if (stepIndex < steps.size - 1) {
                        stepIndex++
                    } else {
                        onFinished()
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(14.dp)
            ) {
                Text(
                    text = if (stepIndex == steps.size - 1) "Get Started" else "Next",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = null
                )
            }
        }
    }
}

private data class OnboardingStep(
    val title: String,
    val description: String,
    val icon: ImageVector
)

@Composable
private fun SettingsScreen(
    onBack: () -> Unit,
    onShowMessage: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var autoUpdatesEnabled by remember { mutableStateOf(true) }
    var wifiOnlyEnabled by remember { mutableStateOf(false) }
    var protectDailyEnabled by remember { mutableStateOf(true) }
    var developerSandboxMode by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back"
                )
            }
            Text(
                text = "Settings",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                modifier = Modifier.padding(start = 8.dp)
            )
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Network Preferences",
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.primary
            )

            SettingsToggleRow(
                title = "Auto-Update Apps",
                subtitle = "Keep applications up-to-date automatically",
                checked = autoUpdatesEnabled,
                onCheckedChange = { autoUpdatesEnabled = it }
            )

            SettingsToggleRow(
                title = "Download over Wi-Fi Only",
                subtitle = "Restricts downloads on cellular data networks",
                checked = wifiOnlyEnabled,
                onCheckedChange = { wifiOnlyEnabled = it }
            )

            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))

            Text(
                text = "AVANYX Protect Settings",
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.primary
            )

            SettingsToggleRow(
                title = "Daily Security Scans",
                subtitle = "Validate signatures and check risk scores locally",
                checked = protectDailyEnabled,
                onCheckedChange = { protectDailyEnabled = it }
            )

            SettingsToggleRow(
                title = "Developer Sandbox Mode",
                subtitle = "Enables verification logs and custom manifest uploads",
                checked = developerSandboxMode,
                onCheckedChange = {
                    developerSandboxMode = it
                    onShowMessage(if (it) "Sandbox mode activated." else "Sandbox mode deactivated.")
                }
            )

            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))

            Text(
                text = "Local Storage",
                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.primary
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onShowMessage("Cache cleared successfully (0B freed).") }
                    .padding(vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Clear Cached Catalog",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    Text(
                        text = "Free up memory used by preview images and catalog lists",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Text(
                    text = "14.2 MB",
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

@Composable
private fun SettingsToggleRow(
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Spacer(modifier = Modifier.width(16.dp))
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange
        )
    }
}

@Composable
private fun DownloadsScreen(
    onBack: () -> Unit,
    onShowMessage: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val downloadEngine = remember(context) { DownloadManagerEngine.getInstance(context) }
    val downloadsMap by downloadEngine.downloadsMap.collectAsStateWithLifecycle()

    val activeList = remember(downloadsMap) {
        downloadsMap.values.filter {
            it.status == DownloadStatus.DOWNLOADING ||
                    it.status == DownloadStatus.PAUSED ||
                    it.status == DownloadStatus.PENDING ||
                    it.status == DownloadStatus.WAITING ||
                    it.status == DownloadStatus.RETRYING ||
                    it.status == DownloadStatus.VERIFYING ||
                    it.status == DownloadStatus.INSTALLING
        }
    }

    val completedList = remember(downloadsMap) {
        downloadsMap.values.filter { it.status == DownloadStatus.COMPLETED }
    }

    val failedList = remember(downloadsMap) {
        downloadsMap.values.filter { it.status == DownloadStatus.FAILED }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back"
                )
            }
            Text(
                text = "Downloads & Installs",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                modifier = Modifier.padding(start = 8.dp)
            )
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Text(
                    text = "Active Downloads (${activeList.size})",
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.primary
                )
            }

            if (activeList.isEmpty()) {
                item {
                    Text(
                        text = "No active downloads currently running.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                items(activeList, key = { it.appId }) { item ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = item.appName,
                                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                                    )
                                    Text(
                                        text = when (item.status) {
                                            DownloadStatus.PAUSED -> "Paused"
                                            DownloadStatus.VERIFYING -> "Verifying SHA-256..."
                                            DownloadStatus.INSTALLING -> "Installing Package..."
                                            else -> "Downloading... ${String.format("%.1f", item.speedKbps)} KB/s"
                                        },
                                        style = MaterialTheme.typography.bodySmall,
                                        color = if (item.status == DownloadStatus.PAUSED) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                                    )
                                }
                                Row {
                                    if (item.status == DownloadStatus.DOWNLOADING) {
                                        IconButton(onClick = {
                                            downloadEngine.pauseDownload(item.appId)
                                            onShowMessage("Download paused")
                                        }) {
                                            Icon(imageVector = Icons.Default.Pause, contentDescription = "Pause")
                                        }
                                    } else if (item.status == DownloadStatus.PAUSED) {
                                        IconButton(onClick = {
                                            downloadEngine.startOrResumeDownload(item.appId, item.appName, "")
                                            onShowMessage("Download resumed")
                                        }) {
                                            Icon(imageVector = Icons.Default.PlayArrow, contentDescription = "Resume")
                                        }
                                    }
                                    IconButton(onClick = {
                                        downloadEngine.cancelDownload(item.appId)
                                        onShowMessage("Download canceled")
                                    }) {
                                        Icon(imageVector = Icons.Default.Close, contentDescription = "Cancel", tint = MaterialTheme.colorScheme.error)
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            LinearProgressIndicator(
                                progress = { item.progress },
                                color = MaterialTheme.colorScheme.primary,
                                trackColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(6.dp)
                                    .clip(CircleShape)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "${item.downloadedBytes / 1024 / 1024} MB",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "${(item.progress * 100).toInt()}%",
                                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }
                }
            }

            if (failedList.isNotEmpty()) {
                item {
                    Text(
                        text = "Failed Downloads (${failedList.size})",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.error
                    )
                }

                items(failedList, key = { it.appId }) { item ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = item.appName,
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                                )
                                Text(
                                    text = item.errorMessage ?: "Download failed",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onErrorContainer
                                )
                            }
                            Button(
                                onClick = { downloadEngine.retryDownload(item.appId, item.appName, "") },
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                            ) {
                                Text("Retry", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }

            item {
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
            }

            item {
                Text(
                    text = "Completed Queue (${completedList.size})",
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.primary
                )
            }

            if (completedList.isEmpty()) {
                item {
                    Text(
                        text = "No completed installations yet.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                items(completedList, key = { it.appId }) { item ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(MaterialTheme.colorScheme.secondaryContainer),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = "Completed",
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(16.dp))
                            Column {
                                Text(
                                    text = item.appName,
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                                )
                                Text(
                                    text = "Installed • Verified SHA-256",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                        IconButton(onClick = { onShowMessage("Launching ${item.appName}!") }) {
                            Icon(imageVector = Icons.Default.Apps, contentDescription = "Launch")
                        }
                    }
                }
            }
        }
    }
}

private data class CompletedDownloadItem(
    val name: String,
    val size: String,
    val packageName: String
)

@Composable
private fun WishlistScreen(
    onBack: () -> Unit,
    onShowMessage: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back"
                )
            }
            Text(
                text = "My Wishlist",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                modifier = Modifier.padding(start = 8.dp)
            )
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            val items = listOf(
                WishlistItemData("Pixel Quest", "Retro Action Platformer", "com.retroarcade.pixelquest"),
                WishlistItemData("Math Genius", "Education puzzles", "com.edtech.mathgenius")
            )

            items(items) { item ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(MaterialTheme.colorScheme.secondaryContainer),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Favorite,
                                contentDescription = "Wishlist",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                        Column {
                            Text(
                                text = item.name,
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                            )
                            Text(
                                text = item.category,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    IconButton(onClick = { onShowMessage("Removed ${item.name} from wishlist.") }) {
                        Icon(imageVector = Icons.Default.Delete, contentDescription = "Remove")
                    }
                }
            }
        }
    }
}

private data class WishlistItemData(
    val name: String,
    val category: String,
    val packageName: String
)

@Composable
private fun NotificationsScreen(
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back"
                )
            }
            Text(
                text = "Notifications & Alerts",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                modifier = Modifier.padding(start = 8.dp)
            )
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            val alerts = listOf(
                AlertItem("AVANYX Protect Secured", "Security sandbox scanned 4 installed APKs successfully. 0 threat vectors detected.", true),
                AlertItem("Update Available: Speed Limit 3D", "Optimize performance and play weekly time-trials with v2.1.0.", false),
                AlertItem("Welcome to Phase 2", "Experience our modern, localized marketplace architecture built for extreme agility.", false)
            )

            items(alerts) { alert ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (alert.isSecurity) MaterialTheme.colorScheme.surfaceVariant
                        else MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.5f)
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = if (alert.isSecurity) Icons.Default.Security else Icons.Default.Info,
                                contentDescription = null,
                                tint = if (alert.isSecurity) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondary,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = alert.title,
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onBackground
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = alert.message,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

private data class AlertItem(
    val title: String,
    val message: String,
    val isSecurity: Boolean
)

@Composable
private fun AboutScreen(
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back"
                )
            }
            Text(
                text = "About",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                modifier = Modifier.padding(start = 8.dp)
            )
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Large premium AVANYX Logo Canvas
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(RoundedCornerShape(18.dp))
                    .background(
                        Brush.linearGradient(
                            colors = listOf(
                                MaterialTheme.colorScheme.primary,
                                Color(0xFF9C27B0)
                            )
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Canvas(modifier = Modifier.size(40.dp)) {
                    val w = size.width
                    val h = size.height
                    val path = Path().apply {
                        moveTo(w * 0.5f, 0f)
                        lineTo(w, h)
                        lineTo(w * 0.75f, h)
                        lineTo(w * 0.5f, h * 0.4f)
                        lineTo(w * 0.25f, h)
                        lineTo(0f, h)
                        close()
                    }
                    drawPath(path = path, color = Color.White)
                    drawRect(
                        color = Color.White,
                        topLeft = Offset(w * 0.35f, h * 0.65f),
                        size = Size(w * 0.3f, h * 0.12f)
                    )
                }
            }

            Text(
                text = "AVANYX Store",
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold),
                color = MaterialTheme.colorScheme.onBackground
            )

            Text(
                text = "Version 1.0.0 (Phase 2)",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "AVANYX Store is a lightweight, responsive, secure marketplace environment custom-designed for modern Android sandboxes. Adhering strictly to Material Design 3 guidelines, it features a native VM data layer, secure signature checksum comparisons, and an elegant visual flow.",
                style = MaterialTheme.typography.bodyLarge,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onBackground
            )

            Spacer(modifier = Modifier.height(16.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "Technical Specifications",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Text("• UI Framework: Jetpack Compose with M3", style = MaterialTheme.typography.bodyMedium)
                    Text("• Architecture: MVVM with StateFlow flows", style = MaterialTheme.typography.bodyMedium)
                    Text("• Local Engine: AVANYX Protect Signature Verification", style = MaterialTheme.typography.bodyMedium)
                    Text("• Platform Compatibility: Android 12+ (SDK 31-36)", style = MaterialTheme.typography.bodyMedium)
                }
            }

            Text(
                text = "Copyright © 2026 AVANYX. All Rights Reserved.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
            )
        }
    }
}

@Composable
private fun CategoriesScreen(
    onBack: () -> Unit,
    onCategoryClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val categories = listOf(
        "Casual" to Icons.Default.Games,
        "Action" to Icons.Default.Warning,
        "Entertainment" to Icons.Default.PlayArrow,
        "Productivity" to Icons.Default.Description,
        "Tools" to Icons.Default.Settings,
        "Education" to Icons.Default.Info
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back"
                )
            }
            Text(
                text = "Categories",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                modifier = Modifier.padding(start = 8.dp)
            )
        }

        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(categories) { item ->
                Card(
                    onClick = { onCategoryClick(item.first) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(110.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = item.second,
                            contentDescription = item.first,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(32.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = item.first,
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onBackground
                        )
                    }
                }
            }
        }
    }
}
