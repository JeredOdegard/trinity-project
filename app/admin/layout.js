import Link from "next/link";

export default function AdminLayout({ children }) {
  return (
    <div className="admin">
      <nav className="admin-nav">
        <Link href="/admin">Messages</Link>
        <Link href="/admin/stickers">QR stickers</Link>
      </nav>
      {children}
    </div>
  );
}
