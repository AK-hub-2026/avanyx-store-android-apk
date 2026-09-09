package com.avanyx.store.manager

import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import com.avanyx.store.data.database.AppDatabase
import com.avanyx.store.data.database.entity.AppUpdateEntity
import com.avanyx.store.data.database.entity.InstalledAppEntity
import com.avanyx.store.data.database.entity.StoreAppEntity
import com.avanyx.store.data.model.AppActionState
import com.avanyx.store.data.model.DownloadInfo
import com.avanyx.store.data.model.DownloadStatus
import com.avanyx.store.data.model.StoreApp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext

class InstalledAppsManager(
    private val database: AppDatabase
) {
    private val TAG = "InstalledAppsManager"

    /**
     * Exposes a real-time Flow of all scanned installed applications stored in Room.
     */
    val installedAppsFlow: Flow<List<InstalledAppEntity>> =
        database.installedAppDao().getInstalledApps()

    /**
     * Exposes a real-time Flow of available updates stored in Room.
     */
    val availableUpdatesFlow: Flow<List<AppUpdateEntity>> =
        database.appUpdateDao().getAvailableUpdates()

    /**
     * Phase 1 & Phase 2:
     * 1. Scans installed packages via PackageManager without requiring root, Shizuku, or accessibility.
     * 2. Persists scanned applications in the "installed_apps" Room SQLite table.
     * 3. Runs the Firestore/Room Matching Engine against "store_apps" to detect available updates.
     */
    suspend fun scanAndMatch(context: Context): ScanResult = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "=== Starting Installed Apps Scan & Firestore Matching Engine ===")
            val pm = context.packageManager
            val installedEntities = mutableListOf<InstalledAppEntity>()

            val packages = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                pm.getInstalledPackages(PackageManager.PackageInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                pm.getInstalledPackages(0)
            }

            for (pkg in packages) {
                val appInfo = pkg.applicationInfo ?: continue
                val pkgName = pkg.packageName ?: continue
                val appName = try {
                    pm.getApplicationLabel(appInfo).toString()
                } catch (e: Exception) {
                    pkgName
                }
                val versionName = pkg.versionName ?: "1.0.0"
                val versionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    pkg.longVersionCode
                } else {
                    @Suppress("DEPRECATION")
                    pkg.versionCode.toLong()
                }
                val isSystem = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0

                installedEntities.add(
                    InstalledAppEntity(
                        packageName = pkgName,
                        appName = appName,
                        version = versionName,
                        versionCode = versionCode,
                        isSystemApp = isSystem,
                        installedTimestamp = System.currentTimeMillis(),
                        updatedDate = System.currentTimeMillis()
                    )
                )
            }

            // Save to Room SQLite "installed_apps"
            database.installedAppDao().clearInstalledApps()
            database.installedAppDao().insertInstalledApps(installedEntities)
            Log.d(TAG, "Persisted ${installedEntities.size} installed apps to Room SQLite.")

            // Phase 2: Run Matching Engine against store_apps
            val updatesDetected = matchUpdatesInternal()
            Log.d(TAG, "Matching complete: Detected $updatesDetected available update(s).")

            ScanResult(
                scannedCount = installedEntities.size,
                updatesCount = updatesDetected,
                isSuccess = true
            )
        } catch (e: Exception) {
            Log.e(TAG, "scanAndMatch failed", e)
            ScanResult(
                scannedCount = 0,
                updatesCount = 0,
                isSuccess = false,
                errorMessage = e.message
            )
        }
    }

    /**
     * Matches the local "installed_apps" table with the "store_apps" table.
     * Generates or purges "app_updates" entries based on versionCode and semver rules.
     */
    suspend fun matchUpdates(): Int = withContext(Dispatchers.IO) {
        matchUpdatesInternal()
    }

    private suspend fun matchUpdatesInternal(): Int {
        val storeApps = database.storeAppDao().getAllAppsList()
        val installedApps = database.installedAppDao().getInstalledAppsList()
        val installedMap = installedApps.associateBy { it.packageName }

        val newUpdates = mutableListOf<AppUpdateEntity>()
        val upToDateAppIds = mutableListOf<String>()

        for (storeApp in storeApps) {
            val installed = installedMap[storeApp.packageName]
            if (installed != null) {
                val isUpdateAvailable = isUpdateNeeded(
                    storeVersionCode = storeApp.versionCode,
                    installedVersionCode = installed.versionCode,
                    storeVersionName = storeApp.version,
                    installedVersionName = installed.version
                )

                if (isUpdateAvailable) {
                    newUpdates.add(
                        AppUpdateEntity(
                            appId = storeApp.id,
                            packageName = storeApp.packageName,
                            appName = storeApp.name,
                            currentVersion = installed.version,
                            currentVersionCode = installed.versionCode,
                            newVersion = storeApp.version,
                            newVersionCode = storeApp.versionCode,
                            updateSize = storeApp.sizeMb,
                            releaseNotes = if (storeApp.changelog.isNotBlank()) storeApp.changelog else "Bug fixes, stability enhancements, and latest features.",
                            downloadUrl = storeApp.downloadUrl,
                            checksumSha256 = storeApp.checksumSha256,
                            isAvailable = true,
                            lastChecked = System.currentTimeMillis()
                        )
                    )
                } else {
                    upToDateAppIds.add(storeApp.id)
                }
            } else {
                upToDateAppIds.add(storeApp.id)
            }
        }

        // Persist update candidates
        database.appUpdateDao().clearUpdates()
        if (newUpdates.isNotEmpty()) {
            database.appUpdateDao().insertUpdates(newUpdates)
        }

        return newUpdates.size
    }

    /**
     * Determines whether an update is available based on:
     * 1. versionCode comparison (higher store versionCode -> update)
     * 2. Semantic version comparison fallback
     */
    fun isUpdateNeeded(
        storeVersionCode: Long,
        installedVersionCode: Long,
        storeVersionName: String,
        installedVersionName: String
    ): Boolean {
        if (storeVersionCode > installedVersionCode) {
            return true
        }
        if (storeVersionCode == installedVersionCode && storeVersionCode > 1L) {
            return false
        }
        // Fallback to semver string comparison
        return isSemanticVersionGreater(storeVersionName, installedVersionName)
    }

    /**
     * Compares two semantic version strings (e.g. "1.1.0" > "1.0.5").
     */
    private fun isSemanticVersionGreater(remote: String, local: String): Boolean {
        try {
            val cleanRemote = remote.trim().removePrefix("v").split("-")[0]
            val cleanLocal = local.trim().removePrefix("v").split("-")[0]

            val remoteParts = cleanRemote.split(".").mapNotNull { it.toIntOrNull() }
            val localParts = cleanLocal.split(".").mapNotNull { it.toIntOrNull() }

            val maxLen = maxOf(remoteParts.size, localParts.size)
            for (i in 0 until maxLen) {
                val r = remoteParts.getOrElse(i) { 0 }
                val l = localParts.getOrElse(i) { 0 }
                if (r > l) return true
                if (r < l) return false
            }
        } catch (e: Exception) {
            // Ignore parse errors and treat as equal
        }
        return false
    }

    /**
     * Resolves the primary action state for an app card or details view.
     * Exactly one primary state is produced:
     * - Downloading / Verifying / Installing / Paused
     * - Update Available (Update)
     * - Installed (Open)
     * - Not Installed (Install / GET)
     */
    fun determineActionState(
        appId: String,
        packageName: String,
        storeVersion: String,
        storeVersionCode: Long,
        storeSize: String,
        installedApp: InstalledAppEntity?,
        activeDownload: DownloadInfo?
    ): AppActionState {
        // 1. Active download pipeline takes precedence
        if (activeDownload != null) {
            return when (activeDownload.status) {
                DownloadStatus.DOWNLOADING -> AppActionState.Downloading(
                    progress = activeDownload.progress,
                    speedKbps = activeDownload.speedKbps
                )
                DownloadStatus.PAUSED -> AppActionState.Paused
                DownloadStatus.VERIFYING -> AppActionState.Verifying
                DownloadStatus.INSTALLING -> AppActionState.Installing
                DownloadStatus.PENDING, DownloadStatus.WAITING, DownloadStatus.RETRYING ->
                    AppActionState.Downloading(progress = 0f, speedKbps = 0f)
                DownloadStatus.COMPLETED, DownloadStatus.IDLE, DownloadStatus.FAILED, DownloadStatus.CANCELED -> {
                    // Fall through to installed check
                    resolveInstalledState(installedApp, storeVersion, storeVersionCode, storeSize)
                }
            }
        }

        // 2. Installed & Version state
        return resolveInstalledState(installedApp, storeVersion, storeVersionCode, storeSize)
    }

    private fun resolveInstalledState(
        installedApp: InstalledAppEntity?,
        storeVersion: String,
        storeVersionCode: Long,
        storeSize: String
    ): AppActionState {
        if (installedApp == null) {
            return AppActionState.Install
        }

        val updateAvailable = isUpdateNeeded(
            storeVersionCode = storeVersionCode,
            installedVersionCode = installedApp.versionCode,
            storeVersionName = storeVersion,
            installedVersionName = installedApp.version
        )

        return if (updateAvailable) {
            AppActionState.Update(
                currentVersion = installedApp.version,
                newVersion = storeVersion,
                updateSize = storeSize
            )
        } else {
            AppActionState.Installed(currentVersion = installedApp.version)
        }
    }

    /**
     * Launches an installed application via its default launch intent.
     */
    fun launchApp(context: Context, packageName: String): Boolean {
        return try {
            val pm = context.packageManager
            val intent = pm.getLaunchIntentForPackage(packageName)
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
                true
            } else {
                Log.w(TAG, "No launch intent found for package: $packageName")
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch $packageName", e)
            false
        }
    }

    companion object {
        @Volatile
        private var INSTANCE: InstalledAppsManager? = null

        fun getInstance(context: Context): InstalledAppsManager {
            return INSTANCE ?: synchronized(this) {
                val db = AppDatabase.getInstance(context.applicationContext)
                val instance = InstalledAppsManager(db)
                INSTANCE = instance
                instance
            }
        }

        fun getInstance(database: AppDatabase): InstalledAppsManager {
            return INSTANCE ?: synchronized(this) {
                val instance = InstalledAppsManager(database)
                INSTANCE = instance
                instance
            }
        }

        fun getInstance(): InstalledAppsManager? = INSTANCE
    }
}

data class ScanResult(
    val scannedCount: Int,
    val updatesCount: Int,
    val isSuccess: Boolean,
    val errorMessage: String? = null
)
