"use server";
import { redirect } from "next/navigation";
import { addMessage, getBag } from "@/lib/trinity";
import { isClean } from "@/lib/moderation";
import { MAX_LEN } from "@/lib/constants";

export async function plantLeaf(code, _prev, formData) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write a few words first." };
  if (body.length > MAX_LEN) return { error: `Keep it under ${MAX_LEN} characters.` };
  if (!isClean(body)) return { error: "Let's keep it kind. Try different words." };
  if (!(await getBag(code))) return { error: "This bag isn't recognized." };
  await addMessage(code, body);
  redirect(`/t/${code}`);
}
