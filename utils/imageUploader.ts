import toast from 'react-hot-toast';

/**
 * SECURITY NOTE / ARCHITECTURAL FOLLOW-UP:
 * The ImgBB API key below is currently included directly in client code.
 * Because environment variables prefixed with VITE_ or bundled into client JS are
 * extractable from browser devtools, moving it to an environment variable does not hide it.
 * Production hardening requires routing image uploads through a backend proxy route
 * (e.g. Express `/api/upload` endpoint or Firebase Cloud Function) that holds the API key
 * server-side and manages rate limiting and user quota.
 */
const API_KEY = 'e8fe38eae4d004d9feed640cab63d8e8';

export const uploadImage = async (imageFile: File): Promise<string | null> => {
  if (imageFile.size > 10 * 1024 * 1024) {
    toast.error('File exceeds 10MB limit. Please choose a smaller file.');
    return null;
  }

  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      return result.data.url;
    } else {
      console.error('Image upload failed:', result.error?.message || result);
      toast.error(`Image upload failed: ${result.error?.message || 'Server rejected image'}`);
      return null;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    toast.error('An unexpected error occurred during image upload.');
    return null;
  }
};
