import toast from 'react-hot-toast';
import { auth } from '../services/firebaseService';

const MAX_BYTES = 10 * 1024 * 1024;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const directUploadImgBB = async (imageBase64: string): Promise<string | null> => {
  const apiKey = (import.meta as any).env?.VITE_IMGBB_API_KEY || 'e8fe38eae4d004d9feed640cab63d8e8';
  const rawBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  const form = new FormData();
  form.append('image', rawBase64);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (data?.success && data?.data?.url) {
    return data.data.url as string;
  }
  throw new Error(data?.error?.message || 'ImgBB upload rejected');
};

/**
 * Uploads an image via our server route (api/upload-image), with automatic fallback
 * to direct ImgBB upload using the configured key.
 */
export const uploadImage = async (imageFile: File): Promise<string | null> => {
  if (imageFile.size > MAX_BYTES) {
    toast.error('File exceeds 10MB limit. Please choose a smaller file.');
    return null;
  }

  const currentUser = auth.currentUser;
  let idToken = '';
  if (currentUser) {
    try {
      idToken = await currentUser.getIdToken();
    } catch (err) {
      console.warn('Failed to retrieve authentication token for upload:', err);
    }
  }

  try {
    const imageBase64 = await fileToBase64(imageFile);

    // Try server proxy first if token is available
    if (idToken) {
      try {
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ imageBase64 }),
        });

        let result: any = null;
        const text = await response.text();
        if (text) {
          try {
            result = JSON.parse(text);
          } catch {
            result = null;
          }
        }

        if (result && result.success && result.url) {
          return result.url as string;
        }
      } catch (proxyErr) {
        console.warn('Server proxy upload failed, attempting direct upload:', proxyErr);
      }
    }

    // Direct upload fallback using ImgBB API key
    const directUrl = await directUploadImgBB(imageBase64);
    if (directUrl) {
      return directUrl;
    }

    toast.error('Image upload failed.');
    return null;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    toast.error(error?.message || 'An unexpected error occurred during image upload.');
    return null;
  }
};
