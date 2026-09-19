package com.avanyx.store.download

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import com.avanyx.store.R
import com.avanyx.store.data.model.DownloadInfo
import com.avanyx.store.data.model.DownloadStatus

class DownloadNotificationHelper(private val context: Context) {

    private val notificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    init {
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "AVANYX Downloads",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows progress notifications for app downloads and installations."
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    fun showProgressNotification(downloadInfo: DownloadInfo) {
        val notificationId = downloadInfo.appId.hashCode()

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(downloadInfo.appName)
            .setOngoing(true)
            .setOnlyAlertOnce(true)

        when (downloadInfo.status) {
            DownloadStatus.DOWNLOADING -> {
                val progressPercent = (downloadInfo.progress * 100).toInt()
                builder.setContentText("Downloading... $progressPercent% (${String.format("%.1f", downloadInfo.speedKbps)} KB/s)")
                    .setProgress(100, progressPercent, false)
            }
            DownloadStatus.PAUSED -> {
                builder.setContentText("Download Paused")
                    .setProgress(100, (downloadInfo.progress * 100).toInt(), false)
                    .setOngoing(false)
            }
            DownloadStatus.VERIFYING -> {
                builder.setContentText("Verifying SHA-256 Checksum...")
                    .setProgress(100, 100, true)
            }
            DownloadStatus.INSTALLING -> {
                builder.setContentText("Installing Application...")
                    .setProgress(100, 100, true)
            }
            DownloadStatus.COMPLETED -> {
                builder.setContentText("Installation Complete!")
                    .setProgress(0, 0, false)
                    .setOngoing(false)
            }
            DownloadStatus.FAILED -> {
                builder.setContentText("Download Failed: ${downloadInfo.errorMessage ?: "Unknown error"}")
                    .setProgress(0, 0, false)
                    .setOngoing(false)
            }
            else -> return
        }

        try {
            notificationManager.notify(notificationId, builder.build())
        } catch (e: SecurityException) {
            // POST_NOTIFICATIONS permission not granted
        }
    }

    fun cancelNotification(appId: String) {
        notificationManager.cancel(appId.hashCode())
    }

    companion object {
        const val CHANNEL_ID = "avanyx_downloads_channel"
    }
}
