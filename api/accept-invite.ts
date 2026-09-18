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

    // 2. Fetch the target invite document from Firestore
    const inviteRef = db.collection('family_invites').doc(inviteId);
    const inviteSnap = await inviteRef.get();

    if (!inviteSnap.exists) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Invitation not found' }));
    }

    const inviteData = inviteSnap.data() || {};

    // 3. Verify status is pending
    if (inviteData.status !== 'pending') {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'This invitation is no longer pending or has expired' }));
    }

    // 4. Verify targeted email if specified
    const targetEmail = inviteData.recipientEmail || inviteData.targetEmail;
    if (targetEmail) {
      if (!callerEmail || targetEmail.trim().toLowerCase() !== callerEmail.trim().toLowerCase()) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ 
          error: `This invitation was issued for ${targetEmail}, but you are signed in as ${callerEmail || 'an account without an email'}` 
        }));
      }
    }

    const inviterUid = inviteData.inviterUid;
    if (!inviterUid) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Invalid invite record: missing inviterUid' }));
    }

    const now = new Date().toISOString();

    // 5. Update household document with the verified member
    const householdRef = db.collection('households').doc(inviterUid);
    await householdRef.update({
      [`members.${callerUid}`]: {
        role: 'member',
        name: callerName,
        email: callerEmail,
        joinedAt: now,
      },
      updatedAt: now,
    });

    // 6. Mark invite document as accepted
    await inviteRef.update({
      status: 'accepted',
      acceptedAt: now,
      acceptedByUid: callerUid,
      acceptedByEmail: callerEmail,
      acceptedByName: callerName,
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: true,
      householdId: inviterUid,
      member: {
        uid: callerUid,
        name: callerName,
        email: callerEmail,
        joinedAt: now,
      }
    }));
  } catch (error: any) {
    console.error('Error accepting invitation on server:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: error.message || 'Internal server error while accepting invite' }));
  }
}
