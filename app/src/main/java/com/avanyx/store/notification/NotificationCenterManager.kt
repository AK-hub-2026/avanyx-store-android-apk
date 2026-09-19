package com.avanyx.store.notification

import android.content.Context
import com.avanyx.store.data.database.AppDatabase
import com.avanyx.store.data.database.entity.NotificationEntity
import com.avanyx.store.firebase.FirestoreService
import com.avanyx.store.firebase.model.FirestoreNotification
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

object NotificationCenterManager {

    fun postWelcome(context: Context, userName: String?) {
        val name = userName?.ifBlank { "Guest" } ?: "Guest"
        postNotification(
            context = context,
            id = "welcome_${System.currentTimeMillis()}",
            title = "Welcome $name",
            message = "Welcome to AVANYX Store! Browse and discover verified applications and games.",
            type = "WELCOME"
        )
    }

    fun postLoginSuccess(context: Context, userName: String?) {
        val name = userName?.ifBlank { "User" } ?: "User"
        postNotification(
            context = context,
            id = "login_${System.currentTimeMillis()}",
            title = "Login Success",
            message = "You have successfully logged in as $name.",
            type = "AUTH"
        )
    }

    fun postDownloadStarted(context: Context, appName: String) {
        postNotification(
            context = context,
            id = "dl_start_${System.currentTimeMillis()}",
            title = "App Download Started",
            message = "Starting download for $appName.",
            type = "DOWNLOAD_STARTED"
        )
    }

    fun postDownloadCompleted(context: Context, appName: String) {
        postNotification(
            context = context,
            id = "dl_comp_${System.currentTimeMillis()}",
            title = "Download Completed",
            message = "$appName was downloaded successfully and is ready to use.",
            type = "DOWNLOAD_COMPLETE"
        )
    }

    fun postUpdateAvailable(context: Context, appName: String, newVersion: String) {
        postNotification(
            context = context,
            id = "update_${appName.replace(" ", "_").lowercase()}_$newVersion",
            title = "Update Available",
            message = "A new update for $appName (v$newVersion) is available in AVANYX Store.",
            type = "UPDATE"
        )
    }

    fun postNewAppPublished(context: Context, appName: String, devName: String) {
        postNotification(
            context = context,
            id = "new_app_${appName.replace(" ", "_").lowercase()}",
            title = "New App Published",
            message = "$appName by $devName has just been published on AVANYX Store!",
            type = "NEW_APP"
        )
    }

    private fun postNotification(
        context: Context,
        id: String,
        title: String,
        message: String,
        type: String
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val db = AppDatabase.getInstance(context)
                val entity = NotificationEntity(
                    id = id,
                    title = title,
                    message = message,
                    timestamp = System.currentTimeMillis(),
                    isRead = false,
                    type = type
                )
                db.notificationDao().insertNotification(entity)

                val user = FirebaseAuth.getInstance().currentUser
                if (user != null) {
                    val firestoreNotif = FirestoreNotification(
                        id = id,
                        userId = user.uid,
                        title = title,
                        message = message,
                        timestamp = System.currentTimeMillis(),
                        isRead = false,
                        type = type
                    )
                    FirestoreService().saveNotification(firestoreNotif)
                }
            } catch (_: Exception) {}
        }
    }
}
