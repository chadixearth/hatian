import { getGroupView } from "@/lib/data";
import { exportFileName, groupWorkbook, xlsxResponse } from "@/lib/export";

// Same access rule as the group page: the share link is the key.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const view = await getGroupView(id);
  if (!view) return new Response("Group not found", { status: 404 });
  const now = new Date();
  return xlsxResponse(groupWorkbook(view, now), exportFileName(view.name, now));
}
