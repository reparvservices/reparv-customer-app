import {Platform} from 'react-native';
import {API_BASE_URL} from '../config/api';

const API_URL = `${API_BASE_URL}/api/s3/signed-url/get`;

export const uploadToS3 = async (image, folder = 'uploads') => {
  try {
    // 1️⃣ get signed url
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: image.fileName || `photo-${Date.now()}.jpg`,
        fileType: image.type || 'image/jpeg',
        folder: 'uploads',
      }),
    });

    const {uploadUrl, fileUrl} = await res.json();

    // 2️⃣ convert image to blob
    const blob = await fetch(image.uri).then(r => r.blob());

    // 3️⃣ upload to s3
    await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': image.type || 'image/jpeg',
      },
      body: blob,
    });

    console.log(fileUrl);

    return fileUrl;
  } catch (err) {
    console.log('S3 Upload Error:', err);
    return null;
  }
};
