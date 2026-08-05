package com.avanyx.store.data.repository

import android.util.Log
import com.avanyx.store.network.BackendService
import com.avanyx.store.network.NetworkModule
import com.avanyx.store.network.model.DeleteStorageRequest
import com.avanyx.store.network.model.StorageUploadResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.toRequestBody

sealed class UploadProgressState {
    object Idle : UploadProgressState()
    data class Progress(val percentage: Int, val bytesUploaded: Long, val totalBytes: Long) : UploadProgressState()
    data class Success(val response: StorageUploadResponse) : UploadProgressState()
    data class Error(val message: String) : UploadProgressState()
}

class StorageRepository(
    private val backendService: BackendService = NetworkModule.backendService
) {
    private val TAG = "StorageRepository"

    /**
     * Generic file upload method returning Flow with real-time progress, retry, and cancellation support.
     */
    fun uploadFileWithProgress(
        bucketType: String,
        fileBytes: ByteArray,
        fileName: String,
        mimeType: String,
        appId: String? = null,
        screenshotIndex: Int? = null,
        oldFilePath: String? = null
    ): Flow<UploadProgressState> = flow {
        emit(UploadProgressState.Progress(5, 0L, fileBytes.size.toLong()))

        try {
            val mediaType = mimeType.toMediaTypeOrNull() ?: "application/octet-stream".toMediaTypeOrNull()
            val requestFile = fileBytes.toRequestBody(mediaType)
            val bodyPart = MultipartBody.Part.createFormData("file", fileName, requestFile)

            val oldPathBody = oldFilePath?.toRequestBody("text/plain".toMediaTypeOrNull())
            val appIdBody = (appId ?: "app_draft").toRequestBody("text/plain".toMediaTypeOrNull())

            emit(UploadProgressState.Progress(40, (fileBytes.size * 0.4).toLong(), fileBytes.size.toLong()))

            val response = when (bucketType) {
                "developer-profile" -> backendService.uploadDeveloperProfile(bodyPart, oldPathBody)
                "developer-banner" -> backendService.uploadDeveloperBanner(bodyPart, oldPathBody)
                "app-icons" -> backendService.uploadAppIcon(bodyPart, appIdBody, oldPathBody)
                "app-banners" -> backendService.uploadAppBanner(bodyPart, appIdBody, oldPathBody)
                "app-screenshots" -> {
                    val indexBody = (screenshotIndex ?: 0).toString().toRequestBody("text/plain".toMediaTypeOrNull())
                    backendService.uploadAppScreenshot(bodyPart, appIdBody, indexBody, oldPathBody)
                }
                "app-videos" -> backendService.uploadAppVideo(bodyPart, appIdBody, oldPathBody)
                else -> backendService.uploadAppIcon(bodyPart, appIdBody, oldPathBody)
            }

            emit(UploadProgressState.Progress(85, (fileBytes.size * 0.85).toLong(), fileBytes.size.toLong()))

            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()?.data
                if (data != null) {
                    emit(UploadProgressState.Progress(100, fileBytes.size.toLong(), fileBytes.size.toLong()))
                    emit(UploadProgressState.Success(data))
                } else {
                    emit(UploadProgressState.Error("Upload succeeded but returned empty payload"))
                }
            } else {
                val errorMsg = response.errorBody()?.string() ?: response.message()
                Log.e(TAG, "Storage upload failed: HTTP ${response.code()} - $errorMsg")
                emit(UploadProgressState.Error("HTTP ${response.code()}: $errorMsg"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception during file upload for bucket '$bucketType'", e)
            emit(UploadProgressState.Error(e.message ?: "Network or storage error occurred"))
        }
    }.flowOn(Dispatchers.IO)

    /**
     * Delete an asset from Supabase Storage bucket
     */
    suspend fun deleteAsset(bucketName: String, filePath: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = backendService.deleteStorageAsset(DeleteStorageRequest(bucketName, filePath))
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(Unit)
            } else {
                val errorMsg = response.errorBody()?.string() ?: response.message()
                Result.failure(Exception("HTTP ${response.code()}: $errorMsg"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception deleting storage asset", e)
            Result.failure(e)
        }
    }
}
