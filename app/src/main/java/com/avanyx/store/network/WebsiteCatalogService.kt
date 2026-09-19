package com.avanyx.store.network

import android.util.Log
import com.avanyx.store.data.database.entity.StoreAppEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * AVANYX Store Website Catalog API Service (Secondary Catalog Source).
 * Fetches the published app catalog directly from the AVANYX Store web platform/CDN.
 */
class WebsiteCatalogService(
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(6, TimeUnit.SECONDS)
        .readTimeout(8, TimeUnit.SECONDS)
        .build()
) {
    companion object {
        private const val TAG = "WebsiteCatalogService"

        private const val FIRESTORE_REST_QUERY_URL =
            "https://firestore.googleapis.com/v1/projects/avanyx-store/databases/(default)/documents:runQuery"

        // Production web endpoints for catalog synchronization
        private val CATALOG_ENDPOINTS = listOf(
            "https://store-avanyx.pages.dev/api/apps",
            "https://store-avanyx.pages.dev/apps.json",
            "https://raw.githubusercontent.com/AK-hub-2026/avanyx-store-web/main/public/apps.json",
            "https://raw.githubusercontent.com/AK-hub-2026/avanyx-store-web/main/apps.json",
            "https://avanyx.store/api/apps"
        )
    }

    /**
     * Attempts to fetch the published catalog from Firestore REST query and website endpoints.
     */
    suspend fun fetchCatalogFromWebsite(): Result<List<StoreAppEntity>> = withContext(Dispatchers.IO) {
        // 1. First attempt: Direct Firestore REST runQuery
        try {
            Log.d(TAG, "Attempting direct Firestore REST runQuery...")
            val queryBody = """
                {
                    "structuredQuery": {
                        "from": [{"collectionId": "apps"}],
                        "where": {
                            "fieldFilter": {
                                "field": {"fieldPath": "status"},
                                "op": "EQUAL",
                                "value": {"stringValue": "PUBLISHED"}
                            }
                        }
                    }
                }
            """.trimIndent()

            val request = Request.Builder()
                .url(FIRESTORE_REST_QUERY_URL)
                .post(queryBody.toRequestBody("application/json".toMediaTypeOrNull()))
                .header("User-Agent", "AVANYX-Store-Android/3.1")
                .header("Accept", "application/json")
                .build()

            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    val bodyString = response.body?.string()
                    if (!bodyString.isNullOrBlank()) {
                        val parsed = parseFirestoreRestJson(bodyString)
                        if (parsed.isNotEmpty()) {
                            Log.i(TAG, "[FIRESTORE_REST_SUCCESS] Successfully fetched ${parsed.size} apps via Firestore REST")
                            return@withContext Result.success(parsed)
                        }
                    }
                } else {
                    Log.w(TAG, "Firestore REST runQuery responded with HTTP ${response.code}")
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Firestore REST runQuery failed: ${e.message}")
        }

        // 2. Secondary fallback: Web catalog static/API endpoints
        var lastException: Exception? = null
        for (endpoint in CATALOG_ENDPOINTS) {
            try {
                Log.d(TAG, "Attempting catalog fetch from website endpoint: $endpoint")
                val request = Request.Builder()
                    .url(endpoint)
                    .header("User-Agent", "AVANYX-Store-Android/3.1")
                    .header("Accept", "application/json")
                    .build()

                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        Log.w(TAG, "Endpoint $endpoint responded with HTTP ${response.code}")
                        return@use
                    }

                    val bodyString = response.body?.string()
                    if (bodyString.isNullOrBlank()) {
                        Log.w(TAG, "Endpoint $endpoint returned empty body")
                        return@use
                    }

                    val parsedApps = parseCatalogJson(bodyString)
                    if (parsedApps.isNotEmpty()) {
                        Log.i(TAG, "[WEBSITE_SUCCESS] Successfully retrieved ${parsedApps.size} apps from $endpoint")
                        return@withContext Result.success(parsedApps)
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed connecting to $endpoint: ${e.message}")
                lastException = e
            }
        }

        Result.failure(lastException ?: Exception("All AVANYX catalog endpoints unreachable"))
    }

    /**
     * Parses Firestore REST API runQuery response JSON array.
     */
    fun parseFirestoreRestJson(jsonString: String): List<StoreAppEntity> {
        val results = mutableListOf<StoreAppEntity>()
        try {
            val jsonArray = JSONArray(jsonString.trim())
            for (i in 0 until jsonArray.length()) {
                val item = jsonArray.optJSONObject(i) ?: continue
                val doc = item.optJSONObject("document") ?: continue
                val docName = doc.optString("name", "")
                val docId = docName.substringAfterLast("/").trim()
                val fields = doc.optJSONObject("fields") ?: continue

                fun getStringField(vararg keys: String): String {
                    for (k in keys) {
                        val f = fields.optJSONObject(k)
                        if (f != null && f.has("stringValue")) {
                            val v = f.optString("stringValue", "").trim()
                            if (v.isNotBlank()) return v
                        }
                    }
                    return ""
                }

                fun getBooleanField(key: String, def: Boolean = false): Boolean {
                    val f = fields.optJSONObject(key)
                    return f?.optBoolean("booleanValue", def) ?: def
                }

                fun getDoubleField(key: String, def: Double = 4.5): Double {
                    val f = fields.optJSONObject(key) ?: return def
                    return when {
                        f.has("doubleValue") -> f.optDouble("doubleValue", def)
                        f.has("integerValue") -> f.optDouble("integerValue", def)
                        f.has("stringValue") -> f.optString("stringValue", "$def").toDoubleOrNull() ?: def
                        else -> def
                    }
                }

                fun getLongField(key: String, def: Long = 1L): Long {
                    val f = fields.optJSONObject(key) ?: return def
                    return when {
                        f.has("integerValue") -> f.optLong("integerValue", def)
                        f.has("stringValue") -> f.optString("stringValue", "$def").toLongOrNull() ?: def
                        else -> def
                    }
                }

                fun getStringArrayField(key: String): List<String> {
                    val f = fields.optJSONObject(key) ?: return emptyList()
                    val arrObj = f.optJSONObject("arrayValue") ?: return emptyList()
                    val vals = arrObj.optJSONArray("values") ?: return emptyList()
                    val list = mutableListOf<String>()
                    for (j in 0 until vals.length()) {
                        val vObj = vals.optJSONObject(j) ?: continue
                        val s = vObj.optString("stringValue", "").trim()
                        if (s.isNotBlank()) list.add(s)
                    }
                    return list
                }

                val status = getStringField("status", "appStatus").ifBlank { "PUBLISHED" }.uppercase()
                if (status in listOf("REJECTED", "DRAFT", "SUSPENDED", "DELETED", "INACTIVE", "UNPUBLISHED")) {
                    continue
                }

                val name = getStringField("title", "name", "appName").ifBlank { docId }
                val appId = getStringField("id", "appId").ifBlank { docId }
                val developer = getStringField("developer", "developerName", "devName", "author").ifBlank { "AVANYX" }
                val category = getStringField("category", "categoryName").ifBlank { "Tools" }
                val categoryId = getStringField("categoryId", "category_id").lowercase()
                val isGame = getBooleanField("isGame") || getBooleanField("game") || category.equals("Action", ignoreCase = true) || category.equals("Racing", ignoreCase = true)
                val isFeatured = getBooleanField("isFeatured") || getBooleanField("featured")
                val iconText = getStringField("iconText", "icon_text").ifBlank { name.take(3).uppercase() }
                val iconBgColorHex = getStringField("iconBgColorHex", "icon_bg_color_hex").ifBlank { "#6750A4" }
                val iconUrl = getStringField("iconUrl", "icon_url", "logoUrl", "logo", "icon")
                val logoUrl = getStringField("logoUrl", "logo_url", "logo", "iconUrl").ifBlank { iconUrl }
                val screenshots = getStringArrayField("screenshots")
                val screenshotsJson = if (screenshots.isNotEmpty()) {
                    com.avanyx.store.data.database.Converters().fromListToString(screenshots)
                } else ""
                val rawSize = getStringField("apkSize", "sizeMb", "size")
                val sizeMb = when {
                    rawSize.isNotBlank() -> if (rawSize.all { it.isDigit() }) "$rawSize MB" else rawSize
                    else -> "${getLongField("sizeMb", 25)} MB"
                }
                val rating = getDoubleField("rating", 4.8)
                val packageName = getStringField("packageName", "package_name").ifBlank { "com.avanyx.$appId" }
                val downloadUrl = getStringField("downloadUrl", "download_url", "apkUrl")
                val checksumSha256 = getStringField("checksumSha256", "sha256Checksum", "sha256")
                val version = getStringField("version", "versionName").ifBlank { "1.0.0" }
                val versionCode = getLongField("versionCode", 1L)
                val fullDescription = getStringField("fullDescription", "description").ifBlank {
                    "Official application on AVANYX Store."
                }
                val features = getStringArrayField("features")
                val featuresJson = if (features.isNotEmpty()) {
                    com.avanyx.store.data.database.Converters().fromListToString(features)
                } else ""

                val finalCatId = when {
                    categoryId.isNotBlank() -> categoryId
                    category.contains("Tools", ignoreCase = true) -> "tools"
                    category.contains("Entertainment", ignoreCase = true) -> "entertainment"
                    category.contains("Action", ignoreCase = true) -> "action"
                    category.contains("Racing", ignoreCase = true) -> "racing"
                    category.contains("Productivity", ignoreCase = true) -> "productivity"
                    category.contains("Education", ignoreCase = true) -> "education"
                    category.contains("Security", ignoreCase = true) -> "security"
                    isGame -> "games"
                    else -> "tools"
                }

                results.add(
                    StoreAppEntity(
                        id = appId,
                        name = name,
                        developer = developer,
                        category = category,
                        categoryId = finalCatId,
                        iconText = iconText,
                        iconBgColorHex = iconBgColorHex,
                        iconUrl = iconUrl,
                        logoUrl = logoUrl,
                        screenshotsJson = screenshotsJson,
                        sizeMb = sizeMb,
                        rating = rating,
                        isGame = isGame,
                        isFeatured = isFeatured,
                        packageName = packageName,
                        downloadUrl = downloadUrl,
                        checksumSha256 = checksumSha256,
                        version = version,
                        versionCode = versionCode,
                        fullDescription = fullDescription,
                        featuresJson = featuresJson
                    )
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed parsing Firestore REST JSON", e)
        }
        return results
    }

    /**
     * Parses various valid JSON formats (array or object containing 'apps', 'data', 'catalog').
     */
    fun parseCatalogJson(jsonString: String): List<StoreAppEntity> {
        val results = mutableListOf<StoreAppEntity>()
        try {
            val trimmed = jsonString.trim()
            val jsonArray: JSONArray = when {
                trimmed.startsWith("[") -> JSONArray(trimmed)
                trimmed.startsWith("{") -> {
                    val obj = JSONObject(trimmed)
                    when {
                        obj.has("apps") -> obj.getJSONArray("apps")
                        obj.has("data") -> obj.getJSONArray("data")
                        obj.has("catalog") -> obj.getJSONArray("catalog")
                        obj.has("items") -> obj.getJSONArray("items")
                        else -> JSONArray()
                    }
                }
                else -> JSONArray()
            }

            for (i in 0 until jsonArray.length()) {
                val item = jsonArray.optJSONObject(i) ?: continue
                val entity = parseJsonAppItem(item)
                if (entity != null) {
                    results.add(entity)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing website catalog JSON", e)
        }
        return results
    }

    private fun parseJsonAppItem(obj: JSONObject): StoreAppEntity? {
        val name = obj.optString("name", obj.optString("appName", "")).trim()
        val id = obj.optString("id", obj.optString("appId", "")).trim().ifBlank {
            name.lowercase().replace("[^a-z0-9_]".toRegex(), "_").trim('_')
        }

        if (name.isBlank() && id.isBlank()) return null

        val status = obj.optString("status", obj.optString("appStatus", "PUBLISHED")).trim().uppercase()
        if (status in listOf("REJECTED", "DRAFT", "SUSPENDED", "DELETED", "INACTIVE", "UNPUBLISHED")) {
            return null
        }

        val developer = obj.optString("developer", obj.optString("devName", obj.optString("author", "AVANYX"))).trim()
        val category = obj.optString("category", obj.optString("categoryName", "Utilities")).trim()
        val categoryId = obj.optString("categoryId", obj.optString("category_id", "")).trim().lowercase()

        val isGame = obj.optBoolean("isGame", obj.optBoolean("is_game", obj.optBoolean("game", false)))
        val isFeatured = obj.optBoolean("isFeatured", obj.optBoolean("is_featured", obj.optBoolean("featured", false)))

        val finalCatId = when {
            categoryId.isNotBlank() -> categoryId
            category.contains("Tools", ignoreCase = true) || category.contains("Utility", ignoreCase = true) -> "tools"
            category.contains("Productivity", ignoreCase = true) -> "productivity"
            category.contains("Entertainment", ignoreCase = true) -> "entertainment"
            category.contains("Education", ignoreCase = true) -> "education"
            category.contains("Casual", ignoreCase = true) -> "casual"
            category.contains("Action", ignoreCase = true) -> "action"
            isGame -> "casual"
            else -> "tools"
        }

        val iconText = obj.optString("iconText", obj.optString("icon_text", name.take(3).uppercase()))
        val iconBgColorHex = obj.optString("iconBgColorHex", obj.optString("icon_bg_color_hex", "#6750A4"))
        val iconUrl = obj.optString("iconUrl", obj.optString("icon_url", obj.optString("logoUrl", obj.optString("logo", obj.optString("icon", "")))))
        val logoUrl = obj.optString("logoUrl", obj.optString("logo_url", obj.optString("logo", obj.optString("iconUrl", iconUrl))))
        
        val screenshotsArray = obj.optJSONArray("screenshots")
        val screenshotsList = mutableListOf<String>()
        if (screenshotsArray != null) {
            for (s in 0 until screenshotsArray.length()) {
                val url = screenshotsArray.optString(s)
                if (url.isNotBlank()) screenshotsList.add(url)
            }
        }
        val screenshotsJson = if (screenshotsList.isNotEmpty()) {
            com.avanyx.store.data.database.Converters().fromListToString(screenshotsList)
        } else {
            obj.optString("screenshots", "")
        }

        val rawSize = obj.optString("sizeMb", obj.optString("size", "25 MB"))
        val sizeMb = if (rawSize.all { it.isDigit() }) "$rawSize MB" else rawSize

        val rating = obj.optDouble("rating", 4.9)
        val packageName = obj.optString("packageName", obj.optString("package_name", "com.avanyx.$id"))
        val downloadUrl = obj.optString("downloadUrl", obj.optString("download_url", obj.optString("apkUrl", "")))
        val checksumSha256 = obj.optString("checksumSha256", obj.optString("checksum_sha256", ""))
        val version = obj.optString("version", obj.optString("versionName", "1.0.0"))
        val versionCode = obj.optLong("versionCode", obj.optLong("version_code", 1L))
        val changelog = obj.optString("changelog", "")
        val developerUid = obj.optString("developerUid", obj.optString("developer_uid", obj.optString("devUid", "")))
        val fullDescription = obj.optString("fullDescription", obj.optString("description", "Official application on AVANYX Store."))

        return StoreAppEntity(
            id = id.ifBlank { "app_${System.currentTimeMillis()}" },
            name = name.ifBlank { "AVANYX Application" },
            developer = developer.ifBlank { "AVANYX" },
            developerUid = developerUid,
            category = category.ifBlank { "Tools" },
            categoryId = finalCatId,
            iconText = iconText.ifBlank { if (name.length >= 2) name.take(2).uppercase() else "APP" },
            iconBgColorHex = iconBgColorHex.ifBlank { "#6750A4" },
            iconUrl = iconUrl,
            logoUrl = logoUrl,
            screenshotsJson = screenshotsJson,
            sizeMb = sizeMb.ifBlank { "25 MB" },
            rating = if (rating > 0.0) rating else 4.9,
            isGame = isGame,
            isFeatured = isFeatured,
            packageName = packageName.ifBlank { "com.avanyx.$id" },
            downloadUrl = downloadUrl,
            checksumSha256 = checksumSha256,
            version = version.ifBlank { "1.0.0" },
            versionCode = if (versionCode > 0L) versionCode else 1L,
            changelog = changelog,
            fullDescription = fullDescription
        )
    }
}
