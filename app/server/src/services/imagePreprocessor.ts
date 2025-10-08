import { createHash } from 'crypto';
import { tmpdir } from 'os';
import path from 'path';
import { promises as fs } from 'fs';

type SharpModule = typeof import('sharp');

let sharpPromise: Promise<SharpModule | null> | null = null;

async function loadSharp(): Promise<SharpModule | null> {
  if (!sharpPromise) {
    sharpPromise = import('sharp')
      .then(mod => mod.default || mod)
      .catch(() => null);
  }
  return sharpPromise;
}

function createTempPath(prefix: string, ext: string): string {
  const unique = createHash('md5')
    .update(String(Date.now()) + Math.random())
    .digest('hex')
    .slice(0, 12);
  return path.join(tmpdir(), `${prefix}-${unique}.${ext}`);
}

export async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  const sharp = await loadSharp();
  if (!sharp) return buffer;

  try {
    // Apply rotations/orientation, resize to manageable resolution, boost contrast.
    const pipeline = sharp(buffer)
      .rotate() // respect EXIF orientation
      .grayscale()
      .resize({
        width: 1800,
        height: 1800,
        fit: 'inside',
        withoutEnlargement: true
      })
      .normalize()
      .png({ compressionLevel: 0 });

    return await pipeline.toBuffer();
  } catch (err) {
    console.warn('Image preprocessing failed, using original buffer', err);
    return buffer;
  }
}

export async function writeTempImage(buffer: Buffer): Promise<{ inputPath: string; cleanup: () => Promise<void> }> {
  const inputPath = createTempPath('ocr-image', 'png');
  await fs.writeFile(inputPath, buffer);

  return {
    inputPath,
    cleanup: async () => {
      try {
        await fs.unlink(inputPath);
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.warn('Failed to remove temp image', err);
        }
      }
    }
  };
}
