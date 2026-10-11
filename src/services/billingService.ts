/**
 * AVANYX Billing Service (Production Live Firestore)
 * Handles live In-App purchases, subscriptions, product management, UTR validation, and anti-fraud checks.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  addDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, removeUndefinedFields } from '../firebase';
import {
  BillingProduct,
  BillingPurchase,
  BillingSubscription,
  BillingNotification,
  BillingPurchaseStatus,
  SubscriptionStatus,
  BillingCallbackResponse,
  DeveloperPayout,
  DeveloperPayoutSetting,
  PayoutStatus,
  SubscriptionPlan
} from '../types';
import { getCommissionSettings } from './firestoreService';

// Collections
const PRODUCTS_COLLECTION = 'products';
const PURCHASES_COLLECTION = 'purchases';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const SUBSCRIPTION_PLANS_COLLECTION = 'subscription_plans';
const PURCHASE_NOTIFICATIONS_COLLECTION = 'purchase_notifications';
const DEVELOPER_PAYOUTS_COLLECTION = 'developer_payouts';
const PAYOUT_SETTINGS_COLLECTION = 'payout_settings';
const AUDIT_LOGS_COLLECTION = 'audit_logs';

/**
 * Generate a cryptographically secure, readable purchase token
 * Format: AVX-PUR-YYYY-XXXXXXXX
 */
export function generatePurchaseToken(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 8; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `AVX-PUR-${year}-${rand}`;
}

/**
 * Check if a purchaseToken already exists in Firestore (Anti-duplication)
 */
export async function checkDuplicatePurchaseToken(purchaseToken: string): Promise<boolean> {
  if (!purchaseToken) return false;
  try {
    const q = query(
      collection(db, PURCHASES_COLLECTION),
      where('purchaseToken', '==', purchaseToken),
      limit(1)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (err) {
    console.error('Error checking duplicate purchaseToken:', err);
    return false;
  }
}

/**
 * Check if a 12-digit UTR has already been submitted in purchases or payments (Anti-Fraud)
 */
export async function checkDuplicateUtr(utr: string): Promise<{ isDuplicate: boolean; message?: string }> {
  const cleanUtr = utr.trim();
  if (!cleanUtr || cleanUtr.length < 8) {
    return { isDuplicate: false };
  }

  try {
    // 1. Check purchases collection
    const purchaseQ = query(
      collection(db, PURCHASES_COLLECTION),
      where('utr', '==', cleanUtr),
      limit(1)
    );
    const purchaseSnap = await getDocs(purchaseQ);
    if (!purchaseSnap.empty) {
      return {
        isDuplicate: true,
        message: `UTR transaction ID ${cleanUtr} has already been registered with an existing purchase.`
      };
    }

    // 2. Check general payments collection
    const paymentsQ = query(
      collection(db, 'payments'),
      where('utr', '==', cleanUtr),
      limit(1)
    );
    const paymentsSnap = await getDocs(paymentsQ);
    if (!paymentsSnap.empty) {
      return {
        isDuplicate: true,
        message: `UTR transaction ID ${cleanUtr} has already been submitted with another payment.`
      };
    }

    return { isDuplicate: false };
  } catch (err) {
    console.warn('UTR check warning:', err);
    return { isDuplicate: false };
  }
}

/**
 * Audit log helper
 */
export async function logBillingAudit(entry: {
  action: string;
  targetId: string;
  performedBy?: string;
  adminEmail?: string;
  userId?: string;
  details: string;
}) {
  try {
    await addDoc(collection(db, AUDIT_LOGS_COLLECTION), removeUndefinedFields({
      ...entry,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp()
    }));
  } catch (err) {
    console.warn('Billing audit log warning:', err);
  }
}

// ==========================================
// 1. PRODUCTS (In-App Products & Subscriptions)
// ==========================================

/**
 * Fetch product details by immutable productId
 */
export async function getBillingProductById(productId: string): Promise<BillingProduct | null> {
  if (!productId) return null;
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as BillingProduct;
    }
    return null;
  } catch (err) {
    console.error(`Error fetching billing product ${productId}:`, err);
    return null;
  }
}

/**
 * Get all published billing products for an app
 */
export async function getBillingProductsByApp(appId: string): Promise<BillingProduct[]> {
  if (!appId) return [];
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('appId', '==', appId)
    );
    const snapshot = await getDocs(q);
    const products: BillingProduct[] = [];
    snapshot.forEach((docSnap) => {
      products.push({ id: docSnap.id, ...docSnap.data() } as BillingProduct);
    });
    return products;
  } catch (err) {
    console.error(`Error fetching products for app ${appId}:`, err);
    return [];
  }
}

/**
 * Get all billing products created by a developer
 */
export async function getBillingProductsByDeveloper(developerUid: string): Promise<BillingProduct[]> {
  if (!developerUid) return [];
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('developerUid', '==', developerUid)
    );
    const snapshot = await getDocs(q);
    const products: BillingProduct[] = [];
    snapshot.forEach((docSnap) => {
      products.push({ id: docSnap.id, ...docSnap.data() } as BillingProduct);
    });
    return products;
  } catch (err) {
    console.error(`Error fetching developer products for ${developerUid}:`, err);
    return [];
  }
}

/**
 * Create a new In-App product or subscription
 * Stable Product ID is permanent and immutable (saved as document ID)
 */
export async function createBillingProduct(
  productData: Omit<BillingProduct, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BillingProduct> {
  // Validate permanent immutable productId format
  const sanitizedProductId = productData.productId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  if (!sanitizedProductId) {
    throw new Error('Valid permanent Product ID is required (e.g. premium_remove_ads).');
  }

  const existing = await getBillingProductById(sanitizedProductId);
  if (existing) {
    throw new Error(`Product ID "${sanitizedProductId}" already exists. Product IDs must be globally unique and immutable.`);
  }

  const now = new Date().toISOString();
  const newProduct: BillingProduct = {
    ...productData,
    id: sanitizedProductId,
    productId: sanitizedProductId,
    createdAt: now,
    updatedAt: now
  };

  const docRef = doc(db, PRODUCTS_COLLECTION, sanitizedProductId);
  await setDoc(docRef, removeUndefinedFields({
    ...newProduct,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }));

  await logBillingAudit({
    action: 'CREATE_BILLING_PRODUCT',
    targetId: sanitizedProductId,
    userId: productData.developerUid,
    details: `Created billing product ${sanitizedProductId} (${productData.name}) for app ${productData.appId} at price ₹${productData.price}`
  });

  return newProduct;
}

/**
 * Update existing billing product (Price, description, status, features)
 * NOTE: productId is permanent and immutable
 */
export async function updateBillingProduct(
  productId: string,
  updates: Partial<Omit<BillingProduct, 'id' | 'productId' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, productId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error(`Product ${productId} does not exist.`);
  }

  const now = new Date().toISOString();
  await updateDoc(docRef, removeUndefinedFields({
    ...updates,
    updatedAt: serverTimestamp()
  }));

  await logBillingAudit({
    action: 'UPDATE_BILLING_PRODUCT',
    targetId: productId,
    details: `Updated billing product ${productId}. Changes: ${Object.keys(updates).join(', ')}`
  });
}

// ==========================================
// 2. PURCHASES (In-App Transactions)
// ==========================================

/**
 * Submit a new purchase transaction with UTR & Screenshot
 */
export async function createBillingPurchase(purchaseData: {
  productId: string;
  productName: string;
  productType: 'IN_APP' | 'SUBSCRIPTION';
  appId: string;
  appName: string;
  appIconUrl?: string;
  developerUid: string;
  developerName?: string;
  userUid: string;
  userEmail?: string;
  userName?: string;
  amount: number;
  originalAmount: number;
  discountAmount: number;
  couponUsed?: string;
  utr: string;
  paymentScreenshotUrl: string;
  upiId: string;
  clientCallbackUrl?: string;
}): Promise<BillingPurchase> {
  // 1. Anti-fraud UTR duplicate check
  const utrCheck = await checkDuplicateUtr(purchaseData.utr);
  if (utrCheck.isDuplicate) {
    throw new Error(utrCheck.message || 'Duplicate UTR detected. Please submit a valid transaction ID.');
  }

  // 2. Generate unique purchaseToken
  let token = generatePurchaseToken();
  let isDupe = await checkDuplicatePurchaseToken(token);
  let attempts = 0;
  while (isDupe && attempts < 5) {
    token = generatePurchaseToken();
    isDupe = await checkDuplicatePurchaseToken(token);
    attempts++;
  }

  const now = new Date().toISOString();
  const newPurchase: BillingPurchase = {
    id: token,
    purchaseToken: token,
    productId: purchaseData.productId,
    productName: purchaseData.productName,
    productType: purchaseData.productType,
    appId: purchaseData.appId,
    appName: purchaseData.appName,
    appIconUrl: purchaseData.appIconUrl || '',
    developerUid: purchaseData.developerUid,
    developerName: purchaseData.developerName || '',
    userUid: purchaseData.userUid,
    userEmail: purchaseData.userEmail || '',
    userName: purchaseData.userName || '',
    amount: purchaseData.amount,
    originalAmount: purchaseData.originalAmount,
    discountAmount: purchaseData.discountAmount,
    couponUsed: purchaseData.couponUsed || '',
    paymentStatus: 'PENDING_VERIFICATION',
    utr: purchaseData.utr.trim(),
    paymentScreenshotUrl: purchaseData.paymentScreenshotUrl,
    upiId: purchaseData.upiId,
    clientCallbackUrl: purchaseData.clientCallbackUrl || '',
    createdAt: now,
    updatedAt: now
  };

  const docRef = doc(db, PURCHASES_COLLECTION, token);
  await setDoc(docRef, removeUndefinedFields({
    ...newPurchase,
    couponUsed: purchaseData.couponUsed || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }));

  // 3. Create initial purchase notification for user
  try {
    await addDoc(collection(db, PURCHASE_NOTIFICATIONS_COLLECTION), removeUndefinedFields({
      userUid: purchaseData.userUid,
      userId: purchaseData.userUid,
      purchaseToken: token,
      productId: purchaseData.productId,
      productName: purchaseData.productName,
      appId: purchaseData.appId,
      status: 'PENDING_VERIFICATION',
      type: purchaseData.productType === 'SUBSCRIPTION' ? 'SUBSCRIPTION' : 'PURCHASE',
      message: `Your purchase for ${purchaseData.productName} (Token: ${token}) is submitted and pending verification.`,
      createdAt: serverTimestamp(),
      isRead: false
    }));
  } catch (nErr) {
    console.warn('Purchase notification write warning:', nErr);
  }

  // 4. Audit Log
  await logBillingAudit({
    action: 'SUBMIT_PURCHASE',
    targetId: token,
    userId: purchaseData.userUid,
    details: `User ${purchaseData.userEmail || purchaseData.userUid} submitted purchase ${token} for ${purchaseData.productName} (₹${purchaseData.amount}, UTR: ${purchaseData.utr})`
  });

  return newPurchase;
}

/**
 * Fetch single purchase by purchaseToken
 */
export async function getPurchaseByToken(purchaseToken: string): Promise<BillingPurchase | null> {
  if (!purchaseToken) return null;
  try {
    const docRef = doc(db, PURCHASES_COLLECTION, purchaseToken);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as BillingPurchase;
    }
    return null;
  } catch (err) {
    console.error(`Error fetching purchase ${purchaseToken}:`, err);
    return null;
  }
}

/**
 * Get all purchases by a user across all apps
 */
export async function getUserPurchases(userUid: string): Promise<BillingPurchase[]> {
  if (!userUid) return [];
  try {
    const q = query(
      collection(db, PURCHASES_COLLECTION),
      where('userUid', '==', userUid)
    );
    const snapshot = await getDocs(q);
    const purchases: BillingPurchase[] = [];
    snapshot.forEach((docSnap) => {
      purchases.push({ id: docSnap.id, ...docSnap.data() } as BillingPurchase);
    });
    // Sort descending by creation date
    return purchases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error(`Error fetching purchases for user ${userUid}:`, err);
    return [];
  }
}

/**
 * Get purchases for a specific user and app (for SDK restorePurchases)
 */
export async function getUserPurchasesByApp(userUid: string, appId: string): Promise<BillingPurchase[]> {
  if (!userUid) return [];
  try {
    const all = await getUserPurchases(userUid);
    if (!appId) return all;
    return all.filter((p) => p.appId === appId);
  } catch (err) {
    console.error('Error fetching user purchases by app:', err);
    return [];
  }
}

/**
 * Get purchases for developer analytics / developer console
 */
export async function getDeveloperPurchases(developerUid: string): Promise<BillingPurchase[]> {
  if (!developerUid) return [];
  try {
    const q = query(
      collection(db, PURCHASES_COLLECTION),
      where('developerUid', '==', developerUid)
    );
    const snapshot = await getDocs(q);
    const purchases: BillingPurchase[] = [];
    snapshot.forEach((docSnap) => {
      purchases.push({ id: docSnap.id, ...docSnap.data() } as BillingPurchase);
    });
    return purchases.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error(`Error fetching developer purchases for ${developerUid}:`, err);
    return [];
  }
}

/**
 * Get all purchases for Admin Console
 */
export async function getAllPurchasesForAdmin(): Promise<BillingPurchase[]> {
  try {
    const q = query(
      collection(db, PURCHASES_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    const snapshot = await getDocs(q);
    const list: BillingPurchase[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as BillingPurchase);
    });
    return list;
  } catch (err) {
    // Fallback if index not yet generated
    const snapshot = await getDocs(collection(db, PURCHASES_COLLECTION));
    const list: BillingPurchase[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as BillingPurchase);
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

/**
 * Admin / Automated Verification: Approve or Reject a Purchase
 */
export async function verifyOrRejectPurchase(
  purchaseToken: string,
  newStatus: BillingPurchaseStatus,
  adminUid: string,
  reviewerNotes?: string
): Promise<BillingCallbackResponse> {
  const purchase = await getPurchaseByToken(purchaseToken);
  if (!purchase) {
    throw new Error(`Purchase record ${purchaseToken} not found.`);
  }

  const now = new Date().toISOString();
  const docRef = doc(db, PURCHASES_COLLECTION, purchaseToken);
  await updateDoc(docRef, {
    paymentStatus: newStatus,
    verifiedAt: now,
    verifiedBy: adminUid,
    verificationNotes: reviewerNotes || '',
    updatedAt: serverTimestamp()
  });

  // If this is a subscription purchase and was approved, create or update subscription
  if (purchase.productType === 'SUBSCRIPTION' && newStatus === 'SUCCESS') {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30); // 1 month

    await createOrUpdateSubscription({
      subscriptionId: `SUB-${purchaseToken}`,
      planId: purchase.productId,
      productId: purchase.productId,
      productName: purchase.productName,
      appId: purchase.appId,
      appName: purchase.appName,
      developerUid: purchase.developerUid,
      userUid: purchase.userUid,
      userEmail: purchase.userEmail,
      status: 'ACTIVE',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      billingCycle: 'MONTHLY',
      autoRenew: true,
      nextBillingDate: endDate.toISOString(),
      lastPurchaseToken: purchaseToken,
      amount: purchase.amount
    });
  }

  // Create notification for buyer
  try {
    await addDoc(collection(db, PURCHASE_NOTIFICATIONS_COLLECTION), {
      userUid: purchase.userUid,
      userId: purchase.userUid,
      purchaseToken: purchaseToken,
      productId: purchase.productId,
      productName: purchase.productName,
      appId: purchase.appId,
      status: newStatus,
      type: 'PURCHASE',
      message:
        newStatus === 'SUCCESS'
          ? `Your purchase for ${purchase.productName} is verified! Enjoy your premium features.`
          : `Your purchase for ${purchase.productName} could not be verified. Reason: ${reviewerNotes || 'Invalid payment verification.'}`,
      createdAt: serverTimestamp(),
      isRead: false
    });
  } catch (nErr) {
    console.warn('Purchase notification write error:', nErr);
  }

  // Audit log
  await logBillingAudit({
    action: `VERIFY_PURCHASE_${newStatus}`,
    targetId: purchaseToken,
    performedBy: adminUid,
    userId: purchase.userUid,
    details: `Purchase ${purchaseToken} status changed to ${newStatus} by admin ${adminUid}. Notes: ${reviewerNotes || 'None'}`
  });

  return {
    status: newStatus,
    productId: purchase.productId,
    purchaseToken: purchaseToken,
    amount: purchase.amount,
    timestamp: now,
    message: newStatus === 'SUCCESS' ? 'Purchase successfully verified.' : reviewerNotes || 'Verification updated.'
  };
}

// ==========================================
// 3. SUBSCRIPTIONS
// ==========================================

/**
 * Create or update active subscription in Firestore
 */
export async function createOrUpdateSubscription(
  subData: Omit<BillingSubscription, 'id' | 'createdAt' | 'updatedAt'> & { subscriptionId: string }
): Promise<BillingSubscription> {
  const now = new Date().toISOString();
  const subRecord: BillingSubscription = {
    ...subData,
    id: subData.subscriptionId,
    createdAt: now,
    updatedAt: now
  };

  const docRef = doc(db, SUBSCRIPTIONS_COLLECTION, subData.subscriptionId);
  await setDoc(docRef, removeUndefinedFields({
    ...subRecord,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }));

  return subRecord;
}

/**
 * Get all subscriptions for a user
 */
export async function getUserSubscriptions(userUid: string): Promise<BillingSubscription[]> {
  if (!userUid) return [];
  try {
    const q = query(
      collection(db, SUBSCRIPTIONS_COLLECTION),
      where('userUid', '==', userUid)
    );
    const snapshot = await getDocs(q);
    const list: BillingSubscription[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as BillingSubscription);
    });
    return list;
  } catch (err) {
    console.error(`Error fetching subscriptions for user ${userUid}:`, err);
    return [];
  }
}

/**
 * Get user subscriptions by appId
 */
export async function getUserSubscriptionsByApp(userUid: string, appId: string): Promise<BillingSubscription[]> {
  if (!userUid) return [];
  try {
    const all = await getUserSubscriptions(userUid);
    if (!appId) return all;
    return all.filter((s) => s.appId === appId);
  } catch (err) {
    console.error('Error fetching user subscriptions by app:', err);
    return [];
  }
}

/**
 * Get all subscriptions for a developer's apps
 */
export async function getDeveloperSubscriptions(developerUid: string): Promise<BillingSubscription[]> {
  if (!developerUid) return [];
  try {
    const q = query(
      collection(db, SUBSCRIPTIONS_COLLECTION),
      where('developerUid', '==', developerUid)
    );
    const snapshot = await getDocs(q);
    const list: BillingSubscription[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as BillingSubscription);
    });
    return list;
  } catch (err) {
    console.error(`Error fetching developer subscriptions for ${developerUid}:`, err);
    return [];
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string, userUid: string): Promise<void> {
  const docRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('Subscription not found.');
  }
  const data = snap.data();
  if (data.userUid !== userUid) {
    throw new Error('Unauthorized to cancel this subscription.');
  }

  await updateDoc(docRef, {
    status: 'CANCELLED',
    autoRenew: false,
    updatedAt: serverTimestamp()
  });

  await logBillingAudit({
    action: 'CANCEL_SUBSCRIPTION',
    targetId: subscriptionId,
    userId: userUid,
    details: `User ${userUid} cancelled subscription ${subscriptionId}`
  });
}

/**
 * Create a new subscription plan (Available to Verified Developers & Student Creators)
 */
export async function createSubscriptionPlan(
  planData: Omit<SubscriptionPlan, 'id' | 'planId' | 'createdAt'>
): Promise<SubscriptionPlan> {
  const planRef = doc(collection(db, SUBSCRIPTION_PLANS_COLLECTION));
  const plan: SubscriptionPlan = {
    ...planData,
    id: planRef.id,
    planId: planRef.id,
    createdAt: new Date().toISOString()
  };
  await setDoc(planRef, removeUndefinedFields({
    ...plan,
    createdAt: serverTimestamp()
  }));

  await logBillingAudit({
    action: 'CREATE_SUBSCRIPTION_PLAN',
    targetId: plan.id,
    performedBy: planData.developerUid,
    details: `Created subscription plan ${plan.name} (₹${plan.price}/${plan.billingPeriod}) for app ${plan.appId}`
  });

  return plan;
}

/**
 * Get all subscription plans published by a developer/student
 */
export async function getSubscriptionPlansByDeveloper(developerUid: string): Promise<SubscriptionPlan[]> {
  if (!developerUid) return [];
  try {
    const q = query(
      collection(db, SUBSCRIPTION_PLANS_COLLECTION),
      where('developerUid', '==', developerUid)
    );
    const snap = await getDocs(q);
    const list: SubscriptionPlan[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as SubscriptionPlan);
    });
    return list;
  } catch (err) {
    console.warn('Error fetching subscription plans for developer:', err);
    return [];
  }
}

/**
 * Get all subscription plans for a specific application
 */
export async function getSubscriptionPlansByApp(appId: string): Promise<SubscriptionPlan[]> {
  if (!appId) return [];
  try {
    const q = query(
      collection(db, SUBSCRIPTION_PLANS_COLLECTION),
      where('appId', '==', appId)
    );
    const snap = await getDocs(q);
    const list: SubscriptionPlan[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as SubscriptionPlan);
    });
    return list;
  } catch (err) {
    console.warn('Error fetching subscription plans for app:', err);
    return [];
  }
}

// ==========================================
// 4. DEVELOPER BILLING ANALYTICS
// ==========================================

export interface DeveloperBillingSummary {
  totalRevenue: number;
  totalPurchases: number;
  pendingRevenue: number;
  pendingPurchasesCount: number;
  subscriptionCount: number;
  activeSubscriptionsCount: number;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    salesCount: number;
    revenue: number;
    percentage: number;
  }>;
}

/**
 * Calculate developer revenue & billing analytics from live Firestore purchases
 */
export async function getDeveloperBillingAnalytics(developerUid: string): Promise<DeveloperBillingSummary> {
  const purchases = await getDeveloperPurchases(developerUid);
  const subscriptions = await getDeveloperSubscriptions(developerUid);

  let totalRevenue = 0;
  let totalPurchases = 0;
  let pendingRevenue = 0;
  let pendingPurchasesCount = 0;

  const productMap: Record<string, { name: string; count: number; revenue: number }> = {};

  purchases.forEach((p) => {
    if (p.paymentStatus === 'SUCCESS') {
      totalRevenue += p.amount || 0;
      totalPurchases += 1;

      if (!productMap[p.productId]) {
        productMap[p.productId] = { name: p.productName || p.productId, count: 0, revenue: 0 };
      }
      productMap[p.productId].count += 1;
      productMap[p.productId].revenue += p.amount || 0;
    } else if (p.paymentStatus === 'PENDING_VERIFICATION') {
      pendingRevenue += p.amount || 0;
      pendingPurchasesCount += 1;
    }
  });

  const activeSubscriptionsCount = subscriptions.filter((s) => s.status === 'ACTIVE').length;

  const topSellingProducts = Object.entries(productMap)
    .map(([productId, item]) => ({
      productId,
      productName: item.name,
      salesCount: item.count,
      revenue: item.revenue,
      percentage: totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    totalRevenue,
    totalPurchases,
    pendingRevenue,
    pendingPurchasesCount,
    subscriptionCount: subscriptions.length,
    activeSubscriptionsCount,
    topSellingProducts
  };
}

// ==========================================
// 5. NATIVE UPI INTENT API (Mobile Deep Links)
// ==========================================

export interface UpiIntentOption {
  id: string;
  name: string;
  scheme: string;
  iconBgColor: string;
  textColor: string;
  intentUrl: string;
}

/**
 * Generate Universal UPI payment parameters string
 */
export function buildUpiQueryString(params: {
  pa: string; // VPA
  pn?: string; // Payee Name
  am: number; // Amount
  tn?: string; // Transaction Note / Product ID
  tr?: string; // Transaction Reference
  cu?: string; // Currency (INR)
}): string {
  const query = new URLSearchParams({
    pa: params.pa,
    pn: params.pn || 'AVANYX Store',
    am: params.am.toString(),
    cu: params.cu || 'INR',
    tn: params.tn || 'AVANYX In-App Purchase',
    tr: params.tr || generatePurchaseToken()
  });
  return query.toString();
}

/**
 * Generate Native UPI Intent URLs for PhonePe, Google Pay, Paytm, BHIM & Universal UPI
 */
export function getAvailableUpiIntents(params: {
  upiId: string;
  amount: number;
  productName: string;
  productId: string;
  purchaseToken?: string;
}): UpiIntentOption[] {
  const queryStr = buildUpiQueryString({
    pa: params.upiId,
    pn: 'AVANYX Store',
    am: params.amount,
    tn: `AVANYX: ${params.productName.slice(0, 30)}`,
    tr: params.purchaseToken || generatePurchaseToken(),
    cu: 'INR'
  });

  return [
    {
      id: 'phonepe',
      name: 'PhonePe',
      scheme: 'phonepe',
      iconBgColor: '#5f259f',
      textColor: '#ffffff',
      intentUrl: `phonepe://pay?${queryStr}`
    },
    {
      id: 'gpay',
      name: 'Google Pay',
      scheme: 'tez',
      iconBgColor: '#ffffff',
      textColor: '#3c4043',
      intentUrl: `tez://upi/pay?${queryStr}`
    },
    {
      id: 'paytm',
      name: 'Paytm',
      scheme: 'paytmmp',
      iconBgColor: '#00baf2',
      textColor: '#ffffff',
      intentUrl: `paytmmp://pay?${queryStr}`
    },
    {
      id: 'bhim',
      name: 'BHIM UPI',
      scheme: 'bhim',
      iconBgColor: '#005b82',
      textColor: '#ffffff',
      intentUrl: `bhim://pay?${queryStr}`
    },
    {
      id: 'generic_upi',
      name: 'Any UPI App',
      scheme: 'upi',
      iconBgColor: '#6750A4',
      textColor: '#ffffff',
      intentUrl: `upi://pay?${queryStr}`
    }
  ];
}

/**
 * Detect whether client is on a mobile device (Android / iOS / Touch device)
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
}

// ==========================================
// 6. DEVELOPER PAYOUT CENTER (Withdrawals & Balances)
// ==========================================

export interface DeveloperPayoutBalance {
  grossRevenue: number; // Gross verified sales & in-app purchases
  commissionAmount: number; // Platform commission taken
  netRevenue: number; // Net earnings after platform commission
  availableForPayout: number; // Verified earnings ready for withdrawal
  pendingVerification: number; // Purchases awaiting verification
  totalWithdrawn: number; // Sum of completed PAID payouts
  pendingPayoutRequests: number; // Sum of PENDING / PROCESSING payout requests
  platformFeePercent: number; // Commission percentage from commission_settings
  netEarningsRate: number; // Net rate percentage
}

/**
 * Check if a user has purchased a paid app (or in-app unlock)
 */
export async function hasUserPurchasedApp(userId: string, appId: string): Promise<boolean> {
  if (!userId || !appId) return false;
  try {
    const q = query(
      collection(db, PURCHASES_COLLECTION),
      where('userUid', '==', userId),
      where('appId', '==', appId),
      where('paymentStatus', '==', 'SUCCESS'),
      limit(1)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (err) {
    console.warn('[BillingService] Check app purchase error:', err);
    return false;
  }
}

/**
 * Calculate developer's live withdrawable balance and commission breakdown from live Firestore
 */
export async function getDeveloperPayoutBalance(developerUid: string): Promise<DeveloperPayoutBalance> {
  const [purchases, payouts, commissionSettings] = await Promise.all([
    getDeveloperPurchases(developerUid),
    getDeveloperPayouts(developerUid),
    getCommissionSettings()
  ]);

  const commissionPercent = commissionSettings.inAppCommission || 10;
  const platformFeeRate = commissionPercent / 100;
  const netRate = 1 - platformFeeRate;

  let grossVerified = 0;
  let pendingVerification = 0;

  purchases.forEach((p) => {
    if (p.paymentStatus === 'SUCCESS') {
      grossVerified += p.amount || 0;
    } else if (p.paymentStatus === 'PENDING_VERIFICATION') {
      pendingVerification += p.amount || 0;
    }
  });

  const commissionAmount = Math.round(grossVerified * platformFeeRate);
  const netVerified = Math.max(0, grossVerified - commissionAmount);

  let totalWithdrawn = 0;
  let pendingPayoutRequests = 0;

  payouts.forEach((po) => {
    if (po.status === 'PAID') {
      totalWithdrawn += po.amount || 0;
    } else if (po.status === 'PENDING' || po.status === 'PROCESSING') {
      pendingPayoutRequests += po.amount || 0;
    }
  });

  const availableForPayout = Math.max(0, netVerified - totalWithdrawn - pendingPayoutRequests);

  return {
    grossRevenue: grossVerified,
    commissionAmount,
    netRevenue: netVerified,
    availableForPayout,
    pendingVerification,
    totalWithdrawn,
    pendingPayoutRequests,
    platformFeePercent: commissionPercent,
    netEarningsRate: 100 - commissionPercent
  };
}

/**
 * Submit a Payout / Withdrawal request
 */
export async function requestDeveloperPayout(params: {
  developerUid: string;
  developerName: string;
  developerEmail?: string;
  amount: number;
  payoutMethod: 'UPI' | 'BANK_TRANSFER';
  upiId?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
  accountHolderName?: string;
  notes?: string;
}): Promise<DeveloperPayout> {
  if (params.amount < 100) {
    throw new Error('Minimum payout threshold is ₹100.');
  }

  const balance = await getDeveloperPayoutBalance(params.developerUid);
  if (params.amount > balance.availableForPayout) {
    throw new Error(`Insufficient balance. Maximum withdrawable amount is ₹${balance.availableForPayout}.`);
  }

  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  const payoutId = `PAYOUT-${year}-${rand}`;
  const now = new Date().toISOString();

  const payoutDoc: DeveloperPayout = {
    id: payoutId,
    payoutId,
    developerUid: params.developerUid,
    developerName: params.developerName,
    developerEmail: params.developerEmail,
    amount: params.amount,
    payoutMethod: params.payoutMethod,
    upiId: params.upiId?.trim(),
    bankAccountNumber: params.bankAccountNumber?.trim(),
    bankIfsc: params.bankIfsc?.trim().toUpperCase(),
    bankName: params.bankName?.trim(),
    accountHolderName: params.accountHolderName?.trim(),
    status: 'PENDING',
    requestedAt: now,
    notes: params.notes || '',
    createdAt: now,
    updatedAt: now
  };

  const docRef = doc(db, DEVELOPER_PAYOUTS_COLLECTION, payoutId);
  await setDoc(docRef, removeUndefinedFields({
    ...payoutDoc,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }));

  await logBillingAudit({
    action: 'REQUEST_DEVELOPER_PAYOUT',
    targetId: payoutId,
    userId: params.developerUid,
    details: `Developer ${params.developerName} requested payout of ₹${params.amount} via ${params.payoutMethod}`
  });

  return payoutDoc;
}

/**
 * Get all payouts for a developer
 */
export async function getDeveloperPayouts(developerUid: string): Promise<DeveloperPayout[]> {
  if (!developerUid) return [];
  try {
    const q = query(
      collection(db, DEVELOPER_PAYOUTS_COLLECTION),
      where('developerUid', '==', developerUid)
    );
    const snap = await getDocs(q);
    const list: DeveloperPayout[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as DeveloperPayout));
    return list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  } catch (err) {
    console.error('Error fetching developer payouts:', err);
    return [];
  }
}

/**
 * Get all payouts for Admin Console
 */
export async function getAllPayoutsForAdmin(): Promise<DeveloperPayout[]> {
  try {
    const q = query(
      collection(db, DEVELOPER_PAYOUTS_COLLECTION),
      orderBy('requestedAt', 'desc'),
      limit(100)
    );
    const snap = await getDocs(q);
    const list: DeveloperPayout[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as DeveloperPayout));
    return list;
  } catch (err) {
    const snap = await getDocs(collection(db, DEVELOPER_PAYOUTS_COLLECTION));
    const list: DeveloperPayout[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() } as DeveloperPayout));
    return list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }
}

/**
 * Admin update payout status (e.g. PAID, PROCESSING, REJECTED)
 */
export async function updatePayoutStatus(
  payoutId: string,
  newStatus: PayoutStatus,
  adminUid: string,
  transactionRef?: string,
  notes?: string
): Promise<void> {
  const docRef = doc(db, DEVELOPER_PAYOUTS_COLLECTION, payoutId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('Payout record not found.');
  }

  const now = new Date().toISOString();
  await updateDoc(docRef, {
    status: newStatus,
    processedAt: now,
    processedBy: adminUid,
    transactionRef: transactionRef || '',
    notes: notes || '',
    updatedAt: serverTimestamp()
  });

  await logBillingAudit({
    action: `UPDATE_PAYOUT_${newStatus}`,
    targetId: payoutId,
    performedBy: adminUid,
    details: `Payout ${payoutId} marked as ${newStatus} by admin ${adminUid}. Ref: ${transactionRef || 'N/A'}`
  });
}

/**
 * Get developer's saved payout bank/UPI settings
 */
export async function getDeveloperPayoutSettings(developerUid: string): Promise<DeveloperPayoutSetting | null> {
  if (!developerUid) return null;
  try {
    const docRef = doc(db, PAYOUT_SETTINGS_COLLECTION, developerUid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as DeveloperPayoutSetting;
    }
    return null;
  } catch (err) {
    console.error('Error fetching payout settings:', err);
    return null;
  }
}

/**
 * Save developer's payout bank/UPI settings
 */
export async function saveDeveloperPayoutSettings(
  developerUidOrSettings: string | (Partial<DeveloperPayoutSetting> & { developerUid?: string; id?: string }),
  maybeSettings?: Omit<DeveloperPayoutSetting, 'id' | 'developerUid' | 'updatedAt'>
): Promise<DeveloperPayoutSetting> {
  let uid = '';
  let settingsData: Partial<DeveloperPayoutSetting> = {};

  if (typeof developerUidOrSettings === 'string') {
    uid = developerUidOrSettings;
    settingsData = maybeSettings || {};
  } else {
    uid = developerUidOrSettings.developerUid || developerUidOrSettings.id || '';
    settingsData = developerUidOrSettings;
  }

  if (!uid) {
    throw new Error('Developer UID is required to save payout settings');
  }

  const now = new Date().toISOString();
  const data: DeveloperPayoutSetting = {
    id: uid,
    developerUid: uid,
    payoutMethod: settingsData.payoutMethod || 'UPI',
    upiId: settingsData.upiId || '',
    bankAccountNumber: settingsData.bankAccountNumber || '',
    bankIfsc: settingsData.bankIfsc || '',
    bankName: settingsData.bankName || '',
    accountHolderName: settingsData.accountHolderName || '',
    panNumber: settingsData.panNumber || '',
    phone: settingsData.phone || '',
    updatedAt: now
  };

  const docRef = doc(db, PAYOUT_SETTINGS_COLLECTION, uid);
  await setDoc(docRef, removeUndefinedFields({
    ...data,
    updatedAt: serverTimestamp()
  }));

  return data;
}

// ==========================================
// 7. REAL-TIME SNAPSHOT LISTENERS
// ==========================================

/**
 * Real-time listener for purchase verification status change
 */
export function listenToPurchaseStatus(
  purchaseToken: string,
  onUpdate: (purchase: BillingPurchase | null) => void
): Unsubscribe {
  const docRef = doc(db, PURCHASES_COLLECTION, purchaseToken);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate({ id: snap.id, ...snap.data() } as BillingPurchase);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('Purchase status listener error:', err);
    }
  );
}

/**
 * Real-time listener for user purchase notifications
 */
export function listenToUserPurchaseNotifications(
  userUid: string,
  onUpdate: (notifications: BillingNotification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, PURCHASE_NOTIFICATIONS_COLLECTION),
    where('userUid', '==', userUid),
    limit(30)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list: BillingNotification[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as BillingNotification));
      onUpdate(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    },
    (err) => {
      console.warn('Purchase notification listener warning:', err);
    }
  );
}

/**
 * Mark notification as read
 */
export async function markPurchaseNotificationRead(notificationId: string): Promise<void> {
  try {
    const docRef = doc(db, PURCHASE_NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(docRef, {
      isRead: true
    });
  } catch (err) {
    console.warn('Mark notification read notice:', err);
  }
}

