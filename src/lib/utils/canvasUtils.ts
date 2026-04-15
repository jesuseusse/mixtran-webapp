/**
 * Canvas utility for cropping images client-side.
 * Used by ImageUploader before the file is compressed and uploaded.
 */

/** A pixel-level crop area as returned by react-easy-crop's onCropComplete callback. */
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Creates a new HTMLImageElement from a src string and waits for it to load.
 * Sets crossOrigin="anonymous" to avoid canvas taint with remote URLs.
 */
function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Crops an image to the specified pixel area and returns a File in WebP format.
 *
 * The canvas background is filled white before drawing to avoid transparent
 * regions being rendered as black in WebP (which does not support transparency
 * as well as PNG).
 *
 * @param imageSrc  - Data URL or remote URL of the source image.
 * @param cropArea  - Pixel coordinates of the crop region (from react-easy-crop).
 * @param quality   - WebP quality 0–1. @default 0.92
 * @param fileName  - Base name for the returned File. @default "cropped"
 */
export async function getCroppedImg(
  imageSrc: string,
  cropArea: CropArea,
  quality = 0.92,
  fileName = "cropped"
): Promise<File> {
  const img = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = cropArea.width;
  canvas.height = cropArea.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("getCroppedImg: could not get 2D context");

  /* Fill white background — avoids black transparent areas in WebP output. */
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(
    img,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("getCroppedImg: canvas.toBlob returned null"));
          return;
        }
        resolve(new File([blob], `${fileName}.webp`, { type: "image/webp" }));
      },
      "image/webp",
      quality
    );
  });
}
