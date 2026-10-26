import { getFollowedGroups, getSessionUser } from "@/lib/account";
import { accountWorkbook, exportFileName, xlsxResponse } from "@/lib/export";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user)
    return new Response("Sign in to export your groups", { status: 401 });
  const items = (await getFollowedGroups(user.id)).map(({ follow, view }) => ({
    view,
    myMemberId: follow.memberId,
  }));
  const now = new Date();
  return xlsxResponse(
    accountWorkbook(items, new URL(request.url).origin),
    exportFileName("My groups", now),
  );
}
