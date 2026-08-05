package com.avanyx.store.network.model

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class UserAuthMeResponse(
    @Json(name = "uid") val uid: String,
    @Json(name = "displayName") val displayName: String?,
    @Json(name = "email") val email: String?,
    @Json(name = "role") val role: String,
    @Json(name = "developerStatus") val developerStatus: String?,
    @Json(name = "accountStatus") val accountStatus: String,
    @Json(name = "developerId") val developerId: String?,
    @Json(name = "permissions") val permissions: List<String> = emptyList()
)

@JsonClass(generateAdapter = true)
data class VerifyTokenRequest(
    @Json(name = "idToken") val idToken: String
)

@JsonClass(generateAdapter = true)
data class VerifyTokenResponse(
    @Json(name = "verified") val verified: Boolean,
    @Json(name = "uid") val uid: String,
    @Json(name = "role") val role: String,
    @Json(name = "permissions") val permissions: List<String> = emptyList(),
    @Json(name = "email") val email: String? = null,
    @Json(name = "displayName") val displayName: String? = null,
    @Json(name = "accountStatus") val accountStatus: String = "ACTIVE"
)

@JsonClass(generateAdapter = true)
data class BackendBaseResponse<T>(
    @Json(name = "success") val success: Boolean,
    @Json(name = "message") val message: String?,
    @Json(name = "timestamp") val timestamp: Long = System.currentTimeMillis(),
    @Json(name = "data") val data: T? = null
)

@JsonClass(generateAdapter = true)
data class StorageUploadResponse(
    @Json(name = "bucket") val bucket: String,
    @Json(name = "fileName") val fileName: String,
    @Json(name = "publicUrl") val publicUrl: String,
    @Json(name = "sizeBytes") val sizeBytes: Long = 0L,
    @Json(name = "mimeType") val mimeType: String? = null,
    @Json(name = "uploadedByUid") val uploadedByUid: String? = null,
    @Json(name = "appId") val appId: String? = null
)

@JsonClass(generateAdapter = true)
data class DeleteStorageRequest(
    @Json(name = "bucketName") val bucketName: String,
    @Json(name = "filePath") val filePath: String
)

@JsonClass(generateAdapter = true)
data class ApiErrorResponse(
    @Json(name = "success") val success: Boolean = false,
    @Json(name = "code") val code: String,
    @Json(name = "message") val message: String,
    @Json(name = "timestamp") val timestamp: Long = System.currentTimeMillis()
)
