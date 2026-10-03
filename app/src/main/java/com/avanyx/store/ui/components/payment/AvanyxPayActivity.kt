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
 * Inter-App Billing Gateway Activity.
 * Allows external applications (e.g. Games like Free Fire, third party utilities, sandboxed APKs)
 * to initiate AVANYX Pay In-App Billing popups via:
 * 1. Intent: com.avanyx.store.ACTION_PAY / com.avanyx.store.ACTION_BILLING
 * 2. Deep Link URI: avanyxpay://checkout?... or https://pay.avanyx.store/checkout?...
 */
class AvanyxPayActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Parse incoming intent or deep link parameters
        val uri = intent.data
        val appId = intent.getStringExtra("appId")
            ?: uri?.getQueryParameter("appId")
            ?: "com.avanyx.security.pro"

        val appName = intent.getStringExtra("appName")
            ?: uri?.getQueryParameter("appName")
            ?: "AVANYX Protect Pro"

        val itemName = intent.getStringExtra("itemName")
            ?: uri?.getQueryParameter("itemName")
            ?: "100 Diamonds & Premium Pass"

        val amountStr = intent.getStringExtra("amount")
            ?: uri?.getQueryParameter("amount")
            ?: "${intent.getDoubleExtra("amount", 80.0)}"

        val amount = amountStr.toDoubleOrNull() ?: 80.0

        setContent {
            MyApplicationTheme {
                var isOpen by remember { mutableStateOf(true) }

                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.45f))
                ) {
                    AvanyxPayBottomSheet(
                        isOpen = isOpen,
                        onDismiss = {
                            isOpen = false
                            setResult(Activity.RESULT_CANCELED)
                            finish()
                        },
                        appId = appId,
                        appName = appName,
                        itemName = itemName,
                        amount = amount,
                        onPaymentSuccess = { purchase ->
                            val resultIntent = Intent().apply {
                                putExtra("transactionRef", purchase.transactionId)
                                putExtra("purchaseToken", purchase.purchaseToken)
                                putExtra("appId", appId)
                                putExtra("itemName", itemName)
                                putExtra("amount", amount)
                                putExtra("status", "SUCCESS")
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
