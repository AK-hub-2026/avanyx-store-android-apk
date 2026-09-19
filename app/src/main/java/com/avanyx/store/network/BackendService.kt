package com.avanyx.store.network

import com.avanyx.store.network.model.BackendBaseResponse
import com.avanyx.store.network.model.DeleteStorageRequest
import com.avanyx.store.network.model.StorageUploadResponse
import com.avanyx.store.network.model.UserAuthMeResponse
import com.avanyx.store.network.model.VerifyTokenRequest
import com.avanyx.store.network.model.VerifyTokenResponse
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part

interface BackendService {

    @GET("api/auth/me")
    suspend fun getAuthMe(): Response<BackendBaseResponse<UserAuthMeResponse>>

    @POST("api/auth/verify")
    suspend fun verifyAuthToken(
        @Body request: VerifyTokenRequest
    ): Response<BackendBaseResponse<VerifyTokenResponse>>

    @Multipart
    @POST("api/storage/upload/developer-profile")
    suspend fun uploadDeveloperProfile(
        @Part file: MultipartBody.Part,
        @Part("oldFilePath") oldFilePath: RequestBody? = null
    ): Response<BackendBaseResponse<StorageUploadResponse>>

    @Multipart
    @POST("api/storage/upload/developer-banner")
    suspend fun uploadDeveloperBanner(
        @Part file: MultipartBody.Part,
        @Part("oldFilePath") oldFilePath: RequestBody? = null
    ): Response<BackendBaseResponse<StorageUploadResponse>>

    @Multipart
    @POST("api/storage/upload/app-icon")
    suspend fun uploadAppIcon(
        @Part file: MultipartBody.Part,
        @Part("appId") appId: RequestBody,
        @Part("oldFilePath") oldFilePath: RequestBody? = null
    ): Response<BackendBaseResponse<StorageUploadResponse>>

    @Multipart
    @POST("api/storage/upload/app-banner")
    suspend fun uploadAppBanner(
        @Part file: MultipartBody.Part,
        @Part("appId") appId: RequestBody,
        @Part("oldFilePath") oldFilePath: RequestBody? = null
    ): Response<BackendBaseResponse<StorageUploadResponse>>

    @Multipart
    @POST("api/storage/upload/app-screenshot")
    suspend fun uploadAppScreenshot(
        @Part file: MultipartBody.Part,
        @Part("appId") appId: RequestBody,
        @Part("index") index: RequestBody? = null,
        @Part("oldFilePath") oldFilePath: RequestBody? = null
    ): Response<BackendBaseResponse<StorageUploadResponse>>

    @Multipart
    @POST("api/storage/upload/app-video")
    suspend fun uploadAppVideo(
        @Part file: MultipartBody.Part,
        @Part("appId") appId: RequestBody,
        @Part("oldFilePath") oldFilePath: RequestBody? = null
    ): Response<BackendBaseResponse<StorageUploadResponse>>

    @POST("api/storage/delete")
    suspend fun deleteStorageAsset(
        @Body request: DeleteStorageRequest
    ): Response<BackendBaseResponse<Map<String, Any>>>
}
