package com.avanyx.store.supabase

import android.content.Context
import android.util.Log
import com.avanyx.store.BuildConfig
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.storage.Storage
import io.github.jan.supabase.storage.storage

/**
 * Singleton manager to initialize and provide access to the Supabase Kotlin SDK client.
 */
object SupabaseManager {

    private const val TAG = "SupabaseManager"

    const val DEFAULT_PROJECT_ID = "tqdzowkqyusxjfkmzlks"
    const val DEFAULT_SUPABASE_URL = "https://tqdzowkqyusxjfkmzlks.supabase.co"
    const val DEFAULT_PUBLISHABLE_KEY = "sb_publishable_zQwVwwxTuoNL1i4YnVBrHg_KKR798Os"

    private var client: SupabaseClient? = null
    @Volatile
    private var isInitialized = false

    /**
     * Initializes Supabase Client safely once during app startup.
     */
    fun initialize(context: Context) {
        if (isInitialized) return

        synchronized(this) {
            if (isInitialized) return

            val resolvedUrl = getSupabaseUrl()
            val resolvedKey = getPublishableKey()

            try {
                client = createSupabaseClient(
                    supabaseUrl = resolvedUrl,
                    supabaseKey = resolvedKey
                ) {
                    install(Storage)
                }
                isInitialized = true
                Log.i(TAG, "Supabase Client initialized successfully for URL: $resolvedUrl")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to initialize Supabase Client: ${e.message}", e)
            }
        }
    }

    fun getClient(): SupabaseClient? {
        return client
    }

    fun getStorage(): Storage? {
        return client?.storage
    }

    fun isInitialized(): Boolean = isInitialized

    fun getSupabaseUrl(): String {
        val rawUrl = try { BuildConfig.SUPABASE_URL } catch (e: Exception) { "" }
        return when {
            rawUrl.isNotBlank() && rawUrl != "MY_SUPABASE_URL" -> {
                if (!rawUrl.startsWith("http")) "https://$rawUrl.supabase.co" else rawUrl
            }
            else -> DEFAULT_SUPABASE_URL
        }
    }

    fun getPublishableKey(): String {
        val rawKey = try { BuildConfig.SUPABASE_PUBLISHABLE_KEY } catch (e: Exception) { "" }
        return when {
            rawKey.isNotBlank() && rawKey != "MY_SUPABASE_KEY" -> rawKey
            else -> DEFAULT_PUBLISHABLE_KEY
        }
    }
}
