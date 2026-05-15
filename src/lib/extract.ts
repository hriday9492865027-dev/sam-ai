// Client-side text extraction from PDFs (pdf.js) and images (tesseract.js).
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/**
 * Render a single PDF page to a canvas and return it as a Blob (PNG).
 */
async function renderPageToBlob(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof pdfjsLib.getDocument>>["promise"]["getPage"]>>,
  scale = 2
): Promise<Blob> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas to blob failed"))), "image/png");
  });
}

/**
 * OCR a single image blob using Tesseract.js and return the recognised text.
 */
async function ocrBlob(blob: Blob): Promise<string> {
  const Tesseract = (await import("tesseract.js")).default;
  const result = await Tesseract.recognize(blob, "eng");
  return result.data.text.trim();
}

/**
 * Minimum average characters per page to consider the native text layer usable.
 * If the average falls below this, we switch to OCR for the whole document.
 */
const MIN_AVG_CHARS_PER_PAGE = 40;

export async function extractFromPdf(
  file: File,
  onProgress?: (pct: number, msg: string) => void
): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

  // ── Pass 1: try native text layer ──────────────────────────────────────
  onProgress?.(5, "Reading text layer…");
  let nativeText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(Math.round((i / pdf.numPages) * 45), `Reading page ${i} of ${pdf.numPages}`);
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((it) => ("str" in it ? (it as { str: string }).str : ""))
      .join(" ");
    nativeText += pageText + "\n\n";
  }

  const trimmedNative = nativeText.trim();
  const avgCharsPerPage = trimmedNative.length / Math.max(pdf.numPages, 1);

  // If the native text layer has enough content, return it directly.
  if (avgCharsPerPage >= MIN_AVG_CHARS_PER_PAGE) {
    onProgress?.(100, "Done");
    return trimmedNative;
  }

  // ── Pass 2: OCR fallback — render pages to images and recognise ────────
  onProgress?.(50, "Low text detected — switching to OCR…");
  let ocrText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(
      50 + Math.round((i / pdf.numPages) * 50),
      `OCR page ${i} of ${pdf.numPages}…`
    );
    const page = await pdf.getPage(i);
    const blob = await renderPageToBlob(page);
    const pageText = await ocrBlob(blob);
    ocrText += pageText + "\n\n";
  }

  const trimmedOcr = ocrText.trim();

  // Return whichever extraction produced more text.
  if (trimmedOcr.length > trimmedNative.length) {
    onProgress?.(100, "Done (OCR)");
    return trimmedOcr;
  }

  onProgress?.(100, "Done");
  return trimmedNative;
}

export async function extractFromImage(
  file: File,
  onProgress?: (pct: number, msg: string) => void
): Promise<string> {
  const Tesseract = (await import("tesseract.js")).default;
  const result = await Tesseract.recognize(file, "eng", {
    logger: (m: { status: string; progress: number }) => {
      if (m.progress != null) onProgress?.(Math.round(m.progress * 100), m.status);
    },
  });
  return result.data.text.trim();
}

export async function extractText(
  file: File,
  onProgress?: (pct: number, msg: string) => void
): Promise<string> {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return extractFromPdf(file, onProgress);
  }
  if (file.type.startsWith("image/")) {
    return extractFromImage(file, onProgress);
  }
  throw new Error("Unsupported file type. Upload a PDF or image.");
}
