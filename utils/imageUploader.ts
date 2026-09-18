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

/**
 * Uploads an image via our own server route (api/upload-image), which holds
 * the ImgBB key server-side. No third-party API key ever touches the client
 * bundle. Requires an authenticated user session.
 */
export const uploadImage = async (imageFile: File): Promise<string | null> => {
  if (imageFile.size > MAX_BYTES) {
    toast.error('File exceeds 10MB limit. Please choose a smaller file.');
    return null;
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    toast.error('You must be signed in to upload images');
    return null;
  }

  let idToken = '';
  try {
    idToken = await currentUser.getIdToken();
  } catch (err) {
    console.error('Failed to retrieve authentication token for upload:', err);
    toast.error('Authentication session expired. Please re-sign in.');
    return null;
  }

  try {
    const imageBase64 = await fileToBase64(imageFile);

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

    const errorMessage = result?.error || (response.ok ? 'Server rejected image' : `Server error (${response.status})`);
    console.error('Image upload failed:', errorMessage);
    toast.error(`Image upload failed: ${errorMessage}`);
    return null;
  } catch (error) {
    console.error('Error uploading image:', error);
    toast.error('An unexpected error occurred during image upload.');
    return null;
  }
};
