package com.avanyx.store.firebase

import android.app.Activity
import android.util.Log
import com.google.firebase.auth.AuthResult
import com.google.firebase.auth.FacebookAuthProvider
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GithubAuthProvider
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.OAuthProvider
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthOptions
import com.google.firebase.auth.PhoneAuthProvider
import com.google.firebase.auth.UserProfileChangeRequest
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.util.concurrent.TimeUnit

class FirebaseAuthManager(
    val auth: FirebaseAuth = FirebaseAuth.getInstance()
) {
    private val TAG = "FirebaseAuthManager"

    private val _currentUserState = MutableStateFlow<FirebaseUser?>(auth.currentUser)
    val currentUserState: StateFlow<FirebaseUser?> = _currentUserState.asStateFlow()

    init {
        auth.addAuthStateListener { firebaseAuth ->
            _currentUserState.value = firebaseAuth.currentUser
            Log.d(TAG, "Auth state changed. User: ${firebaseAuth.currentUser?.uid}")
        }
    }

    val currentUser: FirebaseUser?
        get() = auth.currentUser

    // 1. Email + Password Sign Up
    suspend fun signUpWithEmail(email: String, pass: String, displayName: String? = null): Result<FirebaseUser> {
        return try {
            val result = auth.createUserWithEmailAndPassword(email, pass).await()
            val user = result.user ?: throw Exception("User creation failed")
            
            if (!displayName.isNull_orEmpty()) {
                val profileUpdates = UserProfileChangeRequest.Builder()
                    .setDisplayName(displayName)
                    .build()
                user.updateProfile(profileUpdates).await()
            }
            Result.success(user)
        } catch (e: Exception) {
            Log.e(TAG, "signUpWithEmail failed", e)
            Result.failure(e)
        }
    }

    // Email + Password Sign In
    suspend fun signInWithEmail(email: String, pass: String): Result<FirebaseUser> {
        return try {
            val result = auth.signInWithEmailAndPassword(email, pass).await()
            val user = result.user ?: throw Exception("Authentication failed")
            Result.success(user)
        } catch (e: Exception) {
            Log.e(TAG, "signInWithEmail failed", e)
            Result.failure(e)
        }
    }

    // 2. Phone Verification & OTP
    fun sendPhoneOtp(
        phoneNumber: String,
        activity: Activity,
        callbacks: PhoneAuthProvider.OnVerificationStateChangedCallbacks
    ) {
        val options = PhoneAuthOptions.newBuilder(auth)
            .setPhoneNumber(phoneNumber)
            .setTimeout(60L, TimeUnit.SECONDS)
            .setActivity(activity)
            .setCallbacks(callbacks)
            .build()
        PhoneAuthProvider.verifyPhoneNumber(options)
    }

    suspend fun signInWithPhoneCredential(credential: PhoneAuthCredential): Result<FirebaseUser> {
        return try {
            val result = auth.signInWithCredential(credential).await()
            val user = result.user ?: throw Exception("Phone authentication failed")
            Result.success(user)
        } catch (e: Exception) {
            Log.e(TAG, "signInWithPhoneCredential failed", e)
            Result.failure(e)
        }
    }

    // 3. Google Sign-In with ID Token
    suspend fun signInWithGoogleIdToken(idToken: String): Result<FirebaseUser> {
        return try {
            val credential = GoogleAuthProvider.getCredential(idToken, null)
            val result = auth.signInWithCredential(credential).await()
            val user = result.user ?: throw Exception("Google Sign-In failed")
            Result.success(user)
        } catch (e: Exception) {
            Log.e(TAG, "signInWithGoogleIdToken failed", e)
            Result.failure(e)
        }
    }

    // 4. GitHub Login via OAuth Provider
    suspend fun signInWithGitHub(activity: Activity): Result<FirebaseUser> {
        return try {
            val provider = OAuthProvider.newBuilder("github.com")
            val pendingResultTask = auth.pendingAuthResult
            val authResult: AuthResult = if (pendingResultTask != null) {
                pendingResultTask.await()
            } else {
                auth.startActivityForSignInWithProvider(activity, provider.build()).await()
            }
            val user = authResult.user ?: throw Exception("GitHub login failed")
            Result.success(user)
        } catch (e: Exception) {
            Log.e(TAG, "signInWithGitHub failed", e)
            Result.failure(e)
        }
    }

    // 5. Facebook Login via OAuth Provider
    suspend fun signInWithFacebook(activity: Activity): Result<FirebaseUser> {
        return try {
            val provider = OAuthProvider.newBuilder("facebook.com")
            val pendingResultTask = auth.pendingAuthResult
            val authResult: AuthResult = if (pendingResultTask != null) {
                pendingResultTask.await()
            } else {
                auth.startActivityForSignInWithProvider(activity, provider.build()).await()
            }
            val user = authResult.user ?: throw Exception("Facebook login failed")
            Result.success(user)
        } catch (e: Exception) {
            Log.e(TAG, "signInWithFacebook failed", e)
            Result.failure(e)
        }
    }

    // Forgot Password
    suspend fun sendPasswordResetEmail(email: String): Result<Unit> {
        return try {
            auth.sendPasswordResetEmail(email).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "sendPasswordResetEmail failed", e)
            Result.failure(e)
        }
    }

    // Send Email Verification
    suspend fun sendEmailVerification(): Result<Unit> {
        return try {
            val user = auth.currentUser ?: throw Exception("No authenticated user")
            user.sendEmailVerification().await()
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "sendEmailVerification failed", e)
            Result.failure(e)
        }
    }

    // Update User Profile
    suspend fun updateUserProfile(displayName: String?, photoUrl: String?): Result<Unit> {
        return try {
            val user = auth.currentUser ?: throw Exception("No authenticated user")
            val builder = UserProfileChangeRequest.Builder()
            if (displayName != null) builder.setDisplayName(displayName)
            if (photoUrl != null) builder.setPhotoUri(android.net.Uri.parse(photoUrl))
            user.updateProfile(builder.build()).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e(TAG, "updateUserProfile failed", e)
            Result.failure(e)
        }
    }

    // Logout
    fun signOut() {
        auth.signOut()
    }
}

private fun String?.isNull_orEmpty(): Boolean = this == null || this.trim().isEmpty()
