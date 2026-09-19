package com.avanyx.store.installer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.util.Log
import kotlinx.coroutines.launch

class ApkInstallReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, -1)
        val message = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE)
        val packageName = intent.getStringExtra(PackageInstaller.EXTRA_PACKAGE_NAME)

        Log.d("ApkInstallReceiver", "PackageInstaller status=$status, msg=$message, pkg=$packageName")

        when (status) {
            PackageInstaller.STATUS_PENDING_USER_ACTION -> {
                val confirmIntent = intent.getParcelableExtra<Intent>(Intent.EXTRA_INTENT)
                confirmIntent?.let {
                    it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(it)
                }
            }
            PackageInstaller.STATUS_SUCCESS -> {
                Log.i("ApkInstallReceiver", "Successfully installed package: $packageName")
                kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
                    try {
                        com.avanyx.store.manager.InstalledAppsManager.getInstance(context).scanAndMatch(context)
                    } catch (e: Exception) {
                        Log.e("ApkInstallReceiver", "Failed to update installed apps: ${e.message}")
                    }
                }
            }
            else -> {
                Log.e("ApkInstallReceiver", "Installation failed with status=$status: $message")
            }
        }
    }

    companion object {
        const val ACTION_INSTALL_STATUS = "com.avanyx.store.ACTION_INSTALL_STATUS"
    }
}
