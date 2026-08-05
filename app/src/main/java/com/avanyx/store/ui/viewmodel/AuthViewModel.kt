package com.avanyx.store.ui.viewmodel

import android.app.Activity
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.avanyx.store.data.repository.AuthRepository
import com.avanyx.store.firebase.model.FirestoreUser
import com.google.firebase.FirebaseException
import com.google.firebase.auth.PhoneAuthCredential
import com.google.firebase.auth.PhoneAuthProvider
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

sealed class AuthUiState {
    object Idle : AuthUiState()
    object Loading : AuthUiState()
    data class Success(val message: String) : AuthUiState()
    data class Error(val message: String) : AuthUiState()
    data class CodeSent(val verificationId: String) : AuthUiState()
}

class AuthViewModel(
    val repository: AuthRepository = AuthRepository()
) : ViewModel() {

    private val TAG = "AuthViewModel"

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    val currentUser: StateFlow<FirestoreUser?> = repository.currentUserDoc

    val userRole: StateFlow<String> = repository.currentUserDoc
        .map { it?.role ?: "USER" }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "USER")

    fun signUpWithEmail(email: String, pass: String, displayName: String) {
        if (email.isBlank() || pass.isBlank()) {
            _uiState.value = AuthUiState.Error("Email and Password cannot be empty.")
            return
        }
        _uiState.value = AuthUiState.Loading
        viewModelScope.launch {
            val res = repository.signUpWithEmail(email, pass, displayName)
            res.fold(
                onSuccess = {
                    _uiState.value = AuthUiState.Success("Account created successfully! Document saved to users/${it.uid}")
                },
                onFailure = {
                    _uiState.value = AuthUiState.Error(it.message ?: "Sign up failed")
                }
            )
        }
    }

    fun signInWithEmail(email: String, pass: String) {
        if (email.isBlank() || pass.isBlank()) {
            _uiState.value = AuthUiState.Error("Email and Password cannot be empty.")
            return
        }
        _uiState.value = AuthUiState.Loading
        viewModelScope.launch {
            val res = repository.signInWithEmail(email, pass)
            res.fold(
                onSuccess = {
                    _uiState.value = AuthUiState.Success("Logged in successfully! Welcome ${it.displayName}")
                },
                onFailure = {
                    _uiState.value = AuthUiState.Error(it.message ?: "Login failed")
                }
            )
        }
    }

    fun sendPhoneOtp(phoneNumber: String, activity: Activity) {
        if (phoneNumber.isBlank()) {
            _uiState.value = AuthUiState.Error("Please enter a valid phone number")
            return
        }
        _uiState.value = AuthUiState.Loading
        
        val callbacks = object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
            override fun onVerificationCompleted(credential: PhoneAuthCredential) {
                Log.d(TAG, "Phone verification completed automatically")
                viewModelScope.launch {
                    val res = repository.signInWithPhoneCredential(credential)
                    res.fold(
                        onSuccess = { _uiState.value = AuthUiState.Success("Phone Sign-In successful!") },
                        onFailure = { _uiState.value = AuthUiState.Error(it.message ?: "Phone Auth failed") }
                    )
                }
            }

            override fun onVerificationFailed(e: FirebaseException) {
                Log.e(TAG, "Phone verification failed", e)
                _uiState.value = AuthUiState.Error(e.message ?: "Phone OTP Verification failed")
            }

            override fun onCodeSent(verificationId: String, token: PhoneAuthProvider.ForceResendingToken) {
                Log.d(TAG, "Phone OTP Code Sent")
                _uiState.value = AuthUiState.CodeSent(verificationId)
            }
        }
        
        repository.sendPhoneOtp(phoneNumber, activity, callbacks)
    }

    fun verifyPhoneCode(verificationId: String, code: String) {
        if (verificationId.isBlank() || code.isBlank()) {
            _uiState.value = AuthUiState.Error("Please enter the 6-digit OTP code")
            return
        }
        _uiState.value = AuthUiState.Loading
        val credential = PhoneAuthProvider.getCredential(verificationId, code)
        viewModelScope.launch {
            val res = repository.signInWithPhoneCredential(credential)
            res.fold(
                onSuccess = { _uiState.value = AuthUiState.Success("Phone OTP Verification successful!") },
                onFailure = { _uiState.value = AuthUiState.Error(it.message ?: "Invalid OTP Code") }
            )
        }
    }

    fun signInWithGoogleIdToken(idToken: String) {
        _uiState.value = AuthUiState.Loading
        viewModelScope.launch {
            val res = repository.signInWithGoogleIdToken(idToken)
            res.fold(
                onSuccess = { _uiState.value = AuthUiState.Success("Google Sign-In successful!") },
                onFailure = { _uiState.value = AuthUiState.Error(it.message ?: "Google Sign-In failed") }
            )
        }
    }

    fun signInWithGitHub(activity: Activity) {
        _uiState.value = AuthUiState.Loading
        viewModelScope.launch {
            val res = repository.signInWithGitHub(activity)
            res.fold(
                onSuccess = { _uiState.value = AuthUiState.Success("GitHub Login successful!") },
                onFailure = { _uiState.value = AuthUiState.Error(it.message ?: "GitHub Login failed") }
            )
        }
    }

    fun signInWithFacebook(activity: Activity) {
        _uiState.value = AuthUiState.Loading
        viewModelScope.launch {
            val res = repository.signInWithFacebook(activity)
            res.fold(
                onSuccess = { _uiState.value = AuthUiState.Success("Facebook Login successful!") },
                onFailure = { _uiState.value = AuthUiState.Error(it.message ?: "Facebook Login failed") }
            )
        }
    }

    fun sendPasswordResetEmail(email: String) {
        if (email.isBlank()) {
            _uiState.value = AuthUiState.Error("Please enter your email address")
            return
        }
        _uiState.value = AuthUiState.Loading
        viewModelScope.launch {
            val res = repository.sendPasswordResetEmail(email)
            res.fold(
                onSuccess = { _uiState.value = AuthUiState.Success("Password reset email sent to $email") },
                onFailure = { _uiState.value = AuthUiState.Error(it.message ?: "Failed to send reset email") }
            )
        }
    }

    fun sendEmailVerification() {
        _uiState.value = AuthUiState.Loading
        viewModelScope.launch {
            val res = repository.sendEmailVerification()
            res.fold(
                onSuccess = { _uiState.value = AuthUiState.Success("Verification email sent.") },
                onFailure = { _uiState.value = AuthUiState.Error(it.message ?: "Failed to send verification email") }
            )
        }
    }

    fun updateUserProfile(displayName: String?, photoUrl: String?) {
        _uiState.value = AuthUiState.Loading
        viewModelScope.launch {
            val res = repository.updateUserProfile(displayName, photoUrl)
            res.fold(
                onSuccess = { _uiState.value = AuthUiState.Success("Profile updated successfully!") },
                onFailure = { _uiState.value = AuthUiState.Error(it.message ?: "Profile update failed") }
            )
        }
    }

    fun updateUserRole(role: String) {
        _uiState.value = AuthUiState.Loading
        viewModelScope.launch {
            val res = repository.updateUserRole(role)
            res.fold(
                onSuccess = { _uiState.value = AuthUiState.Success("User role updated to $role in Firestore") },
                onFailure = { _uiState.value = AuthUiState.Error(it.message ?: "Failed to update role") }
            )
        }
    }

    fun signOut() {
        repository.signOut()
        _uiState.value = AuthUiState.Success("Signed out successfully.")
    }

    fun resetUiState() {
        _uiState.value = AuthUiState.Idle
    }
}
