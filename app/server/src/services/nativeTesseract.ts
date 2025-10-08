import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';

const execFileAsync = promisify(execFile);

interface NativeResult {
  text: string;
  confidence?: number;
}

let nativeAvailable: boolean | null = null;

async function ensureBinary(): Promise<boolean> {
  if (nativeAvailable !== null) return nativeAvailable;
  try {
    await execFileAsync('tesseract', ['--version']);
    nativeAvailable = true;
  } catch (err) {
    console.warn('Native tesseract not found or failed to start', err);
    nativeAvailable = false;
  }
  return nativeAvailable;
}

function createOutputPath(): string {
  const unique = Math.random().toString(36).slice(2, 10);
  return path.join(tmpdir(), `ocr-${unique}`);
}

async function readTextFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (err) {
    console.error('Failed to read tesseract output', err);
    throw err;
  }
}

async function removeSilently(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn('Failed to remove temp file', err);
    }
  }
}

export async function runNativeTesseract(imagePath: string): Promise<NativeResult> {
  const available = await ensureBinary();
  if (!available) {
    throw new Error('Tesseract binary not available');
  }

  const outputBase = createOutputPath();
  const args = [
    imagePath,
    outputBase,
    '-c',
    'preserve_interword_spaces=1',
    '--psm',
    process.env.TESSERACT_PSM || '6'
  ];

  try {
    await execFileAsync('tesseract', args);
    const text = await readTextFile(`${outputBase}.txt`);
    return { text };
  } finally {
    await Promise.all([
      removeSilently(`${outputBase}.txt`),
      removeSilently(`${outputBase}.html`)
    ]);
  }
}
