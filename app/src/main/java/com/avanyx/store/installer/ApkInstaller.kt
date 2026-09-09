package com.avanyx.store.installer

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileInputStream

object ApkInstaller {

    private const val AUTHORITY = "com.avanyx.store.fileprovider"

    /**
     * Checks if the app has permission to install packages from unknown sources (Android 8.0+).
     */
    fun canInstallPackages(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.packageManager.canRequestPackageInstalls()
        } else {
            true
        }
    }

    /**
     * Returns an Intent to open system settings for requesting install unknown apps permission.
     */
    fun getInstallPermissionIntent(context: Context): Intent {
        return Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
            data = Uri.parse("package:${context.packageName}")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
    }

    /**
     * Triggers the APK installation using PackageInstaller API or FileProvider Intent.
     */
    fun installApk(context: Context, apkFile: File): Result<Boolean> {
        return try {
            if (!apkFile.exists()) {
                return Result.failure(IllegalArgumentException("APK file does not exist: ${apkFile.absolutePath}"))
            }

            if (!canInstallPackages(context)) {
                val intent = getInstallPermissionIntent(context)
                context.startActivity(intent)
                return Result.failure(SecurityException("UNKNOWN_SOURCES_PERMISSION_REQUIRED"))
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                installViaPackageInstaller(context, apkFile)
            } else {
                installViaIntent(context, apkFile)
            }
            Result.success(true)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun installViaIntent(context: Context, apkFile: File) {
        val apkUri: Uri = FileProvider.getUriForFile(context, AUTHORITY, apkFile)
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(apkUri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    private fun installViaPackageInstaller(context: Context, apkFile: File) {
        val packageInstaller = context.packageManager.packageInstaller
        val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL)
        
        val sessionId = packageInstaller.createSession(params)
        val session = packageInstaller.openSession(sessionId)

        session.use { activeSession ->
            FileInputStream(apkFile).use { input ->
                activeSession.openWrite("package_session", 0, apkFile.length()).use { output ->
                    input.copyTo(output)
                    activeSession.fsync(output)
                }
            }

            val receiverIntent = Intent(context, ApkInstallReceiver::class.java).apply {
                action = ApkInstallReceiver.ACTION_INSTALL_STATUS
            }

            val pendingFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }

            val pendingIntent = PendingIntent.getBroadcast(
                context,
                sessionId,
                receiverIntent,
                pendingFlags
            )

            activeSession.commit(pendingIntent.intentSender)
        }
    }
}
