import { NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/jobs";
import { saveDelivery } from "@/lib/files";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/tiff", "image/avif"];

// Designer uploads the final file (before marking the milestone as delivered on-chain)
export async function POST(request: Request, ctx: RouteContext<"/api/jobs/[id]/upload">) {
  const { id } = await ctx.params;
  const job = await getJob(id);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const form = await request.formData();
  const file = form.get("file");
  const designer = form.get("designerAddress");
  if (designer !== job.designerAddress)
    return NextResponse.json({ error: "Only the designer can upload." }, { status: 403 });
  if (!(file instanceof File) || !IMAGE_TYPES.includes(file.type))
    return NextResponse.json({ error: "That file type isn't supported yet. Export it as PNG or JPG and try again." }, { status: 400 });

  try {
    const saved = await saveDelivery(id, file);
    await updateJob(id, (j) => {
      j.file = saved;
    });
    return NextResponse.json({ previewUrl: `/api/jobs/${id}/preview` });
  } catch {
    return NextResponse.json({ error: "Couldn't read that image. Try another file." }, { status: 400 });
  }
}
