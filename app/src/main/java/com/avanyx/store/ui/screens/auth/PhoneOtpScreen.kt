package com.avanyx.store.ui.screens.auth

import android.app.Activity
import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Dialpad
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.avanyx.store.ui.viewmodel.AuthUiState
import com.avanyx.store.ui.viewmodel.AuthViewModel
import kotlinx.coroutines.delay

@Composable
fun PhoneOtpScreen(
    authViewModel: AuthViewModel,
    onNavigateToHome: () -> Unit,
    onBackToLogin: () -> Unit,
    onShowMessage: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val uiState by authViewModel.uiState.collectAsState()

    var phoneNumber by remember { mutableStateOf("") }
    var verificationId by remember { mutableStateOf<String?>(null) }
    var otpCode by remember { mutableStateOf("") }

    var timerSeconds by remember { mutableIntStateOf(60) }
    var isTimerRunning by remember { mutableStateOf(false) }

    LaunchedEffect(isTimerRunning, timerSeconds) {
        if (isTimerRunning && timerSeconds > 0) {
            delay(1000)
            timerSeconds--
        } else if (timerSeconds == 0) {
            isTimerRunning = false
        }
    }

    LaunchedEffect(uiState) {
        when (val state = uiState) {
            is AuthUiState.CodeSent -> {
                verificationId = state.verificationId
                isTimerRunning = true
                timerSeconds = 60
                onShowMessage("OTP Code Sent to $phoneNumber")
            }
            is AuthUiState.Success -> {
                onShowMessage(state.message)
                authViewModel.resetUiState()
                onNavigateToHome()
            }
            is AuthUiState.Error -> {
                onShowMessage(state.message)
            }
            else -> {}
        }
    }

    fun requestOtp() {
        if (phoneNumber.isBlank() || phoneNumber.length < 8) {
            onShowMessage("Please enter a valid phone number with country code (e.g., +1234567890)")
            return
        }
        val activity = context as? Activity
        if (activity != null) {
            authViewModel.sendPhoneOtp(phoneNumber.trim(), activity)
        } else {
            // Mock code sent for preview/sandbox environment
            verificationId = "mock_verification_id_123"
            isTimerRunning = true
            timerSeconds = 60
            onShowMessage("OTP verification code sent (Sandbox Mode)")
        }
    }

    fun verifyOtp() {
        val currentVerificationId = verificationId
        if (currentVerificationId.isNullOrBlank()) {
            onShowMessage("Please request an OTP first")
            return
        }
        if (otpCode.trim().length < 6) {
            onShowMessage("Please enter the complete 6-digit OTP code")
            return
        }
        authViewModel.verifyPhoneCode(currentVerificationId, otpCode.trim())
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF0F172A),
                        Color(0xFF1E1B4B),
                        Color(0xFF090D16)
                    )
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            IconButton(onClick = onBackToLogin) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = Color.White
                )
            }

            BoxWithConstraints(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                val containerWidth = if (maxWidth > 600.dp) 480.dp else maxWidth

                Column(
                    modifier = Modifier
                        .widthIn(max = containerWidth)
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "Phone Verification",
                        style = MaterialTheme.typography.headlineMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        ),
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = if (verificationId == null) "Enter your phone number to receive a 6-digit OTP security code"
                        else "Enter the 6-digit code sent to $phoneNumber",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = Color.White.copy(alpha = 0.7f)
                        ),
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(28.dp))

                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("phone_otp_card"),
                        shape = RoundedCornerShape(24.dp),
                        color = Color.White.copy(alpha = 0.07f),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.12f)),
                        tonalElevation = 8.dp
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            if (verificationId == null) {
                                OutlinedTextField(
                                    value = phoneNumber,
                                    onValueChange = { phoneNumber = it },
                                    label = { Text("Phone Number (+1...)", color = Color.White.copy(alpha = 0.7f)) },
                                    leadingIcon = { Icon(Icons.Default.Phone, contentDescription = null, tint = Color(0xFF818CF8)) },
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = Color(0xFF818CF8),
                                        unfocusedBorderColor = Color.White.copy(alpha = 0.2f),
                                        focusedTextColor = Color.White,
                                        unfocusedTextColor = Color.White
                                    ),
                                    shape = RoundedCornerShape(14.dp),
                                    modifier = Modifier.fillMaxWidth().testTag("phone_number_input")
                                )

                                Button(
                                    onClick = { requestOtp() },
                                    enabled = uiState !is AuthUiState.Loading,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(54.dp)
                                        .testTag("request_otp_button"),
                                    shape = RoundedCornerShape(14.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1))
                                ) {
                                    if (uiState is AuthUiState.Loading) {
                                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                                    } else {
                                        Text("Send OTP Code", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Color.White))
                                    }
                                }
                            } else {
                                OutlinedTextField(
                                    value = otpCode,
                                    onValueChange = { if (it.length <= 6) otpCode = it },
                                    label = { Text("6-Digit Verification Code", color = Color.White.copy(alpha = 0.7f)) },
                                    leadingIcon = { Icon(Icons.Default.Dialpad, contentDescription = null, tint = Color(0xFF818CF8)) },
                                    singleLine = true,
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = Color(0xFF818CF8),
                                        unfocusedBorderColor = Color.White.copy(alpha = 0.2f),
                                        focusedTextColor = Color.White,
                                        unfocusedTextColor = Color.White
                                    ),
                                    shape = RoundedCornerShape(14.dp),
                                    modifier = Modifier.fillMaxWidth().testTag("otp_code_input")
                                )

                                Button(
                                    onClick = { verifyOtp() },
                                    enabled = uiState !is AuthUiState.Loading,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(54.dp)
                                        .testTag("verify_otp_button"),
                                    shape = RoundedCornerShape(14.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1))
                                ) {
                                    if (uiState is AuthUiState.Loading) {
                                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                                    } else {
                                        Text("Verify & Sign In", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Color.White))
                                    }
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = if (isTimerRunning) "Resend in ${timerSeconds}s" else "Didn't receive code?",
                                        style = MaterialTheme.typography.bodySmall.copy(color = Color.White.copy(alpha = 0.7f))
                                    )

                                    TextButton(
                                        onClick = { requestOtp() },
                                        enabled = !isTimerRunning
                                    ) {
                                        Text(
                                            text = "Resend Code",
                                            style = MaterialTheme.typography.bodySmall.copy(
                                                color = if (!isTimerRunning) Color(0xFF818CF8) else Color.White.copy(alpha = 0.3f),
                                                fontWeight = FontWeight.Bold
                                            )
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
