import { getBag, getLeaf } from "@/lib/trinity";

// Only people who have planted a leaf can read others on the tree.
export async function GET(req, { params }) {
  const { id } = await params;
  const code = new URL(req.url).searchParams.get("code") ?? "";
  const bag = await getBag(code);
  if (!bag?.message_id) return new Response(null, { status: 403 });
  const leaf = await getLeaf(Number(id));
  return leaf ? Response.json(leaf) : new Response(null, { status: 404 });
}
