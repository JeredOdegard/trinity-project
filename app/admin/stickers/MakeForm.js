"use client";
import { useActionState } from "react";
import { makeStickers } from "./actions";

export default function MakeForm({ max }) {
  const [state, action, pending] = useActionState(makeStickers, null);
  return (
    <form action={action} className="inline-form">
      <label>
        New stickers
        <input type="number" name="count" min="1" max={max} defaultValue="100" required />
      </label>
      <button className="btn" disabled={pending}>{pending ? "Creating…" : "Create codes"}</button>
      {state?.error && <p className="error" role="alert">{state.error}</p>}
    </form>
  );
}
