package com.avanyx.store.ui.screens.auth

import android.app.Activity
import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Dialpad
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.avanyx.store.ui.components.GlassMessageCard
import com.avanyx.store.ui.components.GlassMessageData
import com.avanyx.store.ui.components.GlassMessageType
import com.avanyx.store.ui.viewmodel.AuthUiState
import com.avanyx.store.ui.viewmodel.AuthViewModel
import com.avanyx.store.utils.CountryCode
import com.avanyx.store.utils.CountryProvider
import com.avanyx.store.utils.SessionManager
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
    val sessionManager = remember(context) { SessionManager.getInstance(context) }
    val uiState by authViewModel.uiState.collectAsState()

    var selectedCountry by remember {
        mutableStateOf(CountryProvider.detectCountry(context))
    }

    var showCountryPicker by remember { mutableStateOf(false) }
    var countrySearchQuery by remember { mutableStateOf("") }

    var phoneNumberDigits by remember { mutableStateOf("") }
    var verificationId by remember { mutableStateOf<String?>(null) }
    var otpCode by remember { mutableStateOf("") }

    var glassError by remember { mutableStateOf<GlassMessageData?>(null) }

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
                onShowMessage("OTP Code Sent to ${selectedCountry.dialCode} $phoneNumberDigits")
            }
            is AuthUiState.Success -> {
                onShowMessage(state.message)
                authViewModel.resetUiState()
                onNavigateToHome()
            }
            is AuthUiState.Error -> {
                glassError = GlassMessageData(
                    title = "Authentication Failure",
                    description = state.message,
                    type = GlassMessageType.ERROR,
                    actionLabel = "Retry",
                    onAction = { glassError = null }
                )
            }
            else -> {}
        }
    }

    fun requestOtp() {
        val cleanDigits = phoneNumberDigits.filter { it.isDigit() }
        if (cleanDigits.length < 6) {
            glassError = GlassMessageData(
                title = "Invalid Phone Number",
                description = "Please enter a valid phone number for ${selectedCountry.name}.",
                type = GlassMessageType.WARNING
            )
            return
        }

        val fullInternationalNumber = "${selectedCountry.dialCode}$cleanDigits"
        val activity = context as? Activity
        if (activity != null) {
            authViewModel.sendPhoneOtp(fullInternationalNumber, activity)
        } else {
            verificationId = "mock_verification_id_123"
            isTimerRunning = true
            timerSeconds = 60
            onShowMessage("OTP verification code sent (Sandbox Mode)")
        }
    }

    fun verifyOtp() {
        val currentVerificationId = verificationId
        if (currentVerificationId.isNullOrBlank()) {
            glassError = GlassMessageData(
                title = "OTP Request Missing",
                description = "Please request an OTP verification code first.",
                type = GlassMessageType.WARNING
            )
            return
        }
        val cleanOtp = otpCode.trim().filter { it.isDigit() }
        if (cleanOtp.length < 6) {
            glassError = GlassMessageData(
                title = "Incomplete OTP",
                description = "Please enter the complete 6-digit OTP code.",
                type = GlassMessageType.WARNING
            )
            return
        }
        authViewModel.verifyPhoneCode(currentVerificationId, cleanOtp)
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
                        text = if (verificationId == null) "Select country and enter phone number for OTP verification"
                        else "Enter the 6-digit security code sent to ${selectedCountry.dialCode} $phoneNumberDigits",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = Color.White.copy(alpha = 0.7f)
                        ),
                        textAlign = TextAlign.Center
                    )

                    if (glassError != null) {
                        Spacer(modifier = Modifier.height(16.dp))
                        GlassMessageCard(
                            messageData = glassError!!,
                            onDismiss = { glassError = null }
                        )
                    }

                    Spacer(modifier = Modifier.height(24.dp))

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
                                // Country Selector Box
                                Surface(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { showCountryPicker = true }
                                        .testTag("country_code_selector"),
                                    shape = RoundedCornerShape(14.dp),
                                    color = Color.White.copy(alpha = 0.05f),
                                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.18f))
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(horizontal = 16.dp, vertical = 14.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                                        ) {
                                            Text(
                                                text = selectedCountry.flagEmoji,
                                                fontSize = 22.sp
                                            )
                                            Text(
                                                text = "${selectedCountry.name} (${selectedCountry.dialCode})",
                                                style = MaterialTheme.typography.bodyMedium.copy(
                                                    fontWeight = FontWeight.Bold,
                                                    color = Color.White
                                                )
                                            )
                                        }
                                        Icon(
                                            imageVector = Icons.Default.ArrowDropDown,
                                            contentDescription = "Select Country",
                                            tint = Color.White.copy(alpha = 0.7f)
                                        )
                                    }
                                }

                                // Phone Input Field
                                OutlinedTextField(
                                    value = phoneNumberDigits,
                                    onValueChange = { phoneNumberDigits = it },
                                    label = { Text("Phone Number", color = Color.White.copy(alpha = 0.7f)) },
                                    prefix = {
                                        Text(
                                            text = "${selectedCountry.dialCode} ",
                                            style = MaterialTheme.typography.bodyMedium.copy(
                                                fontWeight = FontWeight.Bold,
                                                color = Color(0xFF818CF8)
                                            )
                                        )
                                    },
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

    // Country Code Selection Modal Dialog
    if (showCountryPicker) {
        val filteredCountries = remember(countrySearchQuery) {
            if (countrySearchQuery.isBlank()) CountryProvider.countries
            else CountryProvider.countries.filter {
                it.name.contains(countrySearchQuery, ignoreCase = true) ||
                        it.dialCode.contains(countrySearchQuery, ignoreCase = true) ||
                        it.countryIso.contains(countrySearchQuery, ignoreCase = true)
            }
        }

        AlertDialog(
            onDismissRequest = {
                showCountryPicker = false
                countrySearchQuery = ""
            },
            title = {
                Text(
                    text = "Select Country Code",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
            },
            text = {
                Column(modifier = Modifier.heightIn(max = 380.dp)) {
                    OutlinedTextField(
                        value = countrySearchQuery,
                        onValueChange = { countrySearchQuery = it },
                        placeholder = { Text("Search country or code...") },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp)
                    )

                    LazyColumn(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        items(filteredCountries, key = { it.countryIso }) { country ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(10.dp))
                                    .clickable {
                                        selectedCountry = country
                                        sessionManager.selectedCountryIso = country.countryIso
                                        sessionManager.selectedDialCode = country.dialCode
                                        showCountryPicker = false
                                        countrySearchQuery = ""
                                    }
                                    .padding(horizontal = 12.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Text(text = country.flagEmoji, fontSize = 20.sp)
                                    Text(
                                        text = country.name,
                                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold)
                                    )
                                }
                                Text(
                                    text = country.dialCode,
                                    style = MaterialTheme.typography.bodyMedium.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(
                    onClick = {
                        showCountryPicker = false
                        countrySearchQuery = ""
                    }
                ) {
                    Text("Cancel")
                }
            }
        )
    }
}
