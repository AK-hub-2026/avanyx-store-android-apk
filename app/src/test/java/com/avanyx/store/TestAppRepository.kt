package com.avanyx.store

import com.avanyx.store.data.model.Category
import com.avanyx.store.data.model.StoreApp
import com.avanyx.store.data.repository.AppRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf

/**
 * Isolated test repository for Robolectric and Unit tests.
 */
class TestAppRepository(
    private val appsList: List<StoreApp> = emptyList()
) : AppRepository {

    override fun getApps(): Flow<List<StoreApp>> = flowOf(appsList)

    override fun getAppById(id: String): StoreApp? = appsList.find { it.id == id }

    override fun searchApps(query: String): List<StoreApp> {
        if (query.isBlank()) return appsList
        return appsList.filter {
            it.name.contains(query, ignoreCase = true) ||
            it.developer.contains(query, ignoreCase = true) ||
            it.category.contains(query, ignoreCase = true)
        }
    }

    override fun getGames(): List<StoreApp> = appsList.filter { it.isGame }

    override fun getNonGames(): List<StoreApp> = appsList.filter { !it.isGame }

    override fun getFeatured(): List<StoreApp> = appsList.filter { it.isFeatured }

    override fun getCategoriesFlow(): Flow<List<Category>> = flowOf(emptyList())
}
