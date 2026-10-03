package com.avanyx.store.billing.sdk

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import androidx.activity.result.contract.ActivityResultContract

/**
 * Official AVANYX Billing SDK client library.
 *
 * Developers integrate this client into their Android apps/games to request
 * in-app purchases and subscriptions through AVANYX Pay.
 *
 * Flow:
 * 1. Developer App calls AvanyxBillingClient.createBillingIntent(...)
 * 2. AVANYX Store launches the native AvanyxPayActivity bottom sheet popup
 * 3. AVANYX Store queries the authoritative Firestore catalog for the verified price
 * 4. User completes payment via UPI App (GPay/PhonePe/Paytm) or UPI Dynamic QR
 * 5. AVANYX Store verifies transaction and returns verified token to Developer App
 */
object AvanyxBillingClient {

    const val ACTION_PAY = "com.avanyx.store.ACTION_PAY"
    const val ACTION_BILLING = "com.avanyx.store.ACTION_BILLING"
    const val AVANYX_PACKAGE_NAME = "com.avanyx.store"

    /**
     * Checks if the AVANYX Store app is installed and available to handle billing requests.
     */
    fun isBillingSupported(context: Context): Boolean {
        val intent = Intent(ACTION_PAY).setPackage(AVANYX_PACKAGE_NAME)
        val resolveInfos = context.packageManager.queryIntentActivities(
            intent,
            PackageManager.MATCH_DEFAULT_ONLY
        )
        return resolveInfos.isNotEmpty()
    }

    /**
     * Constructs the intent to launch the native AVANYX Pay popup.
     * Note: Price is NEVER passed by the client. It is authoritatively
     * resolved on the AVANYX backend from the developer's registered catalog.
     *
     * @param appId The developer application package ID (e.g. "com.example.game")
     * @param productId The SKU / product ID published on AVANYX Developer Console
     * @param developerPayload Optional order ID or user account identifier
     */
    fun createBillingIntent(
        appId: String,
        productId: String,
        developerPayload: String = ""
    ): Intent {
        return Intent(ACTION_PAY).apply {
            setPackage(AVANYX_PACKAGE_NAME)
            putExtra("appId", appId)
            putExtra("productId", productId)
            if (developerPayload.isNotBlank()) {
                putExtra("developerPayload", developerPayload)
            }
        }
    }

    /**
     * Parses the result returned by AVANYX Pay to the calling Activity.
     */
    fun parseBillingResult(resultCode: Int, data: Intent?): BillingResult {
        if (resultCode != Activity.RESULT_OK || data == null) {
            val error = data?.getStringExtra("error") ?: "USER_CANCELED"
            val message = data?.getStringExtra("message") ?: "The purchase was canceled or unverified."
            return BillingResult(
                isSuccess = false,
                status = "CANCELED",
                error = error,
                message = message,
                purchase = null
            )
        }

        val status = data.getStringExtra("status") ?: "SUCCESS"
        val purchase = PurchaseDetails(
            transactionId = data.getStringExtra("transactionId") ?: "",
            transactionRef = data.getStringExtra("transactionRef") ?: "",
            purchaseToken = data.getStringExtra("purchaseToken") ?: "",
            appId = data.getStringExtra("appId") ?: "",
            productId = data.getStringExtra("productId") ?: "",
            itemName = data.getStringExtra("itemName") ?: "",
            amount = data.getDoubleExtra("amount", 0.0),
            currency = data.getStringExtra("currency") ?: "INR",
            paymentMethod = data.getStringExtra("paymentMethod") ?: "UPI",
            timestamp = data.getLongExtra("timestamp", System.currentTimeMillis()),
            developerPayload = data.getStringExtra("developerPayload") ?: ""
        )

        return BillingResult(
            isSuccess = status == "SUCCESS",
            status = status,
            error = null,
            message = null,
            purchase = purchase
        )
    }

    /**
     * ActivityResultContract for modern Jetpack Compose and Activity result launchers.
     */
    class Contract : ActivityResultContract<BillingRequest, BillingResult>() {
        override fun createIntent(context: Context, input: BillingRequest): Intent {
            return createBillingIntent(
                appId = input.appId,
                productId = input.productId,
                developerPayload = input.developerPayload
            )
        }

        override fun parseResult(resultCode: Int, intent: Intent?): BillingResult {
            return parseBillingResult(resultCode, intent)
        }
    }
}

data class BillingRequest(
    val appId: String,
    val productId: String,
    val developerPayload: String = ""
)

data class BillingResult(
    val isSuccess: Boolean,
    val status: String,
    val error: String?,
    val message: String?,
    val purchase: PurchaseDetails?
)

data class PurchaseDetails(
    val transactionId: String,
    val transactionRef: String,
    val purchaseToken: String,
    val appId: String,
    val productId: String,
    val itemName: String,
    val amount: Double,
    val currency: String,
    val paymentMethod: String,
    val timestamp: Long,
    val developerPayload: String
)
