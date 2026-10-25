// Server-only: stores delivered files and makes watermarked previews.
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import type { Job } from "./jobs";

const dir = (jobId: string) => path.join(process.cwd(), "data", "uploads", jobId);
export const PREVIEW_WIDTH = 900;

/** Save the original and create a low-res preview covered in "GHOST-PROOF PREVIEW". */
export async function saveDelivery(jobId: string, file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name).toLowerCase() || ".png";
  const folder = dir(jobId);
  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(path.join(folder, "original" + ext), buffer);

  const resized = sharp(buffer).rotate().resize({ width: PREVIEW_WIDTH, withoutEnlargement: true });
  const { width = PREVIEW_WIDTH, height = PREVIEW_WIDTH } = await resized
    .clone()
    .toBuffer({ resolveWithObject: true })
    .then((r) => r.info);

  await resized
    .composite([{ input: watermarkSvg(width, height), top: 0, left: 0 }])
    .jpeg({ quality: 55 })
    .toFile(path.join(folder, "preview.jpg"));

  return { fileName: file.name, ext };
}

function watermarkSvg(width: number, height: number) {
  const rows: string[] = [];
  const step = 110;
  for (let y = -height; y < height * 2; y += step) {
    for (let x = -width; x < width * 2; x += 560) {
      const offset = (y / step) % 2 ? 280 : 0;
      rows.push(`<text x="${x + offset}" y="${y}">GHOST-PROOF PREVIEW</text>`);
    }
  }
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(-30 ${width / 2} ${height / 2})"
         font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="700"
         fill="white" fill-opacity="0.55" stroke="black" stroke-opacity="0.35" stroke-width="1">
        ${rows.join("")}
      </g>
    </svg>`
  );
}

export async function readPreview(jobId: string) {
  return fs.readFile(path.join(dir(jobId), "preview.jpg"));
}

export async function readOriginal(job: Job) {
  if (!job.file) throw new Error("No file");
  return fs.readFile(path.join(dir(job.id), "original" + job.file.ext));
}

/** The clean file unlocks once the designer has been paid (released, or a dispute settled mostly in their favour). */
export function isUnlocked(job: Job) {
  return (
    job.status === "released" ||
    (job.status === "resolved" && (job.resolution?.designerPercent ?? 0) >= 50)
  );
}
