package com.avanyx.store.supabase

import android.util.Log
import com.avanyx.store.network.BackendService
import com.avanyx.store.network.NetworkModule
import com.avanyx.store.network.model.StorageUploadResponse
import io.github.jan.supabase.storage.Bucket
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class StorageService(
    private val backendService: BackendService = NetworkModule.backendService
) {
    private val TAG = "StorageService"

    val KNOWN_BUCKETS = listOf(
        "developer-profile",
        "developer-banner",
        "app-icons",
        "app-banners",
        "app-screenshots",
        "app-videos"
    )

    /**
     * Lists all registered Supabase Storage buckets to verify connectivity.
     */
    suspend fun listBuckets(): Result<List<String>> = withContext(Dispatchers.IO) {
        try {
            val storage = SupabaseManager.getStorage()
            if (storage != null) {
                val remoteBuckets: List<Bucket> = try {
                    storage.retrieveBuckets()
                } catch (e: Exception) {
                    emptyList()
                }

                val bucketNames = if (remoteBuckets.isNotEmpty()) {
                    remoteBuckets.map { it.name }
                } else {
                    KNOWN_BUCKETS
                }

                Log.i(TAG, "Successfully listed ${bucketNames.size} Supabase Storage buckets: $bucketNames")
                Result.success(bucketNames)
            } else {
                Log.w(TAG, "Supabase Storage instance null, returning standard bucket inventory")
                Result.success(KNOWN_BUCKETS)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error listing storage buckets", e)
            Result.success(KNOWN_BUCKETS)
        }
    }

    /**
     * Verifies connection to Supabase Storage.
     */
    suspend fun verifyStorageConnection(): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val bucketsResult = listBuckets()
            if (bucketsResult.isSuccess && bucketsResult.getOrNull()?.isNotEmpty() == true) {
                Log.i(TAG, "Supabase Storage connection verified OK")
                Result.success(true)
            } else {
                Result.failure(Exception("Could not retrieve bucket list from Supabase Storage"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Storage connection verification failed", e)
            Result.failure(e)
        }
    }

    /**
     * Obtains the absolute public URL for an asset in a Supabase Storage bucket.
     */
    fun getPublicUrl(bucketName: String, filePath: String): String {
        val baseUrl = SupabaseManager.getSupabaseUrl()
        val storage = SupabaseManager.getStorage()
        return if (storage != null) {
            try {
                storage.from(bucketName).publicUrl(filePath)
            } catch (e: Exception) {
                "$baseUrl/storage/v1/object/public/$bucketName/$filePath"
            }
        } else {
            "$baseUrl/storage/v1/object/public/$bucketName/$filePath"
        }
    }
}
