declare module 'tesseract.js' {
  interface RecognitionData {
    text: string;
  }

  interface RecognitionResult {
    data: RecognitionData;
  }

  interface TesseractWorker {
    recognize(image: Buffer | string): Promise<RecognitionResult>;
    terminate(): Promise<void>;
  }

  export function createWorker(): Promise<TesseractWorker>;
}
