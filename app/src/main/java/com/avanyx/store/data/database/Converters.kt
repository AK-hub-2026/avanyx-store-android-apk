package com.avanyx.store.data.database

import androidx.room.TypeConverter
import com.squareup.moshi.Moshi
import com.squareup.moshi.Types
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory

class Converters {

    private val moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()
    private val stringListType = Types.newParameterizedType(List::class.java, String::class.java)
    private val stringListAdapter = moshi.adapter<List<String>>(stringListType)

    @TypeConverter
    fun fromListToString(list: List<String>?): String {
        return if (list.isNullOrEmpty()) "" else stringListAdapter.toJson(list)
    }

    @TypeConverter
    fun toListFromString(value: String?): List<String> {
        if (value.isNullOrBlank()) return emptyList()
        return try {
            stringListAdapter.fromJson(value) ?: emptyList()
        } catch (e: Exception) {
            value.split(",").map { it.trim() }.filter { it.isNotEmpty() }
        }
    }
}
