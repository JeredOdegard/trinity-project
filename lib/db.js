import postgres from "postgres";

// Reuse one pool across hot reloads and warm serverless invocations.
export const sql = (globalThis.__sql ??= postgres(process.env.DATABASE_URL, { max: 5 }));
