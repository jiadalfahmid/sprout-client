import {
  auth,
  SCOPES,
  signInWithGoogle,
  getAccessToken,
  setCachedAccessToken,
  logoutFirebase
} from './firebaseService';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export { auth, SCOPES, getAccessToken, setCachedAccessToken };

export const googleSignIn = signInWithGoogle;
export const logoutGoogle = logoutFirebase;

export const initAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      const token = await getAccessToken();
      if (onAuthSuccess) {
        onAuthSuccess(user, token);
      }
    } else {
      setCachedAccessToken(null);
      if (onAuthFailure) {
        onAuthFailure();
      }
    }
  });
};

