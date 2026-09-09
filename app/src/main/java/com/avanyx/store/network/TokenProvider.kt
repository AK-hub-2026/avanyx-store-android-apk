package com.avanyx.store.network

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext

class TokenProvider(
    private val firebaseAuth: FirebaseAuth = FirebaseAuth.getInstance()
) {
    private val TAG = "TokenProvider"

    /**
     * Gets the current user's Firebase ID Token (JWT).
     * @param forceRefresh Set to true to force a refresh if token is expired or revoked.
     */
    suspend fun getToken(forceRefresh: Boolean = false): String? = withContext(Dispatchers.IO) {
        val user = firebaseAuth.currentUser ?: run {
            Log.w(TAG, "No authenticated user currently logged into Firebase Auth")
            return@withContext null
        }
        return@withContext try {
            val tokenResult = user.getIdToken(forceRefresh).await()
            val token = tokenResult.token
            Log.d(TAG, "Successfully acquired Firebase ID Token (length: ${token?.length ?: 0})")
            token
        } catch (e: Exception) {
            Log.e(TAG, "Error obtaining Firebase ID Token", e)
            null
        }
    }

    fun getCurrentUid(): String? {
        return firebaseAuth.currentUser?.uid
    }
}
