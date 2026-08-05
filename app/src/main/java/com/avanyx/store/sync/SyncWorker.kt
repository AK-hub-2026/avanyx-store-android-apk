package com.avanyx.store.sync

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.avanyx.store.data.database.AppDatabase
import com.avanyx.store.data.repository.FirestoreRepository

class SyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    private val TAG = "SyncWorker"

    override suspend fun doWork(): Result {
        Log.d(TAG, "Starting background Room <-> Firestore sync worker...")
        return try {
            val db = AppDatabase.getInstance(applicationContext)
            val repo = FirestoreRepository(appDatabase = db)
            
            // Sync apps from Firestore into local Room
            val res = repo.syncAppsFromFirestore()
            if (res.isSuccess) {
                Log.d(TAG, "Background sync completed successfully! Synced ${res.getOrNull()} items.")
                Result.success()
            } else {
                Log.w(TAG, "Sync failed, retrying...")
                Result.retry()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error running SyncWorker", e)
            Result.failure()
        }
    }
}
