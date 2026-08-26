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
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  deleteDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App instance
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Initialize Firestore with specific database ID if present in config
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

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

// Cached in-memory access token for Google API calls
let cachedAccessToken: string | null = null;

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Sign in with Google Popup
 */
export const signInWithGoogle = async (): Promise<{ user: FirebaseUser; accessToken: string }> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return {
      user: result.user,
      accessToken: cachedAccessToken || ''
    };
  } catch (error: any) {
    console.warn('Google Sign-In notice:', error.code || error.message);
    if (error.code === 'auth/popup-blocked') {
      const friendlyErr = new Error('The sign-in popup was blocked by your browser. Please allow popups for this site, or use Email Sign In.');
      (friendlyErr as any).code = 'auth/popup-blocked';
      throw friendlyErr;
    } else if (error.code === 'auth/popup-closed-by-user') {
      const friendlyErr = new Error('Sign in window was closed before completing.');
      (friendlyErr as any).code = 'auth/popup-closed-by-user';
      throw friendlyErr;
    } else if (error.code === 'auth/cancelled-popup-request') {
      const friendlyErr = new Error('Authentication request was cancelled.');
      (friendlyErr as any).code = 'auth/cancelled-popup-request';
      throw friendlyErr;
    }
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
  cachedAccessToken = null;
};

/**
 * Firestore Helper: Save or Update a Document in a user's subcollection
 */
export const saveUserDocument = async (userId: string, subcollection: string, docId: string, data: any) => {
  try {
    const docRef = doc(db, 'users', userId, subcollection, docId);
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    console.error(`Error saving document to users/${userId}/${subcollection}/${docId}:`, err);
    return false;
  }
};

/**
 * Firestore Helper: Delete a Document from a user's subcollection
 */
export const deleteUserDocument = async (userId: string, subcollection: string, docId: string) => {
  try {
    const docRef = doc(db, 'users', userId, subcollection, docId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error(`Error deleting document from users/${userId}/${subcollection}/${docId}:`, err);
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
  const colRef = collection(db, 'users', userId, subcollection);
  return onSnapshot(colRef, (snapshot) => {
    const items: T[] = [];
    snapshot.forEach((d) => {
      items.push({ id: d.id, ...d.data() } as unknown as T);
    });
    onUpdate(items);
  }, (error) => {
    console.warn(`Real-time subscription notice for ${subcollection}:`, error.message);
  });
};

/**
 * Save user profile info in Firestore root `users/{userId}`
 */
export const saveUserProfile = async (userId: string, profileData: any) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { ...profileData, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.error('Error saving user profile to Firestore:', err);
  }
};

/**
 * Fetch user profile from Firestore `users/{userId}`
 */
export const getUserProfile = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.error('Error fetching user profile:', err);
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
