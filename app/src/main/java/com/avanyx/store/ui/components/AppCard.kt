package com.avanyx.store.ui.components

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.avanyx.store.data.database.AppDatabase
import com.avanyx.store.data.database.entity.WishlistItemEntity
import com.avanyx.store.data.model.AppActionState
import com.avanyx.store.data.model.StoreApp
import com.avanyx.store.firebase.FirestoreService
import com.avanyx.store.firebase.model.FirestoreWishlistItem
import com.avanyx.store.manager.InstalledAppsManager
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Composable
fun AppCard(
    app: StoreApp,
    onClick: () -> Unit,
    onInstallClick: () -> Unit,
    actionState: AppActionState = AppActionState.Install,
    onActionClick: ((AppActionState) -> Unit)? = null,
    onDeveloperClick: ((String) -> Unit)? = null,
    onUninstallClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val db = remember(context) { AppDatabase.getInstance(context) }
    val wishlistDao = remember(db) { db.wishlistDao() }
    val isWishlisted by wishlistDao.isWishlisted(app.id).collectAsStateWithLifecycle(initialValue = false)
    val appsManager = remember(context) { InstalledAppsManager.getInstance(context) }

    var showMenu by remember { mutableStateOf(false) }

    Card(
        onClick = onClick,
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        ),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)),
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .testTag("app_card_${app.id}")
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // App Icon Box
            AppIconView(
                app = app,
                size = 60.dp,
                cornerRadius = 16.dp,
                fontSize = 20.sp
            )

            Spacer(modifier = Modifier.width(14.dp))

            // Info Column
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = app.name,
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    ),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    color = MaterialTheme.colorScheme.onSurface
                )

                // Developer Name row - Clickable to open Developer Profile
                val devIdentifier = app.developerUid.ifBlank { app.developer }
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.clickable {
                        if (onDeveloperClick != null) {
                            onDeveloperClick(devIdentifier)
                        }
                    }
                ) {
                    Text(
                        text = app.developer,
                        style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
                        color = MaterialTheme.colorScheme.primary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(modifier = Modifier.width(3.dp))
                    Icon(
                        imageVector = Icons.Default.Verified,
                        contentDescription = "Verified Developer",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(13.dp)
                    )
                    Text(
                        text = " • ${app.category}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Spacer(modifier = Modifier.height(3.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = "Rating",
                        tint = Color(0xFFFFB300),
                        modifier = Modifier.size(13.dp)
                    )
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = "${app.rating} ★ • ${app.size}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            // Standardized Action Button
            val clickHandler = {
                if (onActionClick != null) {
                    onActionClick(actionState)
                } else {
                    onInstallClick()
                }
            }

            when (actionState) {
                is AppActionState.Update -> {
                    // UPDATE -> Blue (Color(0xFF2563EB))
                    Button(
                        onClick = clickHandler,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF2563EB),
                            contentColor = Color.White
                        ),
                        shape = RoundedCornerShape(16.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                        modifier = Modifier
                            .height(36.dp)
                            .testTag("update_button_${app.id}")
                    ) {
                        Icon(
                            imageVector = Icons.Default.ArrowUpward,
                            contentDescription = "Update",
                            modifier = Modifier.size(14.dp).padding(end = 2.dp)
                        )
                        Text(
                            text = "UPDATE",
                            style = MaterialTheme.typography.labelLarge.copy(
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 11.sp
                            )
                        )
                    }
                }
                is AppActionState.Installed -> {
                    // OPEN -> Purple (Color(0xFF7C3AED))
                    Button(
                        onClick = clickHandler,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF7C3AED),
                            contentColor = Color.White
                        ),
                        shape = RoundedCornerShape(16.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                        modifier = Modifier
                            .height(36.dp)
                            .testTag("open_button_${app.id}")
                    ) {
                        Text(
                            text = "OPEN",
                            style = MaterialTheme.typography.labelLarge.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )
                        )
                    }
                }
                is AppActionState.Downloading -> {
                    // DOWNLOADING -> Progress Button
                    Button(
                        onClick = clickHandler,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f),
                            contentColor = MaterialTheme.colorScheme.primary
                        ),
                        shape = RoundedCornerShape(16.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                        modifier = Modifier
                            .height(36.dp)
                            .testTag("downloading_button_${app.id}")
                    ) {
                        CircularProgressIndicator(
                            progress = { actionState.progress },
                            modifier = Modifier.size(14.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "${(actionState.progress * 100).toInt()}%",
                            style = MaterialTheme.typography.labelMedium.copy(
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 11.sp
                            )
                        )
                    }
                }
                is AppActionState.Verifying -> {
                    FilledTonalButton(
                        onClick = {},
                        shape = RoundedCornerShape(16.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                        modifier = Modifier.height(36.dp)
                    ) {
                        Text("VERIFY", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
                is AppActionState.Installing -> {
                    FilledTonalButton(
                        onClick = {},
                        shape = RoundedCornerShape(16.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                        modifier = Modifier.height(36.dp)
                    ) {
                        Text("INSTALLING", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
                is AppActionState.Paused -> {
                    OutlinedButton(
                        onClick = clickHandler,
                        shape = RoundedCornerShape(16.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                        modifier = Modifier.height(36.dp)
                    ) {
                        Text("RESUME", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
                else -> {
                    // GET (not installed) -> Green (Color(0xFF10B981))
                    Button(
                        onClick = clickHandler,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF10B981),
                            contentColor = Color.White
                        ),
                        shape = RoundedCornerShape(16.dp),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp),
                        modifier = Modifier
                            .height(36.dp)
                            .testTag("get_button_${app.id}")
                    ) {
                        Text(
                            text = "GET",
                            style = MaterialTheme.typography.labelLarge.copy(
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 12.sp
                            )
                        )
                    }
                }
            }

            // Three-dot Options Menu for Wishlist, Share, Copy Link, Uninstall
            Box {
                IconButton(
                    onClick = { showMenu = true },
                    modifier = Modifier.size(32.dp).testTag("app_card_menu_${app.id}")
                ) {
                    Icon(
                        imageVector = Icons.Default.MoreVert,
                        contentDescription = "Options",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(18.dp)
                    )
                }

                DropdownMenu(
                    expanded = showMenu,
                    onDismissRequest = { showMenu = false }
                ) {
                    // Wishlist toggle option
                    DropdownMenuItem(
                        text = {
                            Text(if (isWishlisted) "Remove from Wishlist" else "Add to Wishlist")
                        },
                        leadingIcon = {
                            Icon(
                                imageVector = if (isWishlisted) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                                contentDescription = null,
                                tint = if (isWishlisted) Color(0xFFE11D48) else MaterialTheme.colorScheme.onSurface
                            )
                        },
                        onClick = {
                            showMenu = false
                            scope.launch(Dispatchers.IO) {
                                val user = FirebaseAuth.getInstance().currentUser
                                if (isWishlisted) {
                                    wishlistDao.removeFromWishlist(app.id)
                                    if (user != null) {
                                        FirestoreService().removeWishlistItem(user.uid, app.id)
                                    }
                                } else {
                                    wishlistDao.addToWishlist(WishlistItemEntity(appId = app.id))
                                    if (user != null) {
                                        FirestoreService().saveWishlistItem(
                                            FirestoreWishlistItem(
                                                userId = user.uid,
                                                appId = app.id,
                                                addedTimestamp = System.currentTimeMillis()
                                            )
                                        )
                                    }
                                }
                            }
                        }
                    )

                    // Share App
                    DropdownMenuItem(
                        text = { Text("Share App") },
                        leadingIcon = { Icon(Icons.Default.Share, contentDescription = null) },
                        onClick = {
                            showMenu = false
                            val shareText = "Check out ${app.name} on AVANYX Store: https://store-avanyx.pages.dev/app?id=${app.id}"
                            val intent = Intent(Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                putExtra(Intent.EXTRA_SUBJECT, app.name)
                                putExtra(Intent.EXTRA_TEXT, shareText)
                            }
                            context.startActivity(Intent.createChooser(intent, "Share ${app.name}"))
                        }
                    )

                    // Copy Link
                    DropdownMenuItem(
                        text = { Text("Copy Link") },
                        leadingIcon = { Icon(Icons.Default.ContentCopy, contentDescription = null) },
                        onClick = {
                            showMenu = false
                            val appLink = "https://store-avanyx.pages.dev/app?id=${app.id}"
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                            val clip = android.content.ClipData.newPlainText("AVANYX App Link", appLink)
                            clipboard.setPrimaryClip(clip)
                        }
                    )

                    // Uninstall option if installed
                    if (actionState is AppActionState.Installed || actionState is AppActionState.Update) {
                        HorizontalDivider()
                        DropdownMenuItem(
                            text = {
                                Text(
                                    "Uninstall",
                                    color = Color(0xFFDC2626),
                                    fontWeight = FontWeight.Bold
                                )
                            },
                            leadingIcon = {
                                Icon(
                                    Icons.Default.DeleteOutline,
                                    contentDescription = null,
                                    tint = Color(0xFFDC2626)
                                )
                            },
                            onClick = {
                                showMenu = false
                                if (onUninstallClick != null) {
                                    onUninstallClick()
                                } else {
                                    appsManager.uninstallApp(context, app.packageName)
                                }
                            }
                        )
                    }
                }
            }
        }
    }
}

