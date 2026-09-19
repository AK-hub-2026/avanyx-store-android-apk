package com.avanyx.store.utils

import android.content.Context
import android.content.SharedPreferences
import com.google.firebase.auth.FirebaseAuth

class SessionManager private constructor(context: Context) {

    private val prefs: SharedPreferences = context.applicationContext.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    var isOnboardingCompleted: Boolean
        get() = prefs.getBoolean(KEY_ONBOARDING_COMPLETED, false)
        set(value) {
            prefs.edit().putBoolean(KEY_ONBOARDING_COMPLETED, value).apply()
        }

    var isAuthenticated: Boolean
        get() {
            val firebaseUser = try { FirebaseAuth.getInstance().currentUser } catch (e: Throwable) { null }
            return prefs.getBoolean(KEY_IS_AUTHENTICATED, false) || (firebaseUser != null)
        }
        set(value) {
            prefs.edit().putBoolean(KEY_IS_AUTHENTICATED, value).apply()
        }

    var selectedCountryIso: String?
        get() = prefs.getString(KEY_SELECTED_COUNTRY_ISO, null)
        set(value) {
            prefs.edit().putString(KEY_SELECTED_COUNTRY_ISO, value).apply()
        }

    var selectedDialCode: String?
        get() = prefs.getString(KEY_SELECTED_DIAL_CODE, null)
        set(value) {
            prefs.edit().putString(KEY_SELECTED_DIAL_CODE, value).apply()
        }

    fun saveUserSession(uid: String, email: String?) {
        prefs.edit()
            .putBoolean(KEY_IS_AUTHENTICATED, true)
            .putString(KEY_USER_UID, uid)
            .putString(KEY_USER_EMAIL, email ?: "")
            .putLong(KEY_LAST_LOGIN, System.currentTimeMillis())
            .apply()
    }

    fun clearSession() {
        prefs.edit()
            .putBoolean(KEY_IS_AUTHENTICATED, false)
            .remove(KEY_USER_UID)
            .remove(KEY_USER_EMAIL)
            .apply()
    }

    companion object {
        private const val PREF_NAME = "avanyx_store_prefs"
        private const val KEY_ONBOARDING_COMPLETED = "onboarding_completed"
        private const val KEY_IS_AUTHENTICATED = "is_authenticated"
        private const val KEY_USER_UID = "user_uid"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_LAST_LOGIN = "last_login"
        private const val KEY_SELECTED_COUNTRY_ISO = "selected_country_iso"
        private const val KEY_SELECTED_DIAL_CODE = "selected_dial_code"

        @Volatile
        private var instance: SessionManager? = null

        fun getInstance(context: Context): SessionManager {
            return instance ?: synchronized(this) {
                instance ?: SessionManager(context.applicationContext).also { instance = it }
            }
        }
    }
}
