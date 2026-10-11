/**
 * AVANYX Billing SDK v3.7.0 (Production)
 * Official Android & Web In-App Purchase and Subscription SDK
 * Provides seamless integration for developer apps to monetize with AVANYX Store.
 */

import {
  BillingProduct,
  BillingPurchase,
  BillingSubscription,
  BillingPurchaseRequest,
  BillingCallbackResponse,
  BillingPurchaseStatus,
  BillingProductType
} from '../types';
import {
  getBillingProductById,
  getUserPurchasesByApp,
  getUserSubscriptionsByApp,
  getPurchaseByToken,
  getAvailableUpiIntents,
  isMobileDevice,
  requestDeveloperPayout,
  getDeveloperPayoutBalance,
  listenToPurchaseStatus
} from '../services/billingService';
import { Unsubscribe } from 'firebase/firestore';

export interface AVANYXSdkConfig {
  apiKey?: string;
  appId?: string;
  appName?: string;
  developerUid?: string;
  onPurchaseUpdated?: (purchase: BillingPurchase) => void;
}

export type PurchaseCallback = (response: BillingCallbackResponse) => void;

class AVANYXBillingSDK {
  private config: AVANYXSdkConfig = {};
  private purchaseModalHandler: ((request: BillingPurchaseRequest) => void) | null = null;
  private listeners: Set<(response: BillingCallbackResponse) => void> = new Set();

  public readonly Status = {
    SUCCESS: 'SUCCESS' as BillingPurchaseStatus,
    PENDING_VERIFICATION: 'PENDING_VERIFICATION' as BillingPurchaseStatus,
    FAILED: 'FAILED' as BillingPurchaseStatus,
    CANCELLED: 'CANCELLED' as BillingPurchaseStatus,
  };

  public readonly ProductType = {
    IN_APP: 'IN_APP' as BillingProductType,
    SUBSCRIPTION: 'SUBSCRIPTION' as BillingProductType,
  };

  /**
   * Initializes the AVANYX Billing SDK with developer credentials
   */
  public initialize(config: AVANYXSdkConfig) {
    this.config = { ...this.config, ...config };
    if (typeof window !== 'undefined') {
      (window as any).__AVANYX_BILLING_INITIALIZED__ = true;
    }
  }

  public init(config: AVANYXSdkConfig) {
    this.initialize(config);
  }

  /**
   * Internal bridge to attach AVANYX Store Popup UI
   */
  public _registerPurchaseModalHandler(handler: (request: BillingPurchaseRequest) => void) {
    this.purchaseModalHandler = handler;
  }

  public _unregisterPurchaseModalHandler() {
    this.purchaseModalHandler = null;
  }

  /**
   * Dispatches callback to registered SDK listeners
   */
  public _dispatchCallback(response: BillingCallbackResponse) {
    this.listeners.forEach((listener) => {
      try {
        listener(response);
      } catch (err) {
        console.error('Error in AVANYX SDK purchase listener:', err);
      }
    });

    // Also trigger global window custom event for Native Android WebViews / hybrid wrappers
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('AVANYX_PURCHASE_COMPLETED', {
        detail: response,
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Add a persistent callback listener for purchase status changes
   */
  public addPurchaseListener(listener: (response: BillingCallbackResponse) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * AVANYX.purchase()
   * Initiates In-App Purchase for a product. Generates a unique purchaseToken and opens the AVANYX Store Purchase Popup.
   */
  public async purchase(
    request: BillingPurchaseRequest | string,
    callback?: PurchaseCallback
  ): Promise<BillingCallbackResponse> {
    const reqObj: BillingPurchaseRequest =
      typeof request === 'string' ? { productId: request, type: 'IN_APP' } : { ...request, type: request.type || 'IN_APP' };

    if (this.config.appId && !reqObj.appId) reqObj.appId = this.config.appId;
    if (this.config.appName && !reqObj.appName) reqObj.appName = this.config.appName;
    if (this.config.developerUid && !reqObj.developerUid) reqObj.developerUid = this.config.developerUid;

    return new Promise((resolve, reject) => {
      const combinedCallback: PurchaseCallback = (response) => {
        if (callback) callback(response);
        if (reqObj.onCallback) reqObj.onCallback(response);
        this._dispatchCallback(response);

        if (response.status === 'SUCCESS' || response.status === 'PENDING_VERIFICATION') {
          resolve(response);
        } else if (response.status === 'CANCELLED') {
          resolve(response);
        } else {
          reject(new Error(response.message || 'Purchase failed'));
        }
      };

      if (this.purchaseModalHandler) {
        this.purchaseModalHandler({
          ...reqObj,
          onCallback: combinedCallback,
        });
      } else {
        // Fallback: Dispatch window event for AVANYX Store global modal
        if (typeof window !== 'undefined') {
          const evt = new CustomEvent('OPEN_AVANYX_PURCHASE_MODAL', {
            detail: {
              ...reqObj,
              onCallback: combinedCallback,
            },
          });
          window.dispatchEvent(evt);
        } else {
          const errRes: BillingCallbackResponse = {
            status: 'FAILED',
            productId: reqObj.productId,
            purchaseToken: '',
            message: 'AVANYX Store Billing Popup is not ready in this environment.',
          };
          combinedCallback(errRes);
        }
      }
    });
  }

  /**
   * AVANYX.subscribe()
   * Initiates Subscription Purchase for a recurring subscription plan.
   */
  public async subscribe(
    request: BillingPurchaseRequest | string,
    callback?: PurchaseCallback
  ): Promise<BillingCallbackResponse> {
    const reqObj: BillingPurchaseRequest =
      typeof request === 'string'
        ? { productId: request, type: 'SUBSCRIPTION' }
        : { ...request, type: 'SUBSCRIPTION' };

    return this.purchase(reqObj, callback);
  }

  /**
   * AVANYX.restorePurchases()
   * Restores all valid past in-app purchases and active subscriptions for a user.
   */
  public async restorePurchases(userUid: string, appId?: string): Promise<{
    purchases: BillingPurchase[];
    subscriptions: BillingSubscription[];
  }> {
    const targetAppId = appId || this.config.appId || '';
    try {
      const [purchases, subscriptions] = await Promise.all([
        getUserPurchasesByApp(userUid, targetAppId),
        getUserSubscriptionsByApp(userUid, targetAppId),
      ]);

      const validPurchases = purchases.filter(
        (p) => p.paymentStatus === 'SUCCESS' || p.paymentStatus === 'PENDING_VERIFICATION'
      );
      const activeSubscriptions = subscriptions.filter((s) => s.status === 'ACTIVE');

      return {
        purchases: validPurchases,
        subscriptions: activeSubscriptions,
      };
    } catch (err) {
      console.error('Failed to restore purchases from Firestore:', err);
      return { purchases: [], subscriptions: [] };
    }
  }

  /**
   * AVANYX.getPurchaseHistory()
   * Retrieves full billing history (purchases and subscriptions) for the authenticated user.
   */
  public async getPurchaseHistory(userUid: string, appId?: string): Promise<{
    purchases: BillingPurchase[];
    subscriptions: BillingSubscription[];
  }> {
    const targetAppId = appId || this.config.appId || '';
    try {
      const [purchases, subscriptions] = await Promise.all([
        getUserPurchasesByApp(userUid, targetAppId),
        getUserSubscriptionsByApp(userUid, targetAppId),
      ]);
      return { purchases, subscriptions };
    } catch (err) {
      console.error('Failed to get purchase history:', err);
      return { purchases: [], subscriptions: [] };
    }
  }

  /**
   * AVANYX.getProductDetails()
   * Queries Firestore for immutable product metadata
   */
  public async getProductDetails(productId: string): Promise<BillingProduct | null> {
    return getBillingProductById(productId);
  }

  /**
   * AVANYX.verifyPurchaseToken()
   * Validates a purchaseToken directly against live Firestore records
   */
  public async verifyPurchaseToken(purchaseToken: string): Promise<BillingPurchase | null> {
    return getPurchaseByToken(purchaseToken);
  }

  /**
   * AVANYX.listenToPurchase()
   * Real-time subscription to purchase status changes in Firestore
   */
  public listenToPurchase(
    purchaseToken: string,
    callback: (purchase: BillingPurchase | null) => void
  ): Unsubscribe {
    return listenToPurchaseStatus(purchaseToken, callback);
  }

  /**
   * AVANYX.getUpiIntents()
   * Retrieves list of available Native UPI deep-link intent URLs
   */
  public getUpiIntents(params: {
    upiId: string;
    amount: number;
    productName: string;
    productId: string;
    purchaseToken?: string;
  }) {
    return getAvailableUpiIntents(params);
  }

  /**
   * AVANYX.isMobile()
   * Check if running on mobile device with native UPI support
   */
  public isMobile(): boolean {
    return isMobileDevice();
  }

  /**
   * AVANYX.requestPayout()
   * Developer payout withdrawal API
   */
  public async requestPayout(params: {
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
  }) {
    return requestDeveloperPayout(params);
  }

  /**
   * AVANYX.getPayoutBalance()
   * Check live withdrawable balance for developer
   */
  public async getPayoutBalance(developerUid: string) {
    return getDeveloperPayoutBalance(developerUid);
  }
}

// Global Singleton instance
export const AVANYX = new AVANYXBillingSDK();

// Attach to window for Android WebView / Web App hybrid apps
if (typeof window !== 'undefined') {
  (window as any).AVANYX = AVANYX;
}

export default AVANYX;
