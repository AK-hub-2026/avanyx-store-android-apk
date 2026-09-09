package com.avanyx.store.data.repository

import android.util.Log
import com.avanyx.store.network.BackendService
import com.avanyx.store.network.NetworkModule
import com.avanyx.store.network.TokenProvider
import com.avanyx.store.network.model.UserAuthMeResponse
import com.avanyx.store.network.model.VerifyTokenRequest
import com.avanyx.store.network.model.VerifyTokenResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class BackendRepository(
    private val backendService: BackendService = NetworkModule.backendService,
    private val tokenProvider: TokenProvider = TokenProvider()
) {
    private val TAG = "BackendRepository"

    /**
     * Calls GET /api/auth/me on backend with automatic Firebase JWT token injection
     */
    suspend fun getAuthMe(): Result<UserAuthMeResponse> = withContext(Dispatchers.IO) {
        try {
            val response = backendService.getAuthMe()
            if (response.isSuccessful && response.body()?.success == true) {
                val userResponse = response.body()?.data
                if (userResponse != null) {
                    Log.d(TAG, "Backend /api/auth/me returned user: ${userResponse.uid}, Role: ${userResponse.role}")
                    Result.success(userResponse)
                } else {
                    Result.failure(Exception("Backend returned empty user payload"))
                }
            } else {
                val errMsg = response.errorBody()?.string() ?: response.message()
                Log.e(TAG, "Backend /api/auth/me error: ${response.code()} - $errMsg")
                Result.failure(Exception("HTTP ${response.code()}: $errMsg"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception calling /api/auth/me", e)
            Result.failure(e)
        }
    }

    /**
     * Calls POST /api/auth/verify on backend to explicitly verify current Firebase JWT Token
     */
    suspend fun verifyToken(customToken: String? = null): Result<VerifyTokenResponse> = withContext(Dispatchers.IO) {
        try {
            val token = customToken ?: tokenProvider.getToken(forceRefresh = false)
            if (token == null || token.trim().isEmpty()) {
                return@withContext Result.failure(Exception("No active Firebase JWT token available to verify"))
            }

            val request = VerifyTokenRequest(idToken = token)
            val response = backendService.verifyAuthToken(request)

            if (response.isSuccessful && response.body()?.success == true) {
                val verifyData = response.body()?.data
                if (verifyData != null) {
                    Log.d(TAG, "Backend /api/auth/verify success for UID: ${verifyData.uid}, Verified: ${verifyData.verified}")
                    Result.success(verifyData)
                } else {
                    Result.failure(Exception("Verify response data is null"))
                }
            } else {
                val errMsg = response.errorBody()?.string() ?: response.message()
                Result.failure(Exception("Verification Failed: HTTP ${response.code()} - $errMsg"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception verifying token with backend", e)
            Result.failure(e)
        }
    }

    suspend fun getFreshFirebaseIdToken(): String? {
        return tokenProvider.getToken(forceRefresh = true)
    }

    fun getCurrentUid(): String? {
        return tokenProvider.getCurrentUid()
    }

    private fun String?.isNull_orBlank(): Boolean = this == null || this.trim().isEmpty()
}
