package com.avanyx.store

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import com.avanyx.store.data.database.AppDatabase
import com.avanyx.store.data.repository.FirestoreRepository
import com.avanyx.store.data.repository.RoomAppRepository
import com.avanyx.store.download.DownloadManagerEngine
import com.avanyx.store.firebase.FirebaseInit
import com.avanyx.store.supabase.SupabaseManager
import com.avanyx.store.navigation.StoreNavigation
import com.avanyx.store.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {

    @Suppress("InvalidFragmentVersionForActivityResult")
    private val requestNotificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { _ ->
            // Permission result handled
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Supports full edge-to-edge transparent system bar bleed
        enableEdgeToEdge()

        FirebaseInit.initialize(applicationContext)
        SupabaseManager.initialize(applicationContext)
        scheduleSyncWork()

        checkNotificationPermission()
        DownloadManagerEngine.getInstance(applicationContext)
        
        val database = AppDatabase.getInstance(applicationContext)
        val appRepository = RoomAppRepository(database)
        val firestoreRepository = FirestoreRepository(appDatabase = database)

        // Start active realtime snapshot listener so any app published on Web updates Room DB instantly
        firestoreRepository.startRealtimeAppSync(lifecycleScope)

        // Perform smart installed apps detection and update matching in background
        lifecycleScope.launch {
            com.avanyx.store.manager.InstalledAppsManager.getInstance(applicationContext)
                .scanAndMatch(applicationContext)
        }

        setContent {
            MyApplicationTheme {
                StoreNavigation(
                    repository = appRepository,
                    modifier = Modifier.fillMaxSize()
                )
            }
        }
    }

    private fun scheduleSyncWork() {
        try {
            val constraints = androidx.work.Constraints.Builder()
                .setRequiredNetworkType(androidx.work.NetworkType.CONNECTED)
                .build()

            val syncRequest = androidx.work.PeriodicWorkRequestBuilder<com.avanyx.store.sync.SyncWorker>(
                1, java.util.concurrent.TimeUnit.HOURS
            ).setConstraints(constraints).build()

            androidx.work.WorkManager.getInstance(applicationContext).enqueueUniquePeriodicWork(
                "avanyx_firestore_sync",
                androidx.work.ExistingPeriodicWorkPolicy.KEEP,
                syncRequest
            )
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "Error scheduling WorkManager sync", e)
        }
    }

    private fun checkNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                requestNotificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }
}
