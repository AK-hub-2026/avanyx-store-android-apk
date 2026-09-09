package com.avanyx.store.firebase

import android.content.Context
import android.util.Log
import com.google.firebase.FirebaseApp

object FirebaseInit {
    private const val TAG = "FirebaseInit"

    fun initialize(context: Context) {
        try {
            if (FirebaseApp.getApps(context).isEmpty()) {
                FirebaseApp.initializeApp(context)
                Log.d(TAG, "FirebaseApp initialized successfully.")
            }
        } catch (e: Exception) {
            Log.e(TAG, "FirebaseInit initialization error", e)
        }
    }
}
