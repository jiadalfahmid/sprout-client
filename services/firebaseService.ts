import { initializeApp, getApps, getApp } from 'firebase/app';
import toast from 'react-hot-toast';
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
  deleteField,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { FamilyInvite, Household, HouseholdMemberInfo, UserHouseholdMembership } from '../types';

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
      // Without this, setDoc()/updateDoc() THROW on any field whose value is
      // `undefined` (e.g. transaction.memberId when "Shared/Household" is
      // selected). That throw was being silently swallowed by
      // handleFirestoreError below, so the write never reached Firestore
      // while the UI had already optimistically added the item — it would
      // then vanish the next time the collection's onSnapshot listener
      // refreshed from the server. This makes the SDK drop undefined fields
      // instead of rejecting the whole write.
      ignoreUndefinedProperties: true,
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
 * Strips keys whose value is `undefined` before a Firestore write (recursively in nested objects/arrays).
 * Belt-and-suspenders alongside `ignoreUndefinedProperties`: this ensures
 * doc writes can never be rejected by an explicit `undefined` field
 * regardless of how Firestore was initialized or how this instance was constructed.
 */
export const stripUndefined = <T = any>(data: T): T => {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map(item => stripUndefined(item)) as unknown as T;
  }
  if (typeof data !== 'object' || data instanceof Date) {
    return data;
  }
  const cleaned: Record<string, any> = {};
  Object.keys(data as Record<string, any>).forEach((key) => {
    const val = (data as Record<string, any>)[key];
    if (val !== undefined) {
      cleaned[key] = stripUndefined(val);
    }
  });
  return cleaned as T;
};

/**
 * Firestore Helper: Save or Update a Document in a user's subcollection
 */
export const saveUserDocument = async (userId: string, subcollection: string, docId: string, data: any) => {
  const path = `users/${userId}/${subcollection}/${docId}`;
  try {
    const docRef = doc(db, 'users', userId, subcollection, docId);
    await setDoc(docRef, { ...stripUndefined(data), updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    if (typeof window !== 'undefined') {
      toast.error('Cloud sync error: Record could not be saved to Firestore.', { id: 'firestore-write-error' });
    }
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
    await setDoc(inviteRef, { ...stripUndefined(data), updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    if (typeof window !== 'undefined') {
      toast.error('Cloud sync error: Invitation could not be saved to Firestore.', { id: 'firestore-write-error' });
    }
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
    await setDoc(inviteRef, { ...stripUndefined(data), updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    if (typeof window !== 'undefined') {
      toast.error('Cloud sync error: Invitation could not be updated in Firestore.', { id: 'firestore-write-error' });
    }
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
    if (typeof window !== 'undefined') {
      toast.error('Cloud sync error: Record could not be deleted from Firestore.', { id: 'firestore-delete-error' });
    }
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
    await setDoc(userRef, { ...stripUndefined(profileData), updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    if (typeof window !== 'undefined') {
      toast.error('Cloud sync error: Profile could not be saved to Firestore.', { id: 'firestore-write-error' });
    }
    return false;
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

/**
 * Fetch a household document by householdId
 */
export const getHousehold = async (householdId: string): Promise<Household | null> => {
  const path = `households/${householdId}`;
  try {
    const householdRef = doc(db, 'households', householdId);
    const snap = await getDoc(householdRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Household;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
};

/**
 * Ensure the user's personal household document exists (creates if missing)
 */
export const ensureHousehold = async (
  userId: string,
  userInfo: { name?: string; email?: string }
): Promise<Household | null> => {
  const path = `households/${userId}`;
  try {
    const householdRef = doc(db, 'households', userId);
    const snap = await getDoc(householdRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Household;
    }

    const initialHousehold: Household = {
      name: `${userInfo.name ? `${userInfo.name}'s ` : ''}Family Circle`,
      ownerUid: userId,
      ownerName: userInfo.name || 'Family Organizer',
      ownerEmail: userInfo.email || '',
      members: {
        [userId]: {
          role: 'owner',
          name: userInfo.name || 'Household Owner',
          email: userInfo.email || '',
          joinedAt: new Date().toISOString(),
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(householdRef, stripUndefined(initialHousehold));
    return initialHousehold;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return null;
  }
};

/**
 * Fetch user's household membership document
 */
export const getUserHouseholdMembership = async (userId: string): Promise<UserHouseholdMembership | null> => {
  const path = `user_household_memberships/${userId}`;
  try {
    const memRef = doc(db, 'user_household_memberships', userId);
    const snap = await getDoc(memRef);
    if (snap.exists()) {
      return snap.data() as UserHouseholdMembership;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
};

/**
 * Save user household membership document
 */
export const saveUserHouseholdMembership = async (
  userId: string, 
  data: UserHouseholdMembership
): Promise<boolean> => {
  const path = `user_household_memberships/${userId}`;
  try {
    const memRef = doc(db, 'user_household_memberships', userId);
    await setDoc(memRef, { ...stripUndefined(data), updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
};

/**
 * Ensure user's household membership document exists
 */
export const ensureUserHouseholdMembership = async (
  userId: string
): Promise<UserHouseholdMembership> => {
  const path = `user_household_memberships/${userId}`;
  try {
    const memRef = doc(db, 'user_household_memberships', userId);
    const snap = await getDoc(memRef);
    if (snap.exists()) {
      const data = snap.data() as UserHouseholdMembership;
      const rawIds = Array.isArray(data.householdIds) ? data.householdIds : [userId];
      const householdIds = Array.from(new Set(rawIds.length > 0 ? rawIds : [userId]));
      const activeHouseholdId = data.activeHouseholdId || userId;
      return {
        householdIds,
        activeHouseholdId,
        updatedAt: data.updatedAt,
      };
    }

    const initial: UserHouseholdMembership = {
      householdIds: [userId],
      activeHouseholdId: userId,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(memRef, stripUndefined(initial));
    return initial;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return {
      householdIds: [userId],
      activeHouseholdId: userId,
    };
  }
};

/**
 * Subscribe to user's household membership changes
 */
export const subscribeToUserHouseholdMembership = (
  userId: string,
  onUpdate: (membership: UserHouseholdMembership | null) => void
) => {
  const path = `user_household_memberships/${userId}`;
  const memRef = doc(db, 'user_household_memberships', userId);
  return onSnapshot(memRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.data() as UserHouseholdMembership);
    } else {
      onUpdate(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

/**
 * Subscribe to a household document
 */
export const subscribeToHousehold = (
  householdId: string,
  onUpdate: (household: Household | null) => void
) => {
  const path = `households/${householdId}`;
  const householdRef = doc(db, 'households', householdId);
  return onSnapshot(householdRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate({ id: snapshot.id, ...snapshot.data() } as Household);
    } else {
      onUpdate(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
};

/**
 * Call the secure serverless API endpoint to accept an invitation
 */
export const acceptInviteViaApi = async (
  inviteId: string,
  idToken: string,
  name?: string
): Promise<{ success: boolean; householdId?: string; error?: string }> => {
  try {
    const res = await fetch('/api/accept-invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ inviteId, name }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || `Server returned ${res.status}` };
    }
    return { success: true, householdId: data.householdId };
  } catch (err: any) {
    console.warn('Call to /api/accept-invite failed:', err);
    return { success: false, error: err.message || 'Network error calling /api/accept-invite' };
  }
};

/**
 * Add or confirm a member in a household document by the household owner
 */
export const addUserToHouseholdByOwner = async (
  householdId: string, 
  memberUid: string, 
  memberInfo: HouseholdMemberInfo
): Promise<boolean> => {
  const path = `households/${householdId}`;
  try {
    const householdRef = doc(db, 'households', householdId);
    await updateDoc(householdRef, {
      [`members.${memberUid}`]: stripUndefined(memberInfo),
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    return false;
  }
};

/**
 * Register a joined household in the user's personal membership document
 */
export const registerJoinedHousehold = async (
  userId: string,
  householdId: string,
  setActiveIfConfirmed: boolean = true
): Promise<boolean> => {
  const currentMembership = await getUserHouseholdMembership(userId);
  const existingIds = currentMembership?.householdIds || [userId];
  const newHouseholdIds = Array.from(new Set([...existingIds, householdId]));

  let newActiveId = currentMembership?.activeHouseholdId || userId;
  if (setActiveIfConfirmed) {
    if (householdId === userId) {
      newActiveId = userId;
    } else {
      const targetHousehold = await getHousehold(householdId);
      if (targetHousehold?.members && userId in targetHousehold.members) {
        newActiveId = householdId;
      }
    }
  }

  return saveUserHouseholdMembership(userId, {
    householdIds: newHouseholdIds,
    activeHouseholdId: newActiveId,
    updatedAt: new Date().toISOString(),
  });
};

/**
 * Add a member to a household (after accepting an invite)
 * In client-side execution, only the owner can write to household doc,
 * while members register in their personal membership document.
 */
export const addUserToHousehold = async (
  householdId: string, 
  memberUid: string, 
  memberInfo: HouseholdMemberInfo
): Promise<boolean> => {
  // If the caller is the owner of the household, update the household doc directly
  if (householdId === memberUid) {
    await addUserToHouseholdByOwner(householdId, memberUid, memberInfo);
  }
  return registerJoinedHousehold(memberUid, householdId);
};

/**
 * Leave a joined household (non-owner only)
 */
export const leaveHousehold = async (
  householdId: string,
  memberUid: string
): Promise<boolean> => {
  if (householdId === memberUid) {
    return false;
  }
  const path = `households/${householdId}`;
  try {
    const householdRef = doc(db, 'households', householdId);
    await updateDoc(householdRef, {
      [`members.${memberUid}`]: deleteField(),
      updatedAt: new Date().toISOString(),
    });

    const currentMembership = await getUserHouseholdMembership(memberUid);
    const existingIds = currentMembership?.householdIds || [memberUid];
    const newHouseholdIds = existingIds.filter(id => id !== householdId);
    if (!newHouseholdIds.includes(memberUid)) {
      newHouseholdIds.unshift(memberUid);
    }

    await saveUserHouseholdMembership(memberUid, {
      householdIds: newHouseholdIds,
      activeHouseholdId: memberUid,
      updatedAt: new Date().toISOString(),
    });

    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    return false;
  }
};

/**
 * Switch active household for a user, validating verified membership
 */
export const switchActiveHousehold = async (
  userId: string,
  newActiveHouseholdId: string
): Promise<boolean> => {
  // If switching to another household circle, verify caller is in that household's members map
  if (newActiveHouseholdId !== userId) {
    const targetHousehold = await getHousehold(newActiveHouseholdId);
    if (!targetHousehold || !targetHousehold.members || !(userId in targetHousehold.members)) {
      console.warn(`Cannot switch: User ${userId} is not a verified member of household ${newActiveHouseholdId}`);
      return false;
    }
  }

  const currentMembership = await getUserHouseholdMembership(userId);
  const existingIds = currentMembership?.householdIds || [userId];
  const newHouseholdIds = Array.from(new Set([...existingIds, newActiveHouseholdId]));

  return saveUserHouseholdMembership(userId, {
    householdIds: newHouseholdIds,
    activeHouseholdId: newActiveHouseholdId,
    updatedAt: new Date().toISOString(),
  });
};