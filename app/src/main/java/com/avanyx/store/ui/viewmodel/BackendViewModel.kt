package com.avanyx.store.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.avanyx.store.data.repository.BackendRepository
import com.avanyx.store.network.model.UserAuthMeResponse
import com.avanyx.store.network.model.VerifyTokenResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class BackendUiState {
    object Idle : BackendUiState()
    object Loading : BackendUiState()
    data class AuthMeSuccess(val user: UserAuthMeResponse) : BackendUiState()
    data class TokenVerified(val response: VerifyTokenResponse) : BackendUiState()
    data class Error(val message: String) : BackendUiState()
}

class BackendViewModel(
    private val repository: BackendRepository = BackendRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow<BackendUiState>(BackendUiState.Idle)
    val uiState: StateFlow<BackendUiState> = _uiState.asStateFlow()

    private val _currentToken = MutableStateFlow<String?>(null)
    val currentToken: StateFlow<String?> = _currentToken.asStateFlow()

    fun fetchAuthMe() {
        viewModelScope.launch {
            _uiState.value = BackendUiState.Loading
            val result = repository.getAuthMe()
            result.fold(
                onSuccess = { user ->
                    _uiState.value = BackendUiState.AuthMeSuccess(user)
                },
                onFailure = { error ->
                    _uiState.value = BackendUiState.Error(error.message ?: "Failed loading user credentials from backend")
                }
            )
        }
    }

    fun verifyCurrentToken() {
        viewModelScope.launch {
            _uiState.value = BackendUiState.Loading
            val result = repository.verifyToken()
            result.fold(
                onSuccess = { verifyResponse ->
                    _uiState.value = BackendUiState.TokenVerified(verifyResponse)
                },
                onFailure = { error ->
                    _uiState.value = BackendUiState.Error(error.message ?: "Token verification failed")
                }
            )
        }
    }

    fun refreshToken() {
        viewModelScope.launch {
            val token = repository.getFreshFirebaseIdToken()
            _currentToken.value = token
        }
    }

    fun resetState() {
        _uiState.value = BackendUiState.Idle
    }
}
