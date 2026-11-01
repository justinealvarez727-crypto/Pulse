/** Down-scale a user photo to ≤480px JPEG so localStorage doesn't blow its quota. */
export async function shrinkImage(file: File, max = 480): Promise<string> {
  const url = URL.createObjectURL(file); const img = new Image(); img.src = url; await img.decode();
  const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k;
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); return c.toDataURL('image/jpeg', 0.7);
}
