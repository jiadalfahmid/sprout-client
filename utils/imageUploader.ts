const API_KEY = 'e8fe38eae4d004d9feed640cab63d8e8';

export const uploadImage = async (imageFile: File): Promise<string | null> => {
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
      console.error('Image upload failed:', result.error.message);
      // In a real app, you'd want to show a user-facing error.
      alert(`Image upload failed: ${result.error.message}`);
      return null;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    alert('An unexpected error occurred during image upload.');
    return null;
  }
};
