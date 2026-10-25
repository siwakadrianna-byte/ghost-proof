import { getJob } from "@/lib/jobs";
import { isUnlocked, readOriginal } from "@/lib/files";

const MIME: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".tif": "image/tiff", ".tiff": "image/tiff", ".avif": "image/avif" };

// Full-resolution clean file: only after the designer has been paid
export async function GET(req: Request, ctx: RouteContext<"/api/jobs/[id]/download">) {
  const { id } = await ctx.params;
  const job = await getJob(id);
  if (!job?.file) return new Response("No file", { status: 404 });
  if (!isUnlocked(job)) return new Response("Locked until the designer is paid", { status: 403 });

  const file = await readOriginal(job);
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": MIME[job.file.ext] ?? "application/octet-stream",
      "Content-Disposition": `${new URL(req.url).searchParams.has("inline") ? "inline" : "attachment"}; filename="${job.file.fileName.replace(/"/g, "")}"`,
    },
  });
}
