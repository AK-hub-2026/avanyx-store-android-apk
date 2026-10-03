package com.avanyx.store.ui.components.payment

import androidx.compose.runtime.Composable
import com.avanyx.store.data.model.StoreApp

/**
 * Backward-compatible wrapper for AVANYX Pay In-App Billing popup.
 * Routes directly to the high-performance, Google Play style [AvanyxPayBottomSheet].
 */
@Composable
fun AvanyxPayDialog(
    isOpen: Boolean,
    onDismiss: () -> Unit,
    app: StoreApp,
    amount: Double = 99.0,
    isStoreAppInstalled: Boolean = true,
    onPaymentSuccess: (transactionRef: String) -> Unit,
    onShowMessage: (String) -> Unit
) {
    AvanyxPayBottomSheet(
        isOpen = isOpen,
        onDismiss = onDismiss,
        appId = app.id,
        appName = app.name,
        itemName = "${app.name} Full License",
        amount = amount,
        appIconUrl = app.iconUrl,
        onPaymentSuccess = { purchase -> onPaymentSuccess(purchase.transactionId) },
        onShowMessage = onShowMessage
    )
}
