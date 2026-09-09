package com.avanyx.store.download

import android.content.Context
import android.util.Log
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.Data
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.avanyx.store.data.model.DownloadInfo
import com.avanyx.store.data.model.DownloadStatus
import com.avanyx.store.installer.ApkInstaller
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

class DownloadManagerEngine private constructor(private val context: Context) {

    private val notificationHelper = DownloadNotificationHelper(context)
    private val scope = CoroutineScope(Dispatchers.IO + Job())

    private val _downloadsMap = MutableStateFlow<Map<String, DownloadInfo>>(emptyMap())
    val downloadsMap: StateFlow<Map<String, DownloadInfo>> = _downloadsMap.asStateFlow()

    private val activeJobs = ConcurrentHashMap<String, Job>()
    private val activeConnections = ConcurrentHashMap<String, HttpURLConnection>()

    fun getDownloadInfo(appId: String): DownloadInfo? {
        return _downloadsMap.value[appId]
    }

    fun startOrResumeDownload(
        appId: String,
        appName: String,
        downloadUrl: String,
        expectedChecksum: String? = null
    ) {
        val current = _downloadsMap.value[appId]
        if (current?.status == DownloadStatus.DOWNLOADING) {
            return
        }

        // Schedule via WorkManager for background reliability
        scheduleWorkManager(appId, appName, downloadUrl, expectedChecksum)

        val job = scope.launch {
            executeDownloadStream(appId, appName, downloadUrl, expectedChecksum)
        }
        activeJobs[appId] = job
    }

    suspend fun startOrResumeDownloadSync(
        appId: String,
        appName: String,
        downloadUrl: String,
        expectedChecksum: String? = null
    ): Boolean {
        return executeDownloadStream(appId, appName, downloadUrl, expectedChecksum)
    }

    fun pauseDownload(appId: String) {
        activeJobs[appId]?.cancel()
        activeJobs.remove(appId)

        activeConnections[appId]?.let { conn ->
            try {
                conn.disconnect()
            } catch (e: Exception) {
                Log.e(TAG, "Error disconnecting HTTP connection: ${e.message}")
            }
        }
        activeConnections.remove(appId)

        _downloadsMap.update { map ->
            val info = map[appId] ?: return@update map
            val updated = info.copy(status = DownloadStatus.PAUSED, speedKbps = 0f)
            notificationHelper.showProgressNotification(updated)
            map + (appId to updated)
        }
    }

    fun cancelDownload(appId: String) {
        pauseDownload(appId)
        val file = getApkFile(appId)
        if (file.exists()) {
            file.delete()
        }

        _downloadsMap.update { map ->
            val info = map[appId] ?: return@update map
            val updated = info.copy(
                status = DownloadStatus.CANCELED,
                downloadedBytes = 0L,
                progress = 0f,
                speedKbps = 0f
            )
            notificationHelper.cancelNotification(appId)
            map + (appId to updated)
        }
    }

    fun retryDownload(
        appId: String,
        appName: String,
        downloadUrl: String,
        expectedChecksum: String? = null
    ) {
        cancelDownload(appId)
        startOrResumeDownload(appId, appName, downloadUrl, expectedChecksum)
    }

    fun installDownloadedApk(appId: String): Result<Boolean> {
        val file = getApkFile(appId)
        if (!file.exists()) {
            return Result.failure(IllegalStateException("Downloaded APK file not found"))
        }

        _downloadsMap.update { map ->
            val info = map[appId] ?: return@update map
            val updated = info.copy(status = DownloadStatus.INSTALLING)
            notificationHelper.showProgressNotification(updated)
            map + (appId to updated)
        }

        val result = ApkInstaller.installApk(context, file)
        if (result.isSuccess) {
            _downloadsMap.update { map ->
                val info = map[appId] ?: return@update map
                val updated = info.copy(status = DownloadStatus.COMPLETED)
                notificationHelper.showProgressNotification(updated)
                map + (appId to updated)
            }
            scope.launch {
                try {
                    com.avanyx.store.manager.InstalledAppsManager.getInstance(context).scanAndMatch(context)
                } catch (e: Exception) {
                    Log.e(TAG, "Post-install scan failed: ${e.message}")
                }
            }
        } else {
            _downloadsMap.update { map ->
                val info = map[appId] ?: return@update map
                val updated = info.copy(
                    status = DownloadStatus.FAILED,
                    errorMessage = result.exceptionOrNull()?.message ?: "Installation failed"
                )
                notificationHelper.showProgressNotification(updated)
                map + (appId to updated)
            }
        }
        return result
    }

    fun clearCompletedDownloads() {
        _downloadsMap.update { map ->
            map.filterValues { it.status != DownloadStatus.COMPLETED && it.status != DownloadStatus.CANCELED }
        }
    }

    private suspend fun executeDownloadStream(
        appId: String,
        appName: String,
        downloadUrl: String,
        expectedChecksum: String?
    ): Boolean = withContext(Dispatchers.IO) {
        val apkFile = getApkFile(appId)
        var downloadedBytes = if (apkFile.exists()) apkFile.length() else 0L

        updateDownloadState(
            DownloadInfo(
                appId = appId,
                appName = appName,
                totalSizeBytes = 0L,
                downloadedBytes = downloadedBytes,
                status = DownloadStatus.DOWNLOADING,
                progress = 0f,
                speedKbps = 0f,
                checksumSha256 = expectedChecksum
            )
        )

        try {
            val validUrl = if (downloadUrl.isBlank()) DEFAULT_FALLBACK_APK_URL else downloadUrl
            val url = URL(validUrl)
            val connection = url.openConnection() as HttpURLConnection
            activeConnections[appId] = connection

            connection.requestMethod = "GET"
            connection.connectTimeout = 15000
            connection.readTimeout = 15000

            if (downloadedBytes > 0) {
                connection.setRequestProperty("Range", "bytes=$downloadedBytes-")
            }

            connection.connect()

            val responseCode = connection.responseCode
            val isPartial = responseCode == HttpURLConnection.HTTP_PARTIAL
            if (responseCode != HttpURLConnection.HTTP_OK && !isPartial) {
                // Reset file if server doesn't support HTTP Range resume
                if (downloadedBytes > 0) {
                    apkFile.delete()
                    downloadedBytes = 0L
                    return@withContext executeDownloadStream(appId, appName, downloadUrl, expectedChecksum)
                }
                val errorMsg = "HTTP Error $responseCode: ${connection.responseMessage}"
                markFailed(appId, appName, errorMsg)
                return@withContext false
            }

            val contentLength = connection.contentLengthLong
            val totalBytes = if (isPartial) downloadedBytes + contentLength else contentLength

            val input: InputStream = connection.inputStream
            val output = FileOutputStream(apkFile, isPartial)

            val buffer = ByteArray(8192)
            var bytesRead: Int
            var lastTime = System.currentTimeMillis()
            var bytesSinceLast = 0L

            while (input.read(buffer).also { bytesRead = it } != -1) {
                output.write(buffer, 0, bytesRead)
                downloadedBytes += bytesRead
                bytesSinceLast += bytesRead

                val currentTime = System.currentTimeMillis()
                val timeDiff = currentTime - lastTime

                if (timeDiff >= 500) {
                    val speedKbps = (bytesSinceLast / 1024f) / (timeDiff / 1000f)
                    val progress = if (totalBytes > 0) downloadedBytes.toFloat() / totalBytes else 0f

                    val updatedInfo = DownloadInfo(
                        appId = appId,
                        appName = appName,
                        totalSizeBytes = totalBytes,
                        downloadedBytes = downloadedBytes,
                        status = DownloadStatus.DOWNLOADING,
                        progress = progress.coerceIn(0f, 1f),
                        speedKbps = speedKbps,
                        checksumSha256 = expectedChecksum
                    )
                    updateDownloadState(updatedInfo)

                    lastTime = currentTime
                    bytesSinceLast = 0L
                }
            }

            output.flush()
            output.close()
            input.close()

            activeConnections.remove(appId)

            // Step 2: Verification Phase
            updateDownloadState(
                DownloadInfo(
                    appId = appId,
                    appName = appName,
                    totalSizeBytes = totalBytes,
                    downloadedBytes = downloadedBytes,
                    status = DownloadStatus.VERIFYING,
                    progress = 1.0f,
                    speedKbps = 0f,
                    checksumSha256 = expectedChecksum
                )
            )

            val isValidChecksum = ChecksumVerifier.verifyChecksum(apkFile, expectedChecksum)
            if (!isValidChecksum) {
                markFailed(appId, appName, "APK SHA-256 Checksum verification failed!")
                return@withContext false
            }

            // Step 3: Installation Phase
            val installResult = installDownloadedApk(appId)
            installResult.isSuccess
        } catch (e: Exception) {
            Log.e(TAG, "Download error for $appId: ${e.message}")
            if (activeJobs[appId]?.isCancelled == true) {
                // Pause handled separately
                false
            } else {
                markFailed(appId, appName, e.message ?: "Connection error during download")
                false
            }
        }
    }

    private fun markFailed(appId: String, appName: String, errorMsg: String) {
        val info = DownloadInfo(
            appId = appId,
            appName = appName,
            totalSizeBytes = 0L,
            downloadedBytes = 0L,
            status = DownloadStatus.FAILED,
            progress = 0f,
            speedKbps = 0f,
            errorMessage = errorMsg
        )
        updateDownloadState(info)
    }

    private fun updateDownloadState(info: DownloadInfo) {
        _downloadsMap.update { map -> map + (info.appId to info) }
        notificationHelper.showProgressNotification(info)
    }

    private fun getApkFile(appId: String): File {
        val downloadsDir = File(context.getExternalFilesDir(null), "apks")
        if (!downloadsDir.exists()) {
            downloadsDir.mkdirs()
        }
        return File(downloadsDir, "$appId.apk")
    }

    private fun scheduleWorkManager(
        appId: String,
        appName: String,
        downloadUrl: String,
        expectedChecksum: String?
    ) {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val inputData = Data.Builder()
            .putString(ApkDownloadWorker.KEY_APP_ID, appId)
            .putString(ApkDownloadWorker.KEY_APP_NAME, appName)
            .putString(ApkDownloadWorker.KEY_DOWNLOAD_URL, downloadUrl)
            .putString(ApkDownloadWorker.KEY_CHECKSUM, expectedChecksum)
            .build()

        val workRequest = OneTimeWorkRequestBuilder<ApkDownloadWorker>()
            .setConstraints(constraints)
            .setInputData(inputData)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, TimeUnit.SECONDS)
            .build()

        WorkManager.getInstance(context).enqueue(workRequest)
    }

    companion object {
        private const val TAG = "DownloadManagerEngine"
        private const val DEFAULT_FALLBACK_APK_URL =
            "https://github.com/aosp-mirror/platform_development/raw/master/samples/ApiDemos/ApiDemos.apk"

        @Volatile
        private var instance: DownloadManagerEngine? = null

        fun getInstance(context: Context): DownloadManagerEngine {
            return instance ?: synchronized(this) {
                instance ?: DownloadManagerEngine(context.applicationContext).also { instance = it }
            }
        }
    }
}
