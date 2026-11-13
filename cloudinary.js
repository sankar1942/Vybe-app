// ================= CLOUDINARY + AUTO IMAGE COMPRESSION (UNLIMITED MEDIA) =================
const CLOUDINARY_CLOUD_NAME = "horz4y26";
const CLOUDINARY_UPLOAD_PRESET = "vybe_unsigned";

async function compressImageForVybe(file, maxWidth = 1080, quality = 0.8) {
  if (!file || !file.type || !file.type.startsWith("image/")) return file;
  if (typeof highQualityUploads !== "undefined" && highQualityUploads) {
    maxWidth = 1920;
    quality = 0.9;
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

async function uploadToCloudinary(rawFile, onProgress) {
  const optimizedFile = await compressImageForVybe(rawFile);
  const resourceType = optimizedFile.type && optimizedFile.type.startsWith("video/") ? "video" : "image";
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", optimizedFile);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(Math.min(99, Math.floor((event.loaded / event.total) * 100)));
      }
    });
    xhr.addEventListener("load", () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        let msg = "";
        try {
          const parsed = JSON.parse(xhr.responseText);
          msg = parsed.error?.message || "";
        } catch (_) {}
        return reject(new Error(msg || `Cloudinary upload failed (${xhr.status})`));
      }
      try {
        const data = JSON.parse(xhr.responseText);
        if (!data.secure_url) return reject(new Error("Cloudinary did not return a secure URL."));
        onProgress?.(100);
        resolve(data.secure_url);
      } catch (err) {
        reject(new Error("Invalid response from Cloudinary."));
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Network error while uploading to Cloudinary.")));
    xhr.send(formData);
  });
}
