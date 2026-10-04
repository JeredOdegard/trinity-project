"use server";
import { redirect } from "next/navigation";
import { createBags, MAX_BATCH } from "@/lib/bags";

export async function makeStickers(_prev, formData) {
  const n = Math.floor(Number(formData.get("count")));
  if (!(n >= 1 && n <= MAX_BATCH)) return { error: `Pick a number from 1 to ${MAX_BATCH}.` };
  const { from, to } = await createBags(n);
  redirect(`/admin/stickers/print?from=${from}&to=${to}`);
}
