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

export interface UploadImageResult {
  url: string;
  deleteUrl?: string;
  imageId?: string;
}

const directUploadStorage = async (imageBase64: string): Promise<UploadImageResult | null> => {
  const apiKey = (import.meta as any).env?.VITE_IMGBB_API_KEY;
  const rawBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  const form = new FormData();
  form.append('image', rawBase64);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (data?.success && data?.data?.url) {
    return {
      url: data.data.url as string,
      deleteUrl: data.data.delete_url as string | undefined,
      imageId: data.data.id as string | undefined,
    };
  }
  throw new Error(data?.error?.message || 'Image upload rejected');
};

/**
 * Uploads an image via our server route (/api/upload-image), with automatic fallback
 * to direct cloud upload using the configured key. Returns full metadata including deleteUrl.
 */
export const uploadImageWithDetails = async (imageFile: File): Promise<UploadImageResult | null> => {
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
          return {
            url: result.url as string,
            deleteUrl: result.deleteUrl as string | undefined,
            imageId: result.imageId as string | undefined,
          };
        }
      } catch (proxyErr) {
        console.warn('Server proxy upload failed, attempting direct upload:', proxyErr);
      }
    }

    // Direct upload fallback using cloud storage API key
    const directResult = await directUploadStorage(imageBase64);
    if (directResult) {
      return directResult;
    }

    toast.error('Image upload failed.');
    return null;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    toast.error(error?.message || 'An unexpected error occurred during image upload.');
    return null;
  }
};

/**
 * Standard upload returning url string for backward compatibility.
 */
export const uploadImage = async (imageFile: File): Promise<string | null> => {
  const res = await uploadImageWithDetails(imageFile);
  return res?.url || null;
};

/**
 * Delete image from cloud storage using server proxy or deleteUrl
 */
export const deleteHostedImage = async (
  deleteUrl?: string, 
  imageId?: string, 
  deleteHash?: string
): Promise<boolean> => {
  if (!deleteUrl && (!imageId || !deleteHash)) {
    return false;
  }

  const currentUser = auth.currentUser;
  let idToken = '';
  if (currentUser) {
    try {
      idToken = await currentUser.getIdToken();
    } catch (err) {
      console.warn('Failed to retrieve token for delete:', err);
    }
  }

  try {
    if (idToken) {
      const response = await fetch('/api/delete-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ deleteUrl, imageId, deleteHash }),
      });

      const data = await response.json().catch(() => null);
      if (data && data.success) {
        return true;
      }
    }

    // Fallback: if deleteUrl is available and server proxy isn't, attempt direct client fetch
    if (deleteUrl) {
      try {
        await fetch(deleteUrl, { method: 'GET', mode: 'no-cors' });
        return true;
      } catch {
        // Ignored
      }
    }

    return false;
  } catch (err) {
    console.warn('Error deleting image from storage:', err);
    return false;
  }
};
