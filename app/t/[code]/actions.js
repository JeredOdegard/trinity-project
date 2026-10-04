"use server";
import { redirect } from "next/navigation";
import { addMessage, getBag } from "@/lib/trinity";
import { isClean } from "@/lib/moderation";
import { MAX_LEN, MAX_NAME } from "@/lib/constants";

export async function plantLeaf(code, _prev, formData) {
  const body = String(formData.get("body") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim().slice(0, MAX_NAME) || null;
  if (!body) return { error: "Write a few words first." };
  if (body.length > MAX_LEN) return { error: `Keep it under ${MAX_LEN} characters.` };
  if (!isClean(body) || (name && !isClean(name))) return { error: "Let's keep it kind. Try different words." };
  if (!(await getBag(code))) return { error: "This bag isn't recognized." };
  await addMessage(code, body, name);
  redirect(`/t/${code}`);
}
