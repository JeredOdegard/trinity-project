"use client";
import { useActionState, useState } from "react";
import { plantLeaf } from "./actions";
import { MAX_LEN } from "@/lib/constants";

export default function WriteForm({ code }) {
  const [state, action, pending] = useActionState(plantLeaf.bind(null, code), null);
  const [body, setBody] = useState("");
  return (
    <form action={action} className="form">
      <label className="field">
        <textarea name="body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={MAX_LEN}
                  placeholder="Your message…" aria-label="Your message" required />
        <span className="count">{body.length} / {MAX_LEN}</span>
      </label>
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      <button className="btn" disabled={pending || !body.trim()}>{pending ? "Planting…" : "Plant my leaf"}</button>
    </form>
  );
}
