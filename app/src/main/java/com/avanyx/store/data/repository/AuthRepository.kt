package com.avanyx.store.data.repository

import android.app.Activity
import android.content.Context
import android.util.Log
import com.avanyx.store.firebase.FirebaseAuthManager
import com.avanyx.store.firebase.FirestoreService
import com.avanyx.store.firebase.model.FirestoreUser
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthProvider
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AuthRepository(
    val authManager: FirebaseAuthManager = FirebaseAuthManager(),
    val firestoreService: FirestoreService = FirestoreService()
) {
    private val TAG = "AuthRepository"

    private val _currentUserDoc = MutableStateFlow<FirestoreUser?>(null)
    val currentUserDoc: StateFlow<FirestoreUser?> = _currentUserDoc.asStateFlow()

    val currentFirebaseUser: FirebaseUser?
        get() = authManager.currentUser

    init {
        // Automatically sync Firestore user doc whenever Auth state changes
        authManager.auth.addAuthStateListener { firebaseAuth ->
            val user = firebaseAuth.currentUser
            if (user != null) {
                kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launchSilently {
                    ensureUserDocumentCreated(user, "auto_session")
                }
            } else {
                _currentUserDoc.value = null
            }
        }
    }

    suspend fun ensureUserDocumentCreated(user: FirebaseUser, provider: String = "email"): FirestoreUser {
        val existing = firestoreService.getUser(user.uid).getOrNull()
        val now = System.currentTimeMillis()
        val userDoc = if (existing != null) {
            existing.copy(
                lastLogin = now,
                updatedAt = now,
                displayName = if (existing.displayName.isBlank()) (user.displayName ?: "AVANYX Explorer") else existing.displayName,
                email = if (existing.email.isBlank()) (user.email ?: "") else existing.email,
                phoneNumber = if (existing.phoneNumber.isBlank()) (user.phoneNumber ?: "") else existing.phoneNumber,
                photoUrl = if (existing.photoUrl.isBlank()) (user.photoUrl?.toString() ?: "") else existing.photoUrl
            )
        } else {
            FirestoreUser(
                uid = user.uid,
                displayName = user.displayName ?: "AVANYX Explorer",
                email = user.email ?: "",
                phoneNumber = user.phoneNumber ?: "",
                photoUrl = user.photoUrl?.toString() ?: "",
                provider = provider,
                role = "USER", // Default role: USER
                status = "ACTIVE",
                createdAt = now,
                updatedAt = now,
                lastLogin = now
            )
        }
        firestoreService.createOrUpdateUser(userDoc)
        _currentUserDoc.value = userDoc
        return userDoc
    }

    suspend fun signUpWithEmail(email: String, pass: String, displayName: String): Result<FirestoreUser> {
        val authResult = authManager.signUpWithEmail(email, pass, displayName)
        return authResult.fold(
            onSuccess = { firebaseUser ->
                val userDoc = ensureUserDocumentCreated(firebaseUser, "password")
                Result.success(userDoc)
            },
            onFailure = { Result.failure(it) }
        )
    }

    suspend fun signInWithEmail(email: String, pass: String): Result<FirestoreUser> {
        val authResult = authManager.signInWithEmail(email, pass)
        return authResult.fold(
            onSuccess = { firebaseUser ->
                val userDoc = ensureUserDocumentCreated(firebaseUser, "password")
                Result.success(userDoc)
            },
            onFailure = { Result.failure(it) }
        )
    }

    fun sendPhoneOtp(
        phoneNumber: String,
        activity: Activity,
        callbacks: PhoneAuthProvider.OnVerificationStateChangedCallbacks
    ) {
        authManager.sendPhoneOtp(phoneNumber, activity, callbacks)
    }

    suspend fun signInWithPhoneCredential(credential: PhoneAuthCredential): Result<FirestoreUser> {
        val authResult = authManager.signInWithPhoneCredential(credential)
        return authResult.fold(
            onSuccess = { firebaseUser ->
                val userDoc = ensureUserDocumentCreated(firebaseUser, "phone")
                Result.success(userDoc)
            },
            onFailure = { Result.failure(it) }
        )
    }

    suspend fun signInWithGoogle(context: Context, webClientId: String = "754931220482-uelrmk4f4vmeeldpikq5doqg4hrq8mv8.apps.googleusercontent.com"): Result<FirestoreUser> {
        val authResult = authManager.signInWithGoogle(context, webClientId)
        return authResult.fold(
            onSuccess = { firebaseUser ->
                val userDoc = ensureUserDocumentCreated(firebaseUser, "google.com")
                Result.success(userDoc)
            },
            onFailure = { Result.failure(it) }
        )
    }

    suspend fun signInWithGoogleIdToken(idToken: String): Result<FirestoreUser> {
        val authResult = authManager.signInWithGoogleIdToken(idToken)
        return authResult.fold(
            onSuccess = { firebaseUser ->
                val userDoc = ensureUserDocumentCreated(firebaseUser, "google.com")
                Result.success(userDoc)
            },
            onFailure = { Result.failure(it) }
        )
    }

    suspend fun signInWithGitHub(activity: Activity): Result<FirestoreUser> {
        val authResult = authManager.signInWithGitHub(activity)
        return authResult.fold(
            onSuccess = { firebaseUser ->
                val userDoc = ensureUserDocumentCreated(firebaseUser, "github.com")
                Result.success(userDoc)
            },
            onFailure = { Result.failure(it) }
        )
    }

    suspend fun signInWithFacebook(activity: Activity): Result<FirestoreUser> {
        val authResult = authManager.signInWithFacebook(activity)
        return authResult.fold(
            onSuccess = { firebaseUser ->
                val userDoc = ensureUserDocumentCreated(firebaseUser, "facebook.com")
                Result.success(userDoc)
            },
            onFailure = { Result.failure(it) }
        )
    }

    suspend fun sendPasswordResetEmail(email: String): Result<Unit> {
        return authManager.sendPasswordResetEmail(email)
    }

    suspend fun sendEmailVerification(): Result<Unit> {
        return authManager.sendEmailVerification()
    }

    suspend fun updateUserProfile(displayName: String?, photoUrl: String?): Result<Unit> {
        val updateRes = authManager.updateUserProfile(displayName, photoUrl)
        if (updateRes.isSuccess) {
            val current = currentFirebaseUser
            if (current != null) {
                val updates = mutableMapOf<String, Any>()
                if (displayName != null) updates["displayName"] = displayName
                if (photoUrl != null) updates["photoUrl"] = photoUrl
                updates["updatedAt"] = System.currentTimeMillis()
                firestoreService.updateUserFields(current.uid, updates)
                _currentUserDoc.value = firestoreService.getUser(current.uid).getOrNull()
            }
        }
        return updateRes
    }

    suspend fun updateUserRole(newRole: String): Result<Unit> {
        val current = currentFirebaseUser ?: return Result.failure(Exception("Not logged in"))
        val updates = mapOf(
            "role" to newRole,
            "updatedAt" to System.currentTimeMillis()
        )
        val res = firestoreService.updateUserFields(current.uid, updates)
        if (res.isSuccess) {
            _currentUserDoc.value = firestoreService.getUser(current.uid).getOrNull()
        }
        return res
    }

    fun signOut() {
        authManager.signOut()
        _currentUserDoc.value = null
    }
}

private fun kotlinx.coroutines.CoroutineScope.launchSilently(block: suspend () -> Unit) {
    this.launch(kotlinx.coroutines.Dispatchers.IO) {
        try { block() } catch (e: Exception) { Log.e("AuthRepository", "Error in launchSilently", e) }
    }
}
