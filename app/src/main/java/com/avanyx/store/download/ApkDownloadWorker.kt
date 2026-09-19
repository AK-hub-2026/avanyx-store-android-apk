package com.avanyx.store.download

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.workDataOf

class ApkDownloadWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        val appId = inputData.getString(KEY_APP_ID) ?: return Result.failure()
        val appName = inputData.getString(KEY_APP_NAME) ?: "Application"
        val downloadUrl = inputData.getString(KEY_DOWNLOAD_URL) ?: return Result.failure()
        val expectedChecksum = inputData.getString(KEY_CHECKSUM)

        val downloadEngine = DownloadManagerEngine.getInstance(applicationContext)

        val success = downloadEngine.startOrResumeDownloadSync(
            appId = appId,
            appName = appName,
            downloadUrl = downloadUrl,
            expectedChecksum = expectedChecksum
        )

        return if (success) {
            Result.success(workDataOf("appId" to appId))
        } else {
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure(workDataOf("error" to "Download failed after multiple attempts"))
            }
        }
    }

    companion object {
        const val KEY_APP_ID = "key_app_id"
        const val KEY_APP_NAME = "key_app_name"
        const val KEY_DOWNLOAD_URL = "key_download_url"
        const val KEY_CHECKSUM = "key_checksum"
    }
}
