"use server";
import { revalidatePath } from "next/cache";
import { setHidden } from "@/lib/trinity";

export async function toggleHidden(id, hidden) {
  await setHidden(id, hidden);
  revalidatePath("/admin");
}
