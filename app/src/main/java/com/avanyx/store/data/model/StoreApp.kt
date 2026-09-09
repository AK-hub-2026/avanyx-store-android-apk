package com.avanyx.store.data.model

data class StoreApp(
    val id: String,
    val name: String,
    val developer: String,
    val category: String,
    val iconText: String,
    val iconBgColorHex: String,
    val version: String,
    val versionCode: Long = 1L,
    val changelog: String = "",
    val size: String,
    val shortDescription: String,
    val fullDescription: String,
    val features: List<String>,
    val rating: Double,
    val isGame: Boolean,
    val isFeatured: Boolean = false,
    val packageName: String = "",
    val downloadUrl: String = "",
    val checksumSha256: String = ""
)
