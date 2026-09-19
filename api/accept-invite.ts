import type { IncomingMessage, ServerResponse } from 'http';
import { getApps, initializeApp, cert, applicationDefault, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Lazy initialization of Firebase Admin SDK
function getFirebaseAdminApp(): App {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  const projectId = 
    process.env.FIREBASE_PROJECT_ID || 
    process.env.VITE_FIREBASE_PROJECT_ID || 
    'ai-studio-sproutunifiedhom-62e1094f-c5f7-49d7-91a6-67df5fa45e76';

  let credential;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_ADMIN_CREDENTIALS;

  if (serviceAccountKey) {
    try {
      const parsed = typeof serviceAccountKey === 'string' ? JSON.parse(serviceAccountKey) : serviceAccountKey;
      credential = cert(parsed);
    } catch (e) {
      console.warn('Could not parse FIREBASE_SERVICE_ACCOUNT credentials:', e);
      credential = applicationDefault();
    }
  } else {
    credential = applicationDefault();
  }

  try {
    return initializeApp({
      credential,
      projectId,
    });
  } catch (err: any) {
    if (!getApps().length) {
      console.warn('Admin initializeApp fallback:', err?.message);
      return initializeApp({ projectId });
    }
    return getApps()[0];
  }
}

interface AcceptInvitePayload {
  inviteId: string;
  name?: string;
}

/**
 * Serverless / API route handler to securely accept a family invite.
 * Verifies the caller's Firebase ID token and ensures the invite is genuine,
 * active, and targeted correctly before adding the member to households/{inviterUid}.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Missing or malformed Authorization header' }));
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  let body: AcceptInvitePayload;
  try {
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else if (req.body && typeof req.body === 'object') {
      body = req.body;
    } else {
      // Buffer stream if not pre-parsed by framework
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const data = Buffer.concat(buffers).toString();
      body = JSON.parse(data || '{}');
    }
  } catch (e) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Invalid JSON request body' }));
  }

  const { inviteId, name } = body;
  if (!inviteId) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'inviteId is required' }));
  }

  try {
    const adminApp = getFirebaseAdminApp();
    const auth = getAuth(adminApp);
    const db = getFirestore(adminApp);

    // 1. Verify caller identity using Firebase ID Token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (authError: any) {
      console.error('Failed to verify Firebase ID token:', authError);
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Invalid or expired Firebase ID token' }));
    }

    const callerUid = decodedToken.uid;
    const callerEmail = decodedToken.email || '';
    const callerName = name || decodedToken.name || 'Family Member';

    // 2. Perform atomic verification and acceptance in a single Firestore transaction
    const result = await db.runTransaction(async (transaction) => {
      const inviteRef = db.collection('family_invites').doc(inviteId);
      const inviteSnap = await transaction.get(inviteRef);

      if (!inviteSnap.exists) {
        return { error: 'Invitation not found', status: 404 };
      }

      const inviteData = inviteSnap.data() || {};

      // Verify status is pending
      if (inviteData.status !== 'pending') {
        return { error: 'This invitation is no longer pending or has expired', status: 400 };
      }

      // Verify targeted email and require email verification if targeted
      const targetEmail = inviteData.recipientEmail || inviteData.targetEmail;
      if (targetEmail) {
        if (!callerEmail || targetEmail.trim().toLowerCase() !== callerEmail.trim().toLowerCase()) {
          return { 
            error: `This invitation was issued for ${targetEmail}, but you are signed in as ${callerEmail || 'an account without an email'}`,
            status: 403 
          };
        }
        const isEmailVerified = Boolean(decodedToken.email_verified || decodedToken.firebase?.sign_in_provider === 'google.com');
        if (!isEmailVerified) {
          return {
            error: 'Please verify your email address or sign in with Google before accepting this invitation.',
            status: 403
          };
        }
      }

      const inviterUid = inviteData.inviterUid;
      if (!inviterUid) {
        return { error: 'Invalid invite record: missing inviterUid', status: 400 };
      }

      const now = new Date().toISOString();
      const householdRef = db.collection('households').doc(inviterUid);
      const householdSnap = await transaction.get(householdRef);

      if (householdSnap.exists) {
        transaction.update(householdRef, {
          [`members.${callerUid}`]: {
            role: 'member',
            name: callerName,
            email: callerEmail,
            joinedAt: now,
          },
          updatedAt: now,
        });
      } else {
        transaction.set(householdRef, {
          id: inviterUid,
          ownerUid: inviterUid,
          members: {
            [callerUid]: {
              role: 'member',
              name: callerName,
              email: callerEmail,
              joinedAt: now,
            },
          },
          createdAt: now,
          updatedAt: now,
        });
      }

      transaction.update(inviteRef, {
        status: 'accepted',
        acceptedAt: now,
        acceptedByUid: callerUid,
        acceptedByEmail: callerEmail,
        acceptedByName: callerName,
      });

      return {
        success: true,
        status: 200,
        householdId: inviterUid,
        member: {
          uid: callerUid,
          name: callerName,
          email: callerEmail,
          joinedAt: now,
        },
      };
    });

    if (result.error) {
      res.statusCode = result.status || 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: result.error }));
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify(result));
  } catch (error: any) {
    console.error('Error accepting invitation on server:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: error.message || 'Internal server error while accepting invite' }));
  }
}
