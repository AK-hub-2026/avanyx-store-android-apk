package com.avanyx.store.firebase

import android.app.Activity
import android.content.Context
import android.util.Log
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.auth.AuthResult
import com.google.firebase.auth.FacebookAuthProvider
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthException
import com.google.firebase.auth.FirebaseAuthWebException
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

class FirebaseAuthManager {
    private val TAG = "FirebaseAuthManager"

    val auth: FirebaseAuth
        get() = FirebaseAuth.getInstance()

    private val _currentUserState = MutableStateFlow<FirebaseUser?>(try { auth.currentUser } catch (e: Throwable) { null })
    val currentUserState: StateFlow<FirebaseUser?> = _currentUserState.asStateFlow()

    init {
        try {
            auth.addAuthStateListener { firebaseAuth ->
                _currentUserState.value = try { firebaseAuth.currentUser } catch (e: Throwable) { null }
                Log.d(TAG, "Auth state changed. User: ${firebaseAuth.currentUser?.uid}")
            }
        } catch (e: Throwable) {
            Log.e(TAG, "Failed adding AuthStateListener", e)
        }
    }

    val currentUser: FirebaseUser?
        get() = try { auth.currentUser } catch (e: Throwable) { null }

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

    // 3. Google Sign-In via Credential Manager & Google Identity Services
    suspend fun signInWithGoogle(context: Context, webClientId: String = "754931220482-uelrmk4f4vmeeldpikq5doqg4hrq8mv8.apps.googleusercontent.com"): Result<FirebaseUser> {
        Log.d(TAG, "=== RUNTIME GOOGLE SIGN-IN DEBUG START ===")
        return try {
            // Step 1: CredentialManager request
            Log.d(TAG, "[DEBUG_LOG_1] Initializing CredentialManager request with webClientId: $webClientId")
            val credentialManager = CredentialManager.create(context)
            val googleIdOption = GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(false)
                .setServerClientId(webClientId)
                .setAutoSelectEnabled(false)
                .build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build()

            // Step 2: Google account selection
            Log.d(TAG, "[DEBUG_LOG_2] Prompting user for Google account selection via CredentialManager...")
            val result = credentialManager.getCredential(context, request)
            Log.d(TAG, "[DEBUG_LOG_2] Account selection completed. Credential type: ${result.credential.type}")
            val credential = result.credential

            // Step 3: Google ID Token received
            if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                val idToken = googleIdTokenCredential.idToken
                Log.d(TAG, "[DEBUG_LOG_3] Google ID Token received successfully! Length: ${idToken.length}, Account ID: ${googleIdTokenCredential.id}, DisplayName: ${googleIdTokenCredential.displayName}")

                // Step 4: GoogleAuthProvider.getCredential()
                Log.d(TAG, "[DEBUG_LOG_4] Creating Firebase GoogleAuthProvider credential using ID token...")
                val authCredential = GoogleAuthProvider.getCredential(idToken, null)
                Log.d(TAG, "[DEBUG_LOG_4] AuthCredential generated: providerId=${authCredential.provider}, signInMethod=${authCredential.signInMethod}")

                // Step 5: Firebase signInWithCredential()
                Log.d(TAG, "[DEBUG_LOG_5] Calling FirebaseAuth.signInWithCredential()...")
                val authResult = auth.signInWithCredential(authCredential).await()
                val user = authResult.user ?: throw Exception("Firebase user is null after signInWithCredential")
                Log.d(TAG, "[DEBUG_LOG_5] Firebase signInWithCredential() succeeded! User UID: ${user.uid}, Email: ${user.email}")
                Log.d(TAG, "=== RUNTIME GOOGLE SIGN-IN DEBUG SUCCESS ===")
                Result.success(user)
            } else {
                val errorMsg = "Received unexpected credential type from Credential Manager: ${credential.type}"
                Log.e(TAG, "[DEBUG_LOG_6] Error: $errorMsg")
                throw Exception(errorMsg)
            }
        } catch (e: Exception) {
            Log.e(TAG, "=== RUNTIME GOOGLE SIGN-IN FAILURE DETECTED ===")

            // Step 6: Exception identification
            val exceptionType = when (e) {
                is FirebaseAuthException -> "FirebaseAuthException"
                is GetCredentialException -> "GetCredentialException (${e.type})"
                else -> e.javaClass.simpleName
            }
            Log.e(TAG, "[DEBUG_LOG_6] Firebase/Runtime Exception Type: $exceptionType")

            // Step 7: Stacktrace
            Log.e(TAG, "[DEBUG_LOG_7] Complete Stacktrace:\n${Log.getStackTraceString(e)}")

            // Step 8: Error Code
            val errorCode = when (e) {
                is FirebaseAuthException -> e.errorCode
                is GetCredentialException -> e.type
                else -> "N/A"
            }
            Log.e(TAG, "[DEBUG_LOG_8] Error Code: $errorCode")

            // Step 9: Error Message
            Log.e(TAG, "[DEBUG_LOG_9] Error Message: ${e.message ?: "No error message"}")
            Log.e(TAG, "[DEBUG_LOG_9] Localized Message: ${e.localizedMessage ?: "No localized message"}")
            Log.e(TAG, "[DEBUG_LOG_9] Cause: ${e.cause?.toString() ?: "No underlying cause"}")

            val userFriendlyMessage = when {
                e is NoCredentialException || (e is GetCredentialException && e.type.contains("TYPE_NO_CREDENTIAL")) -> {
                    Log.d(TAG, "[DEBUG_LOG_FALLBACK] No credential on device. Checking for Activity context to trigger OAuthProvider fallback...")
                    val activity = context as? Activity
                    if (activity != null) {
                        try {
                            Log.d(TAG, "[DEBUG_LOG_FALLBACK] Triggering OAuthProvider.newBuilder(\"google.com\") web browser flow...")
                            val provider = OAuthProvider.newBuilder("google.com")
                            val pendingResultTask = auth.pendingAuthResult
                            val authResult: AuthResult = if (pendingResultTask != null) {
                                pendingResultTask.await()
                            } else {
                                auth.startActivityForSignInWithProvider(activity, provider.build()).await()
                            }
                            val user = authResult.user ?: throw Exception("OAuthProvider Google sign-in returned null user")
                            Log.d(TAG, "[DEBUG_LOG_FALLBACK] OAuthProvider Google sign-in succeeded! UID: ${user.uid}")
                            return Result.success(user)
                        } catch (fallbackException: Exception) {
                            if (fallbackException is FirebaseAuthWebException) {
                                Log.w(TAG, "[DEBUG_LOG_FALLBACK] OAuthProvider web operation was canceled by user")
                                "Google Sign-In web operation was canceled."
                            } else {
                                Log.e(TAG, "[DEBUG_LOG_FALLBACK] OAuthProvider fallback failed", fallbackException)
                                fallbackException.message ?: "Google Sign-In failed"
                            }
                        }
                    } else {
                        "No Google Account found on this device. Please sign in to a Google account in Settings, or try again."
                    }
                }
                e is GetCredentialException ->
                    "Google Sign-In failed (${e.type}): ${e.message ?: "No credentials available"}"
                e is FirebaseAuthWebException ->
                    "Google Sign-In web operation was canceled."
                else -> e.message ?: "Google Sign-In failed"
            }

            Result.failure(Exception(userFriendlyMessage, e))
        }
    }

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
            val msg = if (e is FirebaseAuthWebException) "GitHub login was canceled by the user." else (e.message ?: "GitHub login failed")
            Result.failure(Exception(msg, e))
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
            val msg = if (e is FirebaseAuthWebException) "Facebook login was canceled by the user." else (e.message ?: "Facebook login failed")
            Result.failure(Exception(msg, e))
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
        try {
            auth.signOut()
        } catch (e: Throwable) {
            Log.e(TAG, "signOut failed", e)
        }
    }
}

private fun String?.isNull_orEmpty(): Boolean = this == null || this.trim().isEmpty()
