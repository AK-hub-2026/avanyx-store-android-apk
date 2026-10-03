package com.avanyx.store.ui.screens

import android.content.Context
import android.content.Intent
import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.avanyx.store.firebase.FirestoreService
import com.avanyx.store.firebase.model.FirestoreReward
import com.avanyx.store.firebase.model.FirestoreRewardHistory
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

/**
 * AVANYX Rewards Center:
 * Connected 100% to live Firestore database (rewards catalog & reward_history collection).
 * No mock or dummy data. Real points calculations, live coupon redemption, and Firestore audit logs.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RewardsScreen(
    onBack: () -> Unit,
    onShowMessage: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current
    val coroutineScope = rememberCoroutineScope()
    val firestoreService = remember { FirestoreService() }
    val currentUser = FirebaseAuth.getInstance().currentUser

    val userUid = currentUser?.uid ?: "guest_user"
    val referralCode = remember(userUid) { "AVX-${userUid.take(6).uppercase()}" }

    // Live streams directly from Firestore
    val liveRewards by firestoreService.observeRewards().collectAsStateWithLifecycle(initialValue = emptyList())
    val liveHistory by firestoreService.observeRewardHistory(userUid).collectAsStateWithLifecycle(initialValue = emptyList())

    // Compute live Reward Points balance strictly from Firestore history
    val totalRewardPoints = remember(liveHistory) {
        val earned = liveHistory.filter { it.type == "EARNED" || it.type.contains("BONUS") || it.type == "DAILY_CHECKIN" }.sumOf { it.pointsDelta }
        val redeemed = liveHistory.filter { it.type == "REDEEMED" }.sumOf { it.pointsDelta }
        (earned - redeemed).coerceAtLeast(0)
    }

    var selectedTab by remember { mutableIntStateOf(0) }
    var isClaimingDaily by remember { mutableStateOf(false) }
    var friendCodeInput by remember { mutableStateOf("") }
    var isApplyingReferral by remember { mutableStateOf(false) }

    val hasClaimedToday = remember(liveHistory) {
        val today = System.currentTimeMillis() - 24 * 60 * 60 * 1000L
        liveHistory.any { it.type == "DAILY_CHECKIN" && it.timestamp > today }
    }

    val couponRewards = remember(liveRewards) {
        liveRewards.filter { it.category.equals("COUPON", ignoreCase = true) || it.couponCode.isNotBlank() }
    }

    val festivalRewards = remember(liveRewards) {
        liveRewards.filter { it.isFestival || it.category.equals("FESTIVAL", ignoreCase = true) }
    }

    val referralHistory = remember(liveHistory) {
        liveHistory.filter { it.type == "REFERRAL_BONUS" }
    }

    val dynamicBadges = remember(liveHistory, totalRewardPoints, currentUser) {
        listOf(
            Triple("Early Explorer", "Active authenticated member of AVANYX Store", currentUser != null),
            Triple("Active Collector", "Recorded initial interactions in store rewards history", liveHistory.isNotEmpty()),
            Triple("Loyalty Milestone", "Accumulated 50 or more points from live activity", totalRewardPoints >= 50),
            Triple("Store Pioneer", "Reached 200 or more reward points in Firestore balance", totalRewardPoints >= 200),
            Triple("Master Pioneer", "Crossed 500 lifetime reward points milestone", totalRewardPoints >= 500),
            Triple("Coupon Master", "Redeemed a discount voucher from rewards catalog", liveHistory.any { it.type == "REDEEMED" }),
            Triple("Community Ambassador", "Successfully applied or shared referral perks", liveHistory.any { it.type == "REFERRAL_BONUS" })
        )
    }

    val sortedHistory = remember(liveHistory) {
        liveHistory.sortedByDescending { it.timestamp }
    }

    Scaffold(
        modifier = modifier.fillMaxSize().testTag("rewards_screen"),
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Rewards Center",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack, modifier = Modifier.testTag("rewards_back_button")) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Reward Points Header Card (AVANYX Purple Gradient)
            item {
                Card(
                    modifier = Modifier.fillMaxWidth().testTag("rewards_points_card"),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                Brush.horizontalGradient(
                                    colors = listOf(
                                        Color(0xFF7C3AED),
                                        Color(0xFFDB2777)
                                    )
                                )
                            )
                            .padding(24.dp)
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Stars,
                                        contentDescription = null,
                                        tint = Color(0xFFFFD700),
                                        modifier = Modifier.size(28.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Reward Points",
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                        color = Color.White
                                    )
                                }
                                Surface(
                                    shape = RoundedCornerShape(100.dp),
                                    color = Color.White.copy(alpha = 0.2f)
                                ) {
                                    Text(
                                        text = "Live Firestore Balance",
                                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                                        color = Color.White,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            Text(
                                text = "$totalRewardPoints",
                                style = MaterialTheme.typography.headlineLarge.copy(
                                    fontWeight = FontWeight.Black,
                                    fontSize = 42.sp
                                ),
                                color = Color.White
                            )

                            Text(
                                text = "Earned through app installs, check-ins, and referrals",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.White.copy(alpha = 0.85f)
                            )

                            Spacer(modifier = Modifier.height(18.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Button(
                                    onClick = {
                                        if (hasClaimedToday) {
                                            onShowMessage("Daily check-in already claimed today!")
                                        } else {
                                            isClaimingDaily = true
                                            coroutineScope.launch {
                                                val history = FirestoreRewardHistory(
                                                    userId = userUid,
                                                    rewardId = "daily_${System.currentTimeMillis()}",
                                                    rewardTitle = "Daily Store Check-in",
                                                    pointsDelta = 25,
                                                    type = "DAILY_CHECKIN"
                                                )
                                                firestoreService.recordRewardHistory(history)
                                                isClaimingDaily = false
                                                onShowMessage("Claimed +25 Reward Points to Firestore!")
                                            }
                                        }
                                    },
                                    enabled = !isClaimingDaily && !hasClaimedToday,
                                    modifier = Modifier.weight(1f).height(44.dp).testTag("claim_daily_button"),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color.White,
                                        contentColor = Color(0xFF7C3AED)
                                    )
                                ) {
                                    Icon(Icons.Default.CardGiftcard, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = if (hasClaimedToday) "Claimed Today" else "Daily Check-in (+25)",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Tab Selector: Coupons | Festival | Referral | Badges | History
            item {
                TabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = MaterialTheme.colorScheme.surfaceVariant,
                    modifier = Modifier.clip(RoundedCornerShape(16.dp))
                ) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = { Text("Coupons", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = { Text("Festival", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                    )
                    Tab(
                        selected = selectedTab == 2,
                        onClick = { selectedTab = 2 },
                        text = { Text("Referral", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                    )
                    Tab(
                        selected = selectedTab == 3,
                        onClick = { selectedTab = 3 },
                        text = { Text("Badges", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                    )
                    Tab(
                        selected = selectedTab == 4,
                        onClick = { selectedTab = 4 },
                        text = { Text("History", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                    )
                }
            }

            when (selectedTab) {
                0 -> {
                    // Real Coupons From Firestore
                    item {
                        Text(
                            text = "Available Store Discount Coupons",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                    }

                    if (couponRewards.isEmpty()) {
                        item {
                            Card(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                            ) {
                                Column(
                                    modifier = Modifier.fillMaxWidth().padding(24.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.ConfirmationNumber,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.primary,
                                        modifier = Modifier.size(36.dp)
                                    )
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Text("No Coupons in Firestore Catalog", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        "Promotional coupons created by publishers in the Firestore rewards catalog will synchronize here automatically.",
                                        style = MaterialTheme.typography.bodySmall,
                                        textAlign = TextAlign.Center,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    } else {
                        items(couponRewards) { reward ->
                            CouponItemCard(
                                code = reward.couponCode.ifBlank { reward.id },
                                description = reward.description.ifBlank { reward.title },
                                costPoints = reward.pointsCost,
                                userPoints = totalRewardPoints,
                                onCopy = {
                                    val codeToCopy = reward.couponCode.ifBlank { reward.id }
                                    clipboardManager.setText(AnnotatedString(codeToCopy))
                                    onShowMessage("Copied coupon: $codeToCopy")
                                },
                                onRedeem = {
                                    if (totalRewardPoints >= reward.pointsCost) {
                                        coroutineScope.launch {
                                            val history = FirestoreRewardHistory(
                                                userId = userUid,
                                                rewardId = reward.id,
                                                rewardTitle = "Redeemed: ${reward.title.ifBlank { reward.couponCode }}",
                                                pointsDelta = reward.pointsCost,
                                                type = "REDEEMED"
                                            )
                                            firestoreService.recordRewardHistory(history)
                                            val codeToCopy = reward.couponCode.ifBlank { reward.id }
                                            clipboardManager.setText(AnnotatedString(codeToCopy))
                                            onShowMessage("Redeemed! Copied $codeToCopy to clipboard")
                                        }
                                    } else {
                                        onShowMessage("Insufficient Reward Points. Need ${reward.pointsCost} pts.")
                                    }
                                }
                            )
                        }
                    }
                }
                1 -> {
                    // Festival Rewards Section from Firestore
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFF59E0B).copy(alpha = 0.15f)),
                            border = BorderStroke(1.dp, Color(0xFFF59E0B).copy(alpha = 0.4f))
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Celebration, contentDescription = null, tint = Color(0xFFF59E0B))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Festival Celebration Rewards",
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Seasonal event perks and festival bonus offers from Firestore rewards catalog sync directly here.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }

                    if (festivalRewards.isEmpty()) {
                        item {
                            Card(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                            ) {
                                Column(
                                    modifier = Modifier.fillMaxWidth().padding(24.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(Icons.Default.Celebration, contentDescription = null, tint = Color(0xFFF59E0B), modifier = Modifier.size(36.dp))
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Text("No Active Festival Event", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        "Seasonal festival perks from the Firestore catalog will appear here during active event windows.",
                                        style = MaterialTheme.typography.bodySmall,
                                        textAlign = TextAlign.Center,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    } else {
                        items(festivalRewards) { festReward ->
                            CouponItemCard(
                                code = festReward.couponCode.ifBlank { festReward.id },
                                description = festReward.description.ifBlank { festReward.title },
                                costPoints = festReward.pointsCost,
                                userPoints = totalRewardPoints,
                                onCopy = {
                                    val code = festReward.couponCode.ifBlank { festReward.id }
                                    clipboardManager.setText(AnnotatedString(code))
                                    onShowMessage("Copied $code")
                                },
                                onRedeem = {
                                    coroutineScope.launch {
                                        val history = FirestoreRewardHistory(
                                            userId = userUid,
                                            rewardId = festReward.id,
                                            rewardTitle = "Festival Perk: ${festReward.title}",
                                            pointsDelta = if (festReward.pointsCost > 0) festReward.pointsCost else 100,
                                            type = if (festReward.pointsCost > 0) "REDEEMED" else "FESTIVAL_BONUS"
                                        )
                                        firestoreService.recordRewardHistory(history)
                                        onShowMessage("Claimed festival reward: ${festReward.title}!")
                                    }
                                }
                            )
                        }
                    }
                }
                2 -> {
                    // Referral Rewards Section
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Column(modifier = Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    imageVector = Icons.Default.Share,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(36.dp)
                                )
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(
                                    text = "Your Referral Code",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                                )
                                Text(
                                    text = "Share your code with friends. When they apply it, both earn +150 Reward Points in Firestore.",
                                    style = MaterialTheme.typography.bodySmall,
                                    textAlign = TextAlign.Center,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(vertical = 8.dp)
                                )

                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary),
                                    modifier = Modifier.padding(vertical = 10.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 20.dp, vertical = 10.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = referralCode,
                                            style = MaterialTheme.typography.titleLarge.copy(
                                                fontWeight = FontWeight.ExtraBold,
                                                letterSpacing = 2.sp
                                            ),
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                        Spacer(modifier = Modifier.width(12.dp))
                                        IconButton(
                                            onClick = {
                                                clipboardManager.setText(AnnotatedString(referralCode))
                                                onShowMessage("Referral code copied: $referralCode")
                                            },
                                            modifier = Modifier.size(32.dp)
                                        ) {
                                            Icon(Icons.Default.ContentCopy, contentDescription = "Copy Code", modifier = Modifier.size(18.dp))
                                        }
                                    }
                                }

                                Button(
                                    onClick = {
                                        val shareText = "Download apps on AVANYX Store! Use my referral code $referralCode for +150 bonus reward points: https://store-avanyx.pages.dev"
                                        val intent = Intent(Intent.ACTION_SEND).apply {
                                            type = "text/plain"
                                            putExtra(Intent.EXTRA_TEXT, shareText)
                                        }
                                        context.startActivity(Intent.createChooser(intent, "Share Referral Code"))
                                    },
                                    modifier = Modifier.fillMaxWidth().height(48.dp),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                                ) {
                                    Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Share Invite Link", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    // Apply Friend's Referral Code Card
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.7f))
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(
                                    text = "Have a Friend's Referral Code?",
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Enter a code to claim your +150 referral bonus.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Spacer(modifier = Modifier.height(10.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    OutlinedTextField(
                                        value = friendCodeInput,
                                        onValueChange = { friendCodeInput = it.uppercase() },
                                        placeholder = { Text("e.g. AVX-ABC123") },
                                        singleLine = true,
                                        modifier = Modifier.weight(1f)
                                    )
                                    Button(
                                        onClick = {
                                            val clean = friendCodeInput.trim()
                                            if (clean.isBlank()) {
                                                onShowMessage("Please enter a referral code")
                                            } else if (clean.equals(referralCode, ignoreCase = true)) {
                                                onShowMessage("You cannot apply your own referral code!")
                                            } else if (liveHistory.any { it.rewardId == "ref_$clean" }) {
                                                onShowMessage("Referral code already claimed previously!")
                                            } else {
                                                isApplyingReferral = true
                                                coroutineScope.launch {
                                                    val history = FirestoreRewardHistory(
                                                        userId = userUid,
                                                        rewardId = "ref_$clean",
                                                        rewardTitle = "Friend Referral Bonus: $clean",
                                                        pointsDelta = 150,
                                                        type = "REFERRAL_BONUS"
                                                    )
                                                    firestoreService.recordRewardHistory(history)
                                                    isApplyingReferral = false
                                                    friendCodeInput = ""
                                                    onShowMessage("Referral bonus +150 Points recorded in Firestore!")
                                                }
                                            }
                                        },
                                        enabled = !isApplyingReferral,
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier.height(52.dp)
                                    ) {
                                        Text("Apply", fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }

                    // Referral stats from Firestore
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("Referral History", style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))
                                    Text(
                                        text = "${referralHistory.size} Referral bonuses claimed",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Text(
                                    text = "+${referralHistory.sumOf { it.pointsDelta }} pts",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold),
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }
                }
                3 -> {
                    // Dynamically Evaluated Achievement Badges
                    item {
                        Text(
                            text = "Account Achievement Badges",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                    }

                    items(dynamicBadges) { badge ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(48.dp)
                                        .clip(CircleShape)
                                        .background(
                                            if (badge.third) MaterialTheme.colorScheme.primaryContainer else Color.Gray.copy(alpha = 0.2f)
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = if (badge.third) Icons.Default.WorkspacePremium else Icons.Default.Lock,
                                        contentDescription = null,
                                        tint = if (badge.third) MaterialTheme.colorScheme.primary else Color.Gray,
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(16.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = badge.first,
                                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                    )
                                    Text(
                                        text = badge.second,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                                Surface(
                                    shape = RoundedCornerShape(100.dp),
                                    color = if (badge.third) Color(0xFF10B981).copy(alpha = 0.15f) else Color.Gray.copy(alpha = 0.1f)
                                ) {
                                    Text(
                                        text = if (badge.third) "UNLOCKED" else "LOCKED",
                                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                        color = if (badge.third) Color(0xFF10B981) else Color.Gray,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }
                    }
                }
                4 -> {
                    // Live Firestore Reward History Log
                    item {
                        Text(
                            text = "Live Reward Points History",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                    }

                    if (liveHistory.isEmpty()) {
                        item {
                            Card(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                                shape = RoundedCornerShape(16.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                            ) {
                                Column(
                                    modifier = Modifier.fillMaxWidth().padding(24.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(Icons.Default.History, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(36.dp))
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Text("No Points History Yet", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        "Claim a daily check-in or referral bonus above to see points transactions logged in real-time.",
                                        style = MaterialTheme.typography.bodySmall,
                                        textAlign = TextAlign.Center,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    } else {
                        items(sortedHistory) { item ->
                            val isRedeemed = item.type == "REDEEMED"
                            val dateStr = SimpleDateFormat("dd MMM, hh:mm a", Locale.getDefault()).format(Date(item.timestamp))
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(14.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = item.rewardTitle.ifBlank { item.type },
                                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                        )
                                        Text(
                                            text = "$dateStr • ${item.type}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    Text(
                                        text = if (isRedeemed) "-${item.pointsDelta} pts" else "+${item.pointsDelta} pts",
                                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                        color = if (isRedeemed) Color(0xFFDC2626) else Color(0xFF10B981)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

@Composable
private fun CouponItemCard(
    code: String,
    description: String,
    costPoints: Int,
    userPoints: Int,
    onCopy: () -> Unit,
    onRedeem: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary)
                ) {
                    Text(
                        text = code,
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.ExtraBold),
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
                Text(
                    text = if (costPoints > 0) "$costPoints Points" else "Free Perk",
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.primary
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                TextButton(onClick = onCopy) {
                    Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Copy Code")
                }
                Spacer(modifier = Modifier.width(8.dp))
                Button(
                    onClick = onRedeem,
                    shape = RoundedCornerShape(10.dp),
                    enabled = costPoints == 0 || userPoints >= costPoints
                ) {
                    Text(if (costPoints == 0) "Claim Perk" else "Redeem", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
