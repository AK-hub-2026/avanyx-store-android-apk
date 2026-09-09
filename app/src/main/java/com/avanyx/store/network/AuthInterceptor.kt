package com.avanyx.store.network

import android.util.Log
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor(
    private val tokenProvider: TokenProvider = TokenProvider()
) : Interceptor {

    private val TAG = "AuthInterceptor"

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        // Fetch fresh token (cached or refreshed)
        val token = runBlocking { tokenProvider.getToken(forceRefresh = false) }

        val requestBuilder = originalRequest.newBuilder()
        if (!token.isNull_orBlank()) {
            requestBuilder.header("Authorization", "Bearer $token")
            Log.d(TAG, "Added Authorization Bearer header to request: ${originalRequest.url}")
        } else {
            Log.w(TAG, "Executing request without Authorization header (No active user session)")
        }

        var response = chain.proceed(requestBuilder.build())

        // If backend returns 401 Unauthorized, force refresh JWT token and retry request once
        if (response.code == 401 && !token.isNull_orBlank()) {
            Log.w(TAG, "Backend returned 401 Unauthorized. Force-refreshing Firebase ID token and retrying request...")
            response.close()

            val newToken = runBlocking { tokenProvider.getToken(forceRefresh = true) }
            if (!newToken.isNull_orBlank()) {
                val newRequest = originalRequest.newBuilder()
                    .header("Authorization", "Bearer $newToken")
                    .build()
                response = chain.proceed(newRequest)
            }
        }

        return response
    }

    private fun String?.isNull_orBlank(): Boolean = this == null || this.trim().isEmpty()
}
