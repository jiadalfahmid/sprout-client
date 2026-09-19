import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getApps, initializeApp, cert, applicationDefault, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const MAX_BYTES = 10 * 1024 * 1024;

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

  // Verify Firebase authentication token before accessing third-party upload services
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
    console.error('Image upload authorization failed:', authError);
    return res.status(401).json({ success: false, error: 'Invalid or expired authentication token' });
  }

  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    console.error('IMGBB_API_KEY is not configured on the server');
    return res.status(500).json({ success: false, error: 'Image upload is not configured' });
  }

  const { imageBase64 } = (req.body || {}) as { imageBase64?: string };
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing image data' });
  }

  const approxBytes = Math.ceil((imageBase64.length * 3) / 4);
  if (approxBytes > MAX_BYTES) {
    return res.status(413).json({ success: false, error: 'File exceeds 10MB limit' });
  }

  try {
    const rawBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const form = new FormData();
    form.append('image', rawBase64);

    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: form,
    });
    const result = await imgbbRes.json();

    if (result?.success && result?.data?.url) {
      return res.status(200).json({ 
        success: true, 
        url: result.data.url as string,
        deleteUrl: result.data.delete_url as string | undefined,
        imageId: result.data.id as string | undefined,
      });
    }

    const providerError = result?.error?.message || 'Upload provider rejected the image';
    console.error('Image provider rejected upload:', providerError, result);
    return res.status(502).json({ success: false, error: providerError });
  } catch (err) {
    console.error('Error proxying image upload:', err);
    return res.status(500).json({ success: false, error: 'Unexpected server error during upload' });
  }
}
