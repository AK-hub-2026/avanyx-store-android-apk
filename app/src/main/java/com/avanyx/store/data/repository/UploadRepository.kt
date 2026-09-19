package com.avanyx.store.data.repository

import android.util.Log
import com.avanyx.store.network.model.StorageUploadResponse
import com.avanyx.store.supabase.StorageService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext

class UploadRepository(
    private val storageService: StorageService = StorageService(),
    private val storageRepository: StorageRepository = StorageRepository()
) {
    private val TAG = "UploadRepository"

    /**
     * Lists active Supabase Storage buckets for verification.
     */
    suspend fun listBuckets(): Result<List<String>> = withContext(Dispatchers.IO) {
        storageService.listBuckets()
    }

    /**
     * Verifies Supabase Storage connectivity.
     */
    suspend fun verifyConnection(): Result<Boolean> = withContext(Dispatchers.IO) {
        storageService.verifyStorageConnection()
    }

    /**
     * Streams file upload progress with retry and cancellation support.
     */
    fun uploadFileWithProgress(
        bucketType: String,
        fileBytes: ByteArray,
        fileName: String,
        mimeType: String,
        appId: String? = null,
        screenshotIndex: Int? = null,
        oldFilePath: String? = null
    ): Flow<UploadProgressState> {
        return storageRepository.uploadFileWithProgress(
            bucketType = bucketType,
            fileBytes = fileBytes,
            fileName = fileName,
            mimeType = mimeType,
            appId = appId,
            screenshotIndex = screenshotIndex,
            oldFilePath = oldFilePath
        )
    }

    /**
     * Deletes a file asset from a target Supabase bucket.
     */
    suspend fun deleteAsset(bucketName: String, filePath: String): Result<Unit> = withContext(Dispatchers.IO) {
        storageRepository.deleteAsset(bucketName, filePath)
    }

    /**
     * Resolves the public URL for a given bucket and file path.
     */
    fun getPublicUrl(bucketName: String, filePath: String): String {
        return storageService.getPublicUrl(bucketName, filePath)
    }
}
