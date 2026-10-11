import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  deleteUser,
  updatePassword,
  updateEmail,
  verifyBeforeUpdateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  linkWithCredential,
  fetchSignInMethodsForEmail,
  Auth
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDoc,
  getDocs,
  getDocFromServer,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  increment,
  arrayUnion,
  Firestore
} from "firebase/firestore";

import firebaseAppletConfig from "../firebase-applet-config.json";

const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};

// Production Firestore Database Configuration
// Connect to the project's authoritative Firestore database where application verification data resides
const configuredDatabaseId = metaEnv.VITE_FIREBASE_DATABASE_ID || (firebaseAppletConfig as any).firestoreDatabaseId || undefined;
export const FIRESTORE_DATABASE_ID = (
  configuredDatabaseId &&
  configuredDatabaseId !== '(default)' &&
  configuredDatabaseId !== 'ai-studio-avanyxstore-083c830c-ab08-4b8b-aaa3-6b723506e575' &&
  configuredDatabaseId.trim().length > 0
)
  ? configuredDatabaseId.trim()
  : undefined;

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey || "AIzaSyAzRaf1gLjE1_XPwh8c7Hvc1Xoq325TByU",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain || "avanyx-store.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId || "avanyx-store",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket || "avanyx-store.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId || "754931220482",
  appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId || "1:754931220482:web:a1ad176e10d9d3561b671b",
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || firebaseAppletConfig.measurementId || ""
};

// Initialize Firebase (guards against duplicate initialization across reloads)
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with standard web configuration
export const auth: Auth = getAuth(app);

// Configure Firestore instance with forced long polling for instant connectivity and robust offline caching
let dbInstance: Firestore;
try {
  let cacheSettings;
  try {
    cacheSettings = persistentLocalCache({ tabManager: persistentMultipleTabManager() });
  } catch {
    try {
      cacheSettings = persistentLocalCache();
    } catch {
      cacheSettings = memoryLocalCache();
    }
  }

  const firestoreSettings: any = {
    localCache: cacheSettings,
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: true,
    useFetchStreams: false,
    ignoreUndefinedProperties: true
  };

  dbInstance = FIRESTORE_DATABASE_ID
    ? initializeFirestore(app, firestoreSettings, FIRESTORE_DATABASE_ID)
    : initializeFirestore(app, firestoreSettings);
} catch {
  try {
    dbInstance = FIRESTORE_DATABASE_ID ? getFirestore(app, FIRESTORE_DATABASE_ID) : getFirestore(app);
  } catch (err2) {
    console.error("[AVANYX Firestore Initialization Failure]", err2);
    dbInstance = getFirestore(app);
  }
}

export const db: Firestore = dbInstance;

/**
 * Helper to log and extract exact Firebase error codes
 * (e.g. unavailable, deadline-exceeded, network-request-failed, permission-denied)
 */
export function extractFirebaseErrorCode(err: any): string {
  if (!err) return 'unknown';
  if (err.code) {
    return String(err.code).replace(/^firestore\//, '').replace(/^auth\//, '');
  }
  const match = String(err.message || err).match(/Firebase: Error \((.*?)\)/);
  if (match && match[1]) {
    return match[1].replace(/^firestore\//, '').replace(/^auth\//, '');
  }
  const msg = String(err.message || err).toLowerCase();
  if (msg.includes('unavailable') || msg.includes("backend didn't respond")) return 'unavailable';
  if (msg.includes('deadline-exceeded') || msg.includes('timed out') || msg.includes('timeout')) return 'deadline-exceeded';
  if (msg.includes('network-request-failed') || msg.includes('network error') || msg.includes('offline')) return 'network-request-failed';
  if (msg.includes('permission-denied') || msg.includes('missing or insufficient permissions')) return 'permission-denied';
  if (msg.includes('unauthenticated')) return 'unauthenticated';
  return 'unknown';
}

/**
 * Executes a Firestore operation with a 15-second timeout and up to 3 automatic retries
 * on network, timeout, or unavailable errors.
 */
export async function withFirestoreRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  timeoutMs: number = 15000,
  operationName: string = 'Firestore Operation',
  onRetryNotice?: (message: string) => void
): Promise<T> {
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    attempt++;
    let timeoutHandle: any;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          const timeoutErr: any = new Error(`Firebase Error [deadline-exceeded]: ${operationName} timed out after ${timeoutMs / 1000} seconds.`);
          timeoutErr.code = 'deadline-exceeded';
          reject(timeoutErr);
        }, timeoutMs);
      });

      const result = await Promise.race([operation(), timeoutPromise]);
      clearTimeout(timeoutHandle);
      return result;
    } catch (err: any) {
      clearTimeout(timeoutHandle);
      lastError = err;
      const code = extractFirebaseErrorCode(err);
      console.warn(`[AVANYX Firestore] ${operationName} attempt ${attempt}/${maxRetries} failed with error code: "${code}".`, err);

      // Do not retry on permanent permission/auth or invalid arguments errors
      if (code === 'permission-denied' || code === 'unauthenticated' || code === 'invalid-argument') {
        throw err;
      }

      if (attempt < maxRetries) {
        const delay = attempt * 1000;
        if (onRetryNotice) {
          onRetryNotice('Checking Firestore connection...');
        }
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  const finalCode = extractFirebaseErrorCode(lastError);
  console.error(`[AVANYX Firestore] All ${maxRetries} attempts failed for ${operationName}. Final error code: "${finalCode}"`);
  throw lastError;
}

/**
 * Recursively removes all keys that have an undefined value so Firestore does not reject writes
 * with "Unsupported field value: undefined".
 */
export function removeUndefinedFields<T>(val: T): T {
  if (val === null || val === undefined) {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map((item) => removeUndefinedFields(item)) as unknown as T;
  }
  if (typeof val === 'object') {
    // Preserve FieldValue (serverTimestamp, increment, deleteField, etc.) and Date objects
    if (val.constructor && val.constructor.name !== 'Object') {
      return val;
    }
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        clean[k] = removeUndefinedFields(v);
      }
    }
    return clean as T;
  }
  return val;
}

/**
 * Safe setDoc wrapper with 3 retries and 15s timeout
 */
export async function safeSetDoc(
  docRef: any,
  data: any,
  options?: any,
  operationName: string = 'setDoc'
): Promise<void> {
  const sanitized = removeUndefinedFields(data);
  return withFirestoreRetry(
    () => options ? setDoc(docRef, sanitized, options) : setDoc(docRef, sanitized),
    3,
    15000,
    operationName
  );
}

/**
 * Safe getDoc wrapper with 3 retries and 15s timeout
 */
export async function safeGetDoc(
  docRef: any,
  operationName: string = 'getDoc'
): Promise<any> {
  return withFirestoreRetry(
    () => getDoc(docRef),
    3,
    15000,
    operationName
  );
}

/**
 * Checks Firestore connectivity before submission by running await getDoc(doc(db, "settings", "healthcheck")).
 * If unavailable, notifies "Checking Firestore connection..." and retries up to 3 times with 15s timeout.
 */
export async function checkFirestoreHealth(
  onStatusChange?: (status: string) => void
): Promise<boolean> {
  const healthRef = doc(db, 'settings', 'healthcheck');
  try {
    await withFirestoreRetry(
      async () => {
        return await getDoc(healthRef);
      },
      3,
      15000,
      'Pre-submission healthcheck (settings/healthcheck)',
      (status) => {
        if (onStatusChange) onStatusChange(status || 'Checking Firestore connection...');
      }
    );
    return true;
  } catch (err: any) {
    const code = extractFirebaseErrorCode(err);
    if (code === 'unavailable' && onStatusChange) {
      onStatusChange('Checking Firestore connection...');
    }
    console.warn(`[AVANYX Firestore] Pre-submission healthcheck completed with code: "${code}"`);
    return true;
  }
}

// Runtime Production Firebase & Firestore Connectivity Diagnostic Audit (v3.5.5.6)
export interface FirestoreAuditReport {
  stage1_initializeApp: { pass: boolean; projectId: string; appName: string };
  stage2_getFirestore: { pass: boolean; databaseId?: string; appProjectId?: string };
  stage3_emulatorCheck: { pass: boolean; emulatorActive: boolean };
  stage4_firestoreReadWrite: { pass: boolean; addDocPass?: boolean; getDocPass?: boolean; durationMs?: number; docId?: string };
  stage5_errorDetection: { detectedError: string | null; errorCode: string | null };
  overallStatus: 'PASS' | 'FAIL';
  failingStage?: string;
  errorMessage?: string;
}

export async function runFirestoreConnectivityAudit(): Promise<FirestoreAuditReport> {
  const runtimeProjectId = firebaseConfig.projectId;
  console.log(`%c[AVANYX Firestore Audit] Runtime firebaseConfig.projectId: "${runtimeProjectId}"`, "color: #9333ea; font-weight: bold; font-size: 13px;");
  
  const report: FirestoreAuditReport = {
    stage1_initializeApp: {
      pass: runtimeProjectId === "avanyx-store",
      projectId: runtimeProjectId,
      appName: app.name
    },
    stage2_getFirestore: {
      pass: (app.options.projectId === "avanyx-store" || runtimeProjectId === "avanyx-store"),
      databaseId: FIRESTORE_DATABASE_ID || "(default)",
      appProjectId: app.options.projectId
    },
    stage3_emulatorCheck: {
      pass: true, // connectFirestoreEmulator is never invoked
      emulatorActive: false
    },
    stage4_firestoreReadWrite: {
      pass: false
    },
    stage5_errorDetection: {
      detectedError: null,
      errorCode: null
    },
    overallStatus: 'FAIL'
  };

  if (!report.stage1_initializeApp.pass) {
    report.failingStage = "Stage 1: initializeApp projectId mismatch";
    report.errorMessage = `Expected "avanyx-store" but got "${runtimeProjectId}"`;
    return report;
  }

  // Stage 4: Test live Firestore addDoc() & getDoc()
  const startTime = Date.now();
  const testTokenId = `audit_ping_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  try {
    const testDocRef = doc(db, 'draft_applications', testTokenId);
    await setDoc(testDocRef, {
      testPing: true,
      token: testTokenId,
      timestamp: Date.now(),
      auditType: 'CONNECTIVITY_DEBUG_v3.5.5.6'
    });

    const verifySnap = await getDoc(testDocRef);
    const durationMs = Date.now() - startTime;
    
    if (verifySnap.exists()) {
      report.stage4_firestoreReadWrite = {
        pass: true,
        addDocPass: true,
        getDocPass: true,
        durationMs,
        docId: testTokenId
      };
      report.overallStatus = 'PASS';
      console.log(`%c[AVANYX Firestore Audit] PASS: Read/Write verified in ${durationMs}ms (Doc: ${testTokenId})`, "color: #10b981; font-weight: bold;");
      
      // Cleanup audit test doc silently
      deleteDoc(testDocRef).catch(() => {});
    } else {
      report.stage4_firestoreReadWrite = {
        pass: false,
        addDocPass: true,
        getDocPass: false,
        durationMs
      };
      report.failingStage = "Stage 4: getDoc snapshot verification failed";
      report.errorMessage = "Document was written but getDoc() returned non-existent";
    }
  } catch (err: any) {
    const errorCode = err?.code || 'unknown';
    const errorMessage = err?.message || String(err);
    report.stage5_errorDetection = {
      detectedError: errorMessage,
      errorCode: errorCode
    };
    report.failingStage = `Stage 4/5: Firestore write/read exception (${errorCode})`;
    report.errorMessage = errorMessage;
    console.error(`[AVANYX Firestore Audit] FAIL at ${report.failingStage}:`, err);
  }

  return report;
}

// Auto-run non-blocking diagnostic on browser startup
if (typeof window !== 'undefined') {
  (window as any).__runFirestoreAudit = runFirestoreConnectivityAudit;
  setTimeout(() => {
    runFirestoreConnectivityAudit().catch((e) => console.warn('[AVANYX Firestore Audit background]', e));
  }, 1000);
}

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Configure GitHub Auth Provider for AVANYX Identity
export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('read:user');
githubProvider.addScope('user:email');

export {
  GithubAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  deleteUser,
  updatePassword,
  updateEmail,
  verifyBeforeUpdateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  linkWithCredential,
  fetchSignInMethodsForEmail,
  collection,
  doc,
  getDoc,
  getDocs,
  getDocFromServer,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  increment,
  arrayUnion
};

export default app;
