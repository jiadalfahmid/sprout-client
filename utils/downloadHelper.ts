/**
 * Robust file downloader that fetches the resource as a blob to trigger a genuine
 * browser download prompt with the specified filename, falling back to direct anchor link.
 */
export const downloadFile = async (url: string, filename: string): Promise<boolean> => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    // Derive file extension if not present in filename
    let finalFilename = filename;
    if (!finalFilename.includes('.')) {
      const mime = blob.type;
      if (mime.includes('jpeg') || mime.includes('jpg')) finalFilename += '.jpg';
      else if (mime.includes('png')) finalFilename += '.png';
      else if (mime.includes('pdf')) finalFilename += '.pdf';
      else if (mime.includes('webp')) finalFilename += '.webp';
    }

    const anchor = document.createElement('a');
    anchor.style.display = 'none';
    anchor.href = blobUrl;
    anchor.download = finalFilename;
    document.body.appendChild(anchor);
    anchor.click();
    
    setTimeout(() => {
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl);
    }, 2000);

    return true;
  } catch (error) {
    console.warn('Blob download fetch failed, attempting anchor fallback:', error);
    try {
      const anchor = document.createElement('a');
      anchor.style.display = 'none';
      anchor.href = url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => {
        document.body.removeChild(anchor);
      }, 1000);
      return true;
    } catch (fallbackError) {
      console.error('File download completely failed:', fallbackError);
      return false;
    }
  }
};
