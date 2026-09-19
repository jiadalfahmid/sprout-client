import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getApps, initializeApp, cert, applicationDefault, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

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
    } catch {
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
  } catch {
    if (!getApps().length) {
      return initializeApp({ projectId });
    }
    return getApps()[0];
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Verify Firebase authentication token
  const authHeader = req.headers.authorization || (req.headers as any)?.Authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Authentication token required' });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  try {
    const adminApp = getFirebaseAdminApp();
    const adminAuth = getAuth(adminApp);
    await adminAuth.verifyIdToken(idToken);
  } catch (authError) {
    console.error('Image delete authorization failed:', authError);
    return res.status(401).json({ success: false, error: 'Invalid or expired authentication token' });
  }

  const { deleteUrl, imageId, deleteHash } = (req.body || {}) as {
    deleteUrl?: string;
    imageId?: string;
    deleteHash?: string;
  };

  if (!deleteUrl && (!imageId || !deleteHash)) {
    return res.status(400).json({ success: false, error: 'Missing deleteUrl or imageId/deleteHash' });
  }

  if (deleteUrl) {
    try {
      const parsedUrl = new URL(deleteUrl);
      if (parsedUrl.hostname !== 'ibb.co' && parsedUrl.hostname !== 'i.ibb.co') {
        return res.status(400).json({ success: false, error: 'Invalid deleteUrl host' });
      }
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid deleteUrl' });
    }
  }

  try {
    let targetId = imageId;
    let targetHash = deleteHash;

    if (deleteUrl && (!targetId || !targetHash)) {
      // Parse deleteUrl: https://ibb.co/2ndCYJK/670a7e48dd7842a4e487fe4233e773a1
      const urlObj = new URL(deleteUrl);
      const segments = urlObj.pathname.split('/').filter(Boolean);
      if (segments.length >= 2) {
        targetId = segments[0];
        targetHash = segments[1];
      }
    }

    let deletedProgrammatically = false;

    if (targetId && targetHash) {
      const form = new FormData();
      form.append('action', 'delete');
      form.append('delete', 'image');
      form.append('from', 'resource');
      form.append('deleting[id]', targetId);
      form.append('deleting[hash]', targetHash);

      const response = await fetch('https://ibb.co/json', {
        method: 'POST',
        body: form,
        headers: {
          'Referer': deleteUrl || `https://ibb.co/${targetId}/${targetHash}`,
        },
      });

      const json = await response.json().catch(() => null);
      if (json && (json.status_code === 200 || json.success)) {
        deletedProgrammatically = true;
      }
    }

    // Secondary fallback: call the deleteUrl directly
    if (!deletedProgrammatically && deleteUrl) {
      try {
        await fetch(deleteUrl, { method: 'GET' });
      } catch (err) {
        console.warn('Direct deleteUrl fetch notice:', err);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Image delete request processed',
      deletedProgrammatically 
    });
  } catch (err: any) {
    console.error('Error deleting image from storage:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Failed to delete image' });
  }
}
