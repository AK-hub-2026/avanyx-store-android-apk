package com.avanyx.store.ui.components.payment

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.avanyx.store.ui.theme.MyApplicationTheme

/**
 * Native AVANYX Pay Inter-App Billing Gateway Activity.
 *
 * Invoked ONLY when an external Developer App sends a billing request
 * via the AVANYX Billing SDK through:
 * 1. Intent Actions:
 *    - com.avanyx.store.ACTION_PAY
 *    - com.avanyx.store.ACTION_BILLING
 * 2. Deep Link URLs:
 *    - avanyxpay://checkout?appId={appId}&productId={productId}
 *    - https://pay.avanyx.store/checkout?appId={appId}&productId={productId}
 *
 * Strict Architecture:
 * - Product details & price are resolved from backend/Firestore only.
 * - Client-provided prices are never trusted.
 * - Verification & transaction token returned to calling Developer App.
 */
class AvanyxPayActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Parse incoming intent or deep link parameters from calling Developer App
        val uri = intent.data
        val appId = intent.getStringExtra("appId")
            ?: uri?.getQueryParameter("appId")
            ?: intent.getStringExtra("package")
            ?: callingPackage
            ?: ""

        val productId = intent.getStringExtra("productId")
            ?: intent.getStringExtra("sku")
            ?: uri?.getQueryParameter("productId")
            ?: uri?.getQueryParameter("sku")
            ?: ""

        val appName = intent.getStringExtra("appName")
            ?: uri?.getQueryParameter("appName")
            ?: ""

        val developerPayload = intent.getStringExtra("developerPayload")
            ?: uri?.getQueryParameter("developerPayload")
            ?: ""

        // Validate that caller provided both mandatory product identifiers
        if (appId.isBlank() || productId.isBlank()) {
            Toast.makeText(
                this,
                "AVANYX Billing: Missing appId or productId in request",
                Toast.LENGTH_LONG
            ).show()
            val resultIntent = Intent().apply {
                putExtra("status", "FAILED")
                putExtra("error", "MISSING_PARAMETERS")
                putExtra("message", "Both appId and productId must be specified by the calling app SDK.")
                putExtra("developerPayload", developerPayload)
            }
            setResult(Activity.RESULT_CANCELED, resultIntent)
            finish()
            return
        }

        setContent {
            MyApplicationTheme {
                var isOpen by remember { mutableStateOf(true) }

                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.5f))
                ) {
                    AvanyxPayBottomSheet(
                        isOpen = isOpen,
                        onDismiss = {
                            isOpen = false
                            val resultIntent = Intent().apply {
                                putExtra("status", "CANCELED")
                                putExtra("error", "USER_CANCELED")
                                putExtra("appId", appId)
                                putExtra("productId", productId)
                                putExtra("developerPayload", developerPayload)
                            }
                            setResult(Activity.RESULT_CANCELED, resultIntent)
                            finish()
                        },
                        appId = appId,
                        productId = productId,
                        appName = appName,
                        amount = 0.0, // Authoritative price MUST be resolved from backend
                        onPaymentSuccess = { purchase ->
                            val resultIntent = Intent().apply {
                                putExtra("status", "SUCCESS")
                                putExtra("transactionId", purchase.id)
                                putExtra("transactionRef", purchase.transactionRef)
                                putExtra("purchaseToken", purchase.purchaseToken)
                                putExtra("appId", purchase.appId)
                                putExtra("productId", purchase.productId.ifBlank { productId })
                                putExtra("itemName", purchase.itemName)
                                putExtra("amount", purchase.amount)
                                putExtra("currency", purchase.currency)
                                putExtra("paymentMethod", purchase.paymentMethod)
                                putExtra("timestamp", purchase.timestamp)
                                putExtra("developerPayload", developerPayload)
                            }
                            setResult(Activity.RESULT_OK, resultIntent)
                            finish()
                        },
                        onShowMessage = { msg ->
                            Toast.makeText(this@AvanyxPayActivity, msg, Toast.LENGTH_SHORT).show()
                        }
                    )
                }
            }
        }
    }
}
