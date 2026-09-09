package com.avanyx.store.utils

import android.content.Context
import android.telephony.TelephonyManager
import java.util.Locale

data class CountryCode(
    val countryIso: String,
    val name: String,
    val dialCode: String,
    val flagEmoji: String
)

object CountryProvider {

    val defaultCountry = CountryCode(
        countryIso = "US",
        name = "United States",
        dialCode = "+1",
        flagEmoji = "🇺🇸"
    )

    val countries = listOf(
        CountryCode("US", "United States", "+1", "🇺🇸"),
        CountryCode("IN", "India", "+91", "🇮🇳"),
        CountryCode("GB", "United Kingdom", "+44", "🇬🇧"),
        CountryCode("CA", "Canada", "+1", "🇨🇦"),
        CountryCode("AU", "Australia", "+61", "🇦🇺"),
        CountryCode("DE", "Germany", "+49", "🇩🇪"),
        CountryCode("FR", "France", "+33", "🇫🇷"),
        CountryCode("JP", "Japan", "+81", "🇯🇵"),
        CountryCode("BR", "Brazil", "+55", "🇧🇷"),
        CountryCode("MX", "Mexico", "+52", "🇲🇽"),
        CountryCode("ID", "Indonesia", "+62", "🇮🇩"),
        CountryCode("NG", "Nigeria", "+234", "🇳🇬"),
        CountryCode("PK", "Pakistan", "+92", "🇵🇰"),
        CountryCode("BD", "Bangladesh", "+880", "🇧🇩"),
        CountryCode("RU", "Russia", "+7", "🇷🇺"),
        CountryCode("KR", "South Korea", "+82", "🇰🇷"),
        CountryCode("IT", "Italy", "+39", "🇮🇹"),
        CountryCode("ES", "Spain", "+34", "🇪🇸"),
        CountryCode("NL", "Netherlands", "+31", "🇳🇱"),
        CountryCode("SA", "Saudi Arabia", "+966", "🇸🇦"),
        CountryCode("AE", "United Arab Emirates", "+971", "🇦🇪"),
        CountryCode("SG", "Singapore", "+65", "🇸🇬"),
        CountryCode("MY", "Malaysia", "+60", "🇲🇾"),
        CountryCode("PH", "Philippines", "+63", "🇵🇭"),
        CountryCode("ZA", "South Africa", "+27", "🇿🇦"),
        CountryCode("EG", "Egypt", "+20", "🇪🇬"),
        CountryCode("TR", "Turkey", "+90", "🇹🇷"),
        CountryCode("VN", "Vietnam", "+84", "🇻🇳"),
        CountryCode("TH", "Thailand", "+66", "🇹🇭"),
        CountryCode("AR", "Argentina", "+54", "🇦🇷"),
        CountryCode("CO", "Colombia", "+57", "🇨🇴"),
        CountryCode("CL", "Chile", "+56", "🇨🇱"),
        CountryCode("SE", "Sweden", "+46", "🇸🇪"),
        CountryCode("NO", "Norway", "+47", "🇳🇴"),
        CountryCode("FI", "Finland", "+358", "🇫🇮"),
        CountryCode("DK", "Denmark", "+45", "🇩🇰"),
        CountryCode("PL", "Poland", "+48", "🇵🇱"),
        CountryCode("CH", "Switzerland", "+41", "🇨🇭"),
        CountryCode("AT", "Austria", "+43", "🇦🇹"),
        CountryCode("BE", "Belgium", "+32", "🇧🇪"),
        CountryCode("NZ", "New Zealand", "+64", "🇳🇿"),
        CountryCode("KE", "Kenya", "+254", "🇰🇪"),
        CountryCode("GH", "Ghana", "+233", "🇬🇭"),
        CountryCode("UA", "Ukraine", "+380", "🇺🇦"),
        CountryCode("RO", "Romania", "+40", "🇷🇴"),
        CountryCode("CZ", "Czechia", "+420", "🇨🇿"),
        CountryCode("GR", "Greece", "+30", "🇬🇷"),
        CountryCode("PT", "Portugal", "+351", "🇵🇹"),
        CountryCode("IE", "Ireland", "+353", "🇮🇪"),
        CountryCode("IL", "Israel", "+972", "🇮🇱")
    )

    fun detectCountry(context: Context): CountryCode {
        try {
            val sessionManager = SessionManager.getInstance(context)
            val savedIso = sessionManager.selectedCountryIso
            if (!savedIso.isNull_orEmpty()) {
                val found = countries.firstOrNull { it.countryIso.equals(savedIso, ignoreCase = true) }
                if (found != null) return found
            }

            // SIM / Telephony ISO
            val telephonyManager = context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
            val simIso = telephonyManager?.simCountryIso?.uppercase(Locale.ROOT)
            val networkIso = telephonyManager?.networkCountryIso?.uppercase(Locale.ROOT)

            val detectedIso = when {
                !simIso.isNull_orEmpty() -> simIso
                !networkIso.isNull_orEmpty() -> networkIso
                else -> Locale.getDefault().country.uppercase(Locale.ROOT)
            }

            val matched = countries.firstOrNull { it.countryIso.equals(detectedIso, ignoreCase = true) }
            if (matched != null) return matched
        } catch (e: Throwable) {
            // Fallback
        }
        return defaultCountry
    }

    private fun String?.isNull_orEmpty(): Boolean = this == null || this.trim().isEmpty()
}
