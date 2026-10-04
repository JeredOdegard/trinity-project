import { NextResponse } from "next/server";

// Basic auth for /admin. No ADMIN_PASSWORD set means admin is locked.
export function proxy(req) {
  const pass = process.env.ADMIN_PASSWORD;
  const [scheme, encoded] = (req.headers.get("authorization") ?? "").split(" ");
  if (pass && scheme === "Basic" && encoded) {
    const decoded = atob(encoded);
    if (decoded.slice(decoded.indexOf(":") + 1) === pass) return NextResponse.next();
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Trinity admin"' },
  });
}

export const config = { matcher: ["/admin/:path*"] };
