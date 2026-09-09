package com.avanyx.store.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.avanyx.store.data.repository.StorageRepository
import com.avanyx.store.data.repository.UploadProgressState
import com.avanyx.store.data.repository.UploadRepository
import com.avanyx.store.network.model.StorageUploadResponse
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class UploadUiState {
    object Idle : UploadUiState()
    data class Uploading(
        val progressPercent: Int,
        val bytesUploaded: Long,
        val totalBytes: Long,
        val fileName: String
    ) : UploadUiState()
    data class Success(val response: StorageUploadResponse) : UploadUiState()
    data class Error(val message: String) : UploadUiState()
}

data class LastUploadTask(
    val bucketType: String,
    val fileBytes: ByteArray,
    val fileName: String,
    val mimeType: String,
    val appId: String? = null,
    val screenshotIndex: Int? = null,
    val oldFilePath: String? = null
)

class UploadViewModel(
    private val uploadRepository: UploadRepository = UploadRepository(),
    private val storageRepository: StorageRepository = StorageRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow<UploadUiState>(UploadUiState.Idle)
    val uiState: StateFlow<UploadUiState> = _uiState.asStateFlow()

    private val _bucketsState = MutableStateFlow<List<String>>(emptyList())
    val bucketsState: StateFlow<List<String>> = _bucketsState.asStateFlow()

    private var activeJob: Job? = null
    private var lastUploadTask: LastUploadTask? = null

    init {
        verifyAndListBuckets()
    }

    fun verifyAndListBuckets() {
        viewModelScope.launch {
            val result = uploadRepository.listBuckets()
            if (result.isSuccess) {
                _bucketsState.value = result.getOrDefault(emptyList())
            }
        }
    }

    fun uploadDeveloperProfile(fileBytes: ByteArray, fileName: String, mimeType: String = "image/png", oldFilePath: String? = null) {
        startUpload("developer-profile", fileBytes, fileName, mimeType, null, null, oldFilePath)
    }

    fun uploadDeveloperBanner(fileBytes: ByteArray, fileName: String, mimeType: String = "image/jpeg", oldFilePath: String? = null) {
        startUpload("developer-banner", fileBytes, fileName, mimeType, null, null, oldFilePath)
    }

    fun uploadAppIcon(appId: String, fileBytes: ByteArray, fileName: String, mimeType: String = "image/png", oldFilePath: String? = null) {
        startUpload("app-icons", fileBytes, fileName, mimeType, appId, null, oldFilePath)
    }

    fun uploadAppBanner(appId: String, fileBytes: ByteArray, fileName: String, mimeType: String = "image/jpeg", oldFilePath: String? = null) {
        startUpload("app-banners", fileBytes, fileName, mimeType, appId, null, oldFilePath)
    }

    fun uploadAppScreenshot(appId: String, fileBytes: ByteArray, fileName: String, index: Int = 0, mimeType: String = "image/png", oldFilePath: String? = null) {
        startUpload("app-screenshots", fileBytes, fileName, mimeType, appId, index, oldFilePath)
    }

    fun uploadAppVideo(appId: String, fileBytes: ByteArray, fileName: String, mimeType: String = "video/mp4", oldFilePath: String? = null) {
        startUpload("app-videos", fileBytes, fileName, mimeType, appId, null, oldFilePath)
    }

    private fun startUpload(
        bucketType: String,
        fileBytes: ByteArray,
        fileName: String,
        mimeType: String,
        appId: String?,
        screenshotIndex: Int?,
        oldFilePath: String?
    ) {
        activeJob?.cancel()
        lastUploadTask = LastUploadTask(bucketType, fileBytes, fileName, mimeType, appId, screenshotIndex, oldFilePath)

        activeJob = viewModelScope.launch {
            uploadRepository.uploadFileWithProgress(
                bucketType = bucketType,
                fileBytes = fileBytes,
                fileName = fileName,
                mimeType = mimeType,
                appId = appId,
                screenshotIndex = screenshotIndex,
                oldFilePath = oldFilePath
            ).collect { state ->
                when (state) {
                    is UploadProgressState.Idle -> _uiState.value = UploadUiState.Idle
                    is UploadProgressState.Progress -> _uiState.value = UploadUiState.Uploading(
                        progressPercent = state.percentage,
                        bytesUploaded = state.bytesUploaded,
                        totalBytes = state.totalBytes,
                        fileName = fileName
                    )
                    is UploadProgressState.Success -> _uiState.value = UploadUiState.Success(state.response)
                    is UploadProgressState.Error -> _uiState.value = UploadUiState.Error(state.message)
                }
            }
        }
    }

    fun retryLastUpload() {
        lastUploadTask?.let { task ->
            startUpload(
                task.bucketType,
                task.fileBytes,
                task.fileName,
                task.mimeType,
                task.appId,
                task.screenshotIndex,
                task.oldFilePath
            )
        } ?: run {
            _uiState.value = UploadUiState.Error("No previous upload task available to retry")
        }
    }

    fun cancelUpload() {
        activeJob?.cancel()
        activeJob = null
        _uiState.value = UploadUiState.Idle
    }

    fun resetState() {
        _uiState.value = UploadUiState.Idle
    }
}
