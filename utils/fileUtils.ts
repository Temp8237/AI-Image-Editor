
export function fileToBase64(file: File): Promise<{ base64Data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // The result is a data URL like "data:image/png;base64,iVBORw0KGgo..."
      // We need to extract the base64 part.
      const base64Data = result.split(',')[1];
      if (!base64Data) {
          reject(new Error("Could not extract base64 data from file."));
          return;
      }
      resolve({ base64Data, mimeType: file.type });
    };
    reader.onerror = (error) => reject(error);
  });
}
