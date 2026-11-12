export const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;

export type SupportedProductImage = {
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: 'jpg' | 'png' | 'webp';
};

function matchesAscii(bytes: Uint8Array, offset: number, value: string): boolean {
  return [...value].every((character, index) => bytes[offset + index] === character.charCodeAt(0));
}

export function detectProductImageType(bytes: Uint8Array): SupportedProductImage | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { contentType: 'image/jpeg', extension: 'jpg' };
  }

  const isPng =
    bytes.length >= 24 &&
    bytes[0] === 0x89 &&
    matchesAscii(bytes, 1, 'PNG\r\n\x1a\n') &&
    matchesAscii(bytes, 12, 'IHDR');
  if (isPng) {
    return { contentType: 'image/png', extension: 'png' };
  }

  const isWebp =
    bytes.length >= 12 && matchesAscii(bytes, 0, 'RIFF') && matchesAscii(bytes, 8, 'WEBP');
  if (isWebp) {
    return { contentType: 'image/webp', extension: 'webp' };
  }

  return null;
}
