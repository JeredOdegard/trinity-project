import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], style: ["normal", "italic"], variable: "--serif" });
const sans = Inter({ subsets: ["latin"], variable: "--sans" });

export const metadata = {
  title: "The Trinity Project · Grace",
  description: "Leave a word for a stranger. Grow the tree.",
};

export const viewport = { themeColor: "#f7f1e6" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body><main className="screen">{children}</main></body>
    </html>
  );
}
