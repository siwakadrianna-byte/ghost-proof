import { getJob } from "@/lib/jobs";
import { readPreview } from "@/lib/files";

// Watermarked, low-res preview: anyone with the link can see it
export async function GET(_req: Request, ctx: RouteContext<"/api/jobs/[id]/preview">) {
  const { id } = await ctx.params;
  const job = await getJob(id);
  if (!job?.file) return new Response("No preview yet", { status: 404 });
  const img = await readPreview(id);
  return new Response(new Uint8Array(img), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store" },
  });
}
