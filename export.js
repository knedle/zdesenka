import { computeScaledDimensions } from './geometry.js';

export function composeImage(background, logo, logoImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = background.width;
  canvas.height = background.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(background.bitmap, 0, 0, background.width, background.height);

  if (logo) {
    const { width: logoWidth, height: logoHeight } = computeScaledDimensions(
      logoImageElement.naturalWidth,
      logoImageElement.naturalHeight,
      logo.scale
    );
    ctx.drawImage(
      logoImageElement,
      logo.x - logoWidth / 2,
      logo.y - logoHeight / 2,
      logoWidth,
      logoHeight
    );
  }

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
