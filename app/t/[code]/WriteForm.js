"use client";
import { useActionState, useState } from "react";
import { plantLeaf } from "./actions";
import { MAX_LEN, MAX_NAME } from "@/lib/constants";

export default function WriteForm({ code }) {
  const [state, action, pending] = useActionState(plantLeaf.bind(null, code), null);
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  return (
    <form action={action} className="form">
      <label className="field">
        <textarea name="body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={MAX_LEN}
                  placeholder="Your message…" aria-label="Your message" required />
        <span className="count">{body.length} / {MAX_LEN}</span>
      </label>
      <input className="field small" name="name" value={name} onChange={(e) => setName(e.target.value)}
             maxLength={MAX_NAME} placeholder="First name or initials (optional)" aria-label="Name (optional)" />
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      <button className="btn" disabled={pending || !body.trim()}>{pending ? "Planting…" : "Plant my leaf"}</button>
    </form>
  );
}
