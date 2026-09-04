import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  getDocs,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { FamilyInvite } from '../types';

// Standardized Firestore error handling types adhering to Firebase Integration skill
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
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
  if (errMessage.includes('Missing or insufficient permissions') || errMessage.includes('permission-denied')) {
    throw new Error(JSON.stringify(errInfo));
  }
}

// Initialize Firebase App instance
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Initialize Firestore with robust multi-tab persistent offline cache and forced long polling for proxy/iframe stability
export const db = (() => {
  const databaseId = firebaseConfig.firestoreDatabaseId || undefined;
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      }),
      experimentalForceLongPolling: true,
    }, databaseId);
  } catch (err) {
    console.info('Using fallback getFirestore instance with databaseId:', err);
    try {
      return databaseId 
        ? getFirestore(app, databaseId)
        : getFirestore(app);
    } catch (fallbackErr) {
      console.error('Failed to initialize Firestore instance:', fallbackErr);
      return getFirestore(app);
    }
  }
})();

// Validate connection to Firestore on initialization
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.info("Firestore is currently operating with offline cache mode.");
    }
  }
}

// Run connection validation
testConnection();

// Configure Google OAuth Provider with Google Workspace Scopes
export const SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send',
];

const googleProvider = new GoogleAuthProvider();
SCOPES.forEach(scope => googleProvider.addScope(scope));
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Cached in-memory and session access token for Google API calls
let cachedAccessToken: string | null = null;
const STORAGE_KEY_TOKEN = 'sprout_google_access_token';
const STORAGE_KEY_EXPIRY = 'sprout_google_token_expiry';

export const setCachedAccessToken = (token: string | null, expiresInSeconds: number = 3500) => {
  cachedAccessToken = token;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (token) {
        sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
        sessionStorage.setItem(STORAGE_KEY_EXPIRY, (Date.now() + expiresInSeconds * 1000).toString());
      } else {
        sessionStorage.removeItem(STORAGE_KEY_TOKEN);
        sessionStorage.removeItem(STORAGE_KEY_EXPIRY);
      }
    }
  } catch {
    // Ignore storage restrictions if sandboxed
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const storedToken = sessionStorage.getItem(STORAGE_KEY_TOKEN);
      const storedExpiry = sessionStorage.getItem(STORAGE_KEY_EXPIRY);
      if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry, 10)) {
        cachedAccessToken = storedToken;
        return cachedAccessToken;
      }
      // If expired, clean up
      if (storedToken && storedExpiry && Date.now() >= parseInt(storedExpiry, 10)) {
        sessionStorage.removeItem(STORAGE_KEY_TOKEN);
        sessionStorage.removeItem(STORAGE_KEY_EXPIRY);
      }
    }
  } catch {
    // Ignore
  }
  return null;
};

/**
 * Sign in with Google Popup
 */
export const signInWithGoogle = async (): Promise<{ user: FirebaseUser | null; accessToken: string; cancelled?: boolean }> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      setCachedAccessToken(credential.accessToken);
    }
    return {
      user: result.user,
      accessToken: cachedAccessToken || '',
      cancelled: false
    };
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      // User dismissed or cancelled the popup dialog - gracefully return cancelled flag
      return {
        user: null,
        accessToken: '',
        cancelled: true
      };
    }
    if (error.code === 'auth/popup-blocked') {
      const friendlyErr = new Error('The sign-in popup was blocked by your browser. Please allow popups for this site, or use Email Sign In.');
      (friendlyErr as any).code = 'auth/popup-blocked';
      throw friendlyErr;
    }
    console.warn('Google Sign-In notice:', error.code || error.message);
    throw error;
  }
};

/**
 * Sign up with Email and Password
 */
export const signUpWithEmail = async (email: string, pass: string, displayName?: string): Promise<FirebaseUser> => {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && cred.user) {
    await updateProfile(cred.user, { displayName });
  }
  return cred.user;
};

/**
 * Sign in with Email and Password
 */
export const signInWithEmail = async (email: string, pass: string): Promise<FirebaseUser> => {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
};

/**
 * Send Password Reset Email
 */
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Sign out of Firebase
 */
export const logoutFirebase = async (): Promise<void> => {
  await signOut(auth);
  setCachedAccessToken(null);
};

/**
 * Firestore Helper: Save or Update a Document in a user's subcollection
 */
export const saveUserDocument = async (userId: string, subcollection: string, docId: string, data: any) => {
  const path = `users/${userId}/${subcollection}/${docId}`;
  try {
    const docRef = doc(db, 'users', userId, subcollection, docId);
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
};

/**
 * Firestore Helper: Save or Update a Family Invite document
 */
export const saveInviteDocument = async (inviteId: string, data: any) => {
  const path = `family_invites/${inviteId}`;
  try {
    const inviteRef = doc(db, 'family_invites', inviteId);
    await setDoc(inviteRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
};

/**
 * Firestore Helper: Get a Family Invite document
 */
export const getInviteDocument = async (inviteId: string): Promise<FamilyInvite | null> => {
  const path = `family_invites/${inviteId}`;
  try {
    const inviteRef = doc(db, 'family_invites', inviteId);
    const snap = await getDoc(inviteRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as FamilyInvite;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
};

/**
 * Firestore Helper: Update a Family Invite document
 */
export const updateInviteDocument = async (inviteId: string, data: any) => {
  const path = `family_invites/${inviteId}`;
  try {
    const inviteRef = doc(db, 'family_invites', inviteId);
    await setDoc(inviteRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    return false;
  }
};

/**
 * Firestore Helper: Delete a Document from a user's subcollection
 */
export const deleteUserDocument = async (userId: string, subcollection: string, docId: string) => {
  const path = `users/${userId}/${subcollection}/${docId}`;
  try {
    const docRef = doc(db, 'users', userId, subcollection, docId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return false;
  }
};

/**
 * Firestore Helper: Subscribe to real-time updates of a user's subcollection
 */
export const subscribeToUserSubcollection = <T>(
  userId: string, 
  subcollection: string, 
  onUpdate: (items: T[]) => void
) => {
  const path = `users/${userId}/${subcollection}`;
  const colRef = collection(db, 'users', userId, subcollection);
  return onSnapshot(colRef, (snapshot) => {
    const items: T[] = [];
    snapshot.forEach((d) => {
      items.push({ id: d.id, ...d.data() } as unknown as T);
    });
    onUpdate(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

/**
 * Firestore Helper: Subscribe to real-time updates of family invites created by this inviter
 */
export const subscribeToInviterInvites = (
  inviterUid: string, 
  onUpdate: (invites: FamilyInvite[]) => void
) => {
  const path = 'family_invites';
  const colRef = collection(db, 'family_invites');
  const q = query(colRef, where('inviterUid', '==', inviterUid));
  return onSnapshot(q, (snapshot) => {
    const invites: FamilyInvite[] = [];
    snapshot.forEach((d) => {
      invites.push({ id: d.id, ...d.data() } as FamilyInvite);
    });
    onUpdate(invites);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

/**
 * Save user profile info in Firestore root `users/{userId}`
 */
export const saveUserProfile = async (userId: string, profileData: any) => {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { ...profileData, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
};

/**
 * Fetch user profile from Firestore `users/{userId}`
 */
export const getUserProfile = async (userId: string) => {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
};

/**
 * Batch seed starter sample data to a user's Firestore database
 */
export const seedUserData = async (userId: string, data: Record<string, any[]>) => {
  try {
    for (const [subcollection, items] of Object.entries(data)) {
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item && item.id) {
            await saveUserDocument(userId, subcollection, item.id, item);
          }
        }
      }
    }
    return true;
  } catch (err) {
    console.error('Error seeding user data:', err);
    return false;
  }
};

/**
 * Invalidate all active/pending invites for a specific member or inviter
 */
export const cancelPendingInvitesForMember = async (
  inviterUid: string, 
  memberId?: string, 
  inviteIdsToCancel: string[] = [],
  statusToSet: 'superseded' | 'cancelled' = 'cancelled'
): Promise<boolean> => {
  try {
    const targetIds = new Set<string>(inviteIdsToCancel.filter(Boolean));
    if (inviterUid) {
      const colRef = collection(db, 'family_invites');
      const constraints = [where('inviterUid', '==', inviterUid), where('status', '==', 'pending')];
      if (memberId) {
        constraints.push(where('memberId', '==', memberId));
      }
      const q = query(colRef, ...constraints);
      const snap = await getDocs(q);
      snap.forEach(d => targetIds.add(d.id));
    }
    const updatePromises = Array.from(targetIds).map(id => updateInviteDocument(id, { status: statusToSet }));
    await Promise.all(updatePromises);
    return true;
  } catch (err) {
    console.warn('Error invalidating pending invites for member:', err);
    return false;
  }
};

/**
 * Delete all documents in all user subcollections in Firestore
 */
export const clearAllCloudUserData = async (userId: string): Promise<void> => {
  const subcollections = [
    'familyMembers',
    'medicines',
    'bills',
    'appointments',
    'transactionCategories',
    'transactions',
    'tasks',
    'taskLists',
    'notes',
    'medicalReports',
    'borrowings',
    'lendings',
    'savingsGoals',
  ];

  for (const subcol of subcollections) {
    try {
      const colRef = collection(db, 'users', userId, subcol);
      const snap = await getDocs(colRef);
      const deletes = snap.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(deletes);
    } catch (e) {
      console.warn(`Could not clear subcollection ${subcol} in Firestore:`, e);
    }
  }
};
