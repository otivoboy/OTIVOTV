import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getDatabase, ref, set, get, update, onValue, off, child, DatabaseReference } from 'firebase/database';

export const firebaseConfig = {
  apiKey: "AIzaSyCy6UgqmBLsxrfs_VZqIV9g-wHCD8Z61q8",
  authDomain: "studio-1256110026-44ab5.firebaseapp.com",
  projectId: "studio-1256110026-44ab5",
  databaseURL: "https://studio-1256110026-44ab5-default-rtdb.firebaseio.com",
  storageBucket: "studio-1256110026-44ab5.firebasestorage.app",
  messagingSenderId: "681244185893",
  appId: "1:681244185893:web:a34842be0e7ad3350e76cc"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app, "https://studio-1256110026-44ab5-default-rtdb.firebaseio.com");

/**
 * Realtime Database User Data Interface
 */
export interface RTDBUserData {
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  watchlist?: string[];
  settings?: Record<string, any>;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Save data for authenticated user in Firebase Realtime Database
 */
export async function saveUserDataToRTDB(userId: string, data: Partial<RTDBUserData>): Promise<void> {
  if (!userId) return;
  try {
    const userRef = ref(rtdb, `users/${userId}`);
    await update(userRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Realtime Database save error:', error);
  }
}

/**
 * Set full user profile record in Realtime Database
 */
export async function setUserDataInRTDB(userId: string, data: RTDBUserData): Promise<void> {
  if (!userId) return;
  try {
    const userRef = ref(rtdb, `users/${userId}`);
    await set(userRef, data);
  } catch (error) {
    console.warn('Realtime Database set error:', error);
  }
}

/**
 * Listen to user data in real time from Firebase Realtime Database
 */
export function listenToUserDataFromRTDB(userId: string, callback: (data: RTDBUserData | null) => void): () => void {
  if (!userId) return () => {};
  try {
    const userRef = ref(rtdb, `users/${userId}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const val = snapshot.val();
      callback(val);
    }, (error) => {
      console.warn('Realtime Database listener error:', error);
    });
    return () => {
      off(userRef, 'value', unsubscribe);
    };
  } catch (error) {
    console.warn('Realtime Database listen attach error:', error);
    return () => {};
  }
}

/**
 * Fetch one-time snapshot of user data from Realtime Database
 */
export async function getUserDataFromRTDB(userId: string): Promise<RTDBUserData | null> {
  if (!userId) return null;
  try {
    const userRef = ref(rtdb, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return snapshot.val() as RTDBUserData;
    }
    return null;
  } catch (error) {
    console.warn('Realtime Database get error:', error);
    return null;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    phoneNumber?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      phoneNumber: auth.currentUser?.phoneNumber,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection diagnostic helper (safe for runtime checks without alerting on startup)
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    // Silently ignore during offline or unauthenticated startup
  }
}
