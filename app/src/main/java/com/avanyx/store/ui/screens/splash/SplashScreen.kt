package com.avanyx.store.ui.screens.splash

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.avanyx.store.R
import com.avanyx.store.data.database.AppDatabase
import com.avanyx.store.data.repository.FirestoreRepository
import com.avanyx.store.utils.SessionManager
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.delay
import kotlinx.coroutines.withTimeoutOrNull

@Composable
fun SplashScreen(
    onNavigateToHome: () -> Unit,
    onNavigateToIntro: () -> Unit,
    onNavigateToLogin: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scale = remember { Animatable(0.5f) }
    var syncStatusText by remember { mutableStateOf("Initializing store...") }
    var isSyncing by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        scale.animateTo(
            targetValue = 1f,
            animationSpec = spring(
                dampingRatio = Spring.DampingRatioMediumBouncy,
                stiffness = Spring.StiffnessLow
            )
        )

        // Trigger immediate on-launch Firestore sync before navigating to Home
        syncStatusText = "Syncing latest apps & catalog..."
        try {
            val db = AppDatabase.getInstance(context)
            val firestoreRepo = FirestoreRepository(appDatabase = db)
            
            // Sync with a maximum 3.5-second timeout so offline users are never blocked
            val syncResult = withTimeoutOrNull(3500) {
                firestoreRepo.syncAppsFromFirestore()
            }
            if (syncResult != null && syncResult.isSuccess) {
                android.util.Log.d("SplashScreen", "Startup sync completed: ${syncResult.getOrNull()} apps synced")
            } else {
                android.util.Log.d("SplashScreen", "Startup sync bypassed or timed out, relying on local offline cache")
            }
        } catch (e: Throwable) {
            android.util.Log.e("SplashScreen", "Startup sync error", e)
        }

        isSyncing = false
        delay(400)

        val sessionManager = SessionManager.getInstance(context)
        val firebaseUser = try {
            FirebaseAuth.getInstance().currentUser
        } catch (e: Throwable) {
            android.util.Log.e("SplashScreen", "FirebaseAuth check failed", e)
            null
        }

        try {
            when {
                firebaseUser != null -> {
                    sessionManager.isAuthenticated = true
                    onNavigateToHome()
                }
                !sessionManager.isOnboardingCompleted -> {
                    onNavigateToIntro()
                }
                else -> {
                    onNavigateToLogin()
                }
            }
        } catch (e: Throwable) {
            android.util.Log.e("SplashScreen", "Navigation decision error", e)
            onNavigateToHome()
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF0F172A),
                        Color(0xFF1E1B4B),
                        Color(0xFF090D16)
                    )
                )
            )
            .testTag("splash_screen"),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.scale(scale.value)
        ) {
            // AVANYX App Icon Logo
            Image(
                painter = painterResource(id = R.drawable.avanyx_logo),
                contentDescription = "AVANYX Logo",
                contentScale = ContentScale.Fit,
                modifier = Modifier
                    .size(110.dp)
                    .clip(RoundedCornerShape(26.dp))
            )

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "AVANYX STORE",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White,
                    letterSpacing = 2.sp
                ),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Next-Gen Android Marketplace",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = Color.White.copy(alpha = 0.6f)
                ),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Sync loading indicator
            AnimatedVisibility(
                visible = isSyncing,
                enter = fadeIn(),
                exit = fadeOut()
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.testTag("splash_sync_loader")
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = Color(0xFF6366F1),
                        strokeWidth = 2.5.dp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = syncStatusText,
                        style = MaterialTheme.typography.labelMedium.copy(
                            color = Color.White.copy(alpha = 0.7f),
                            letterSpacing = 0.5.sp
                        )
                    )
                }
            }
        }
    }
}
