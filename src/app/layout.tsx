import type { Metadata } from "next";
import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "User Registration System",
  description: "Profile submission, image upload, and queue tracking.",
  icons: {
    icon: "/TNN_A.jpg",
    shortcut: "/TNN_A.jpg",
    apple: "/TNN_A.jpg",
  },
};

const logoPath = join(process.cwd(), "public", "TNN_A.jpg");
const hasLogo = existsSync(logoPath);

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        <div className="app-shell">
          <header className="topbar">
            <div className="topbar-inner">
              <Link className="brand" href="/add-profile">
                <strong>User Registration System</strong>
              </Link>
              {hasLogo ? (
                <div className="header-logo" aria-label="Thai News Network logo">
                  <Image
                    alt="Thai News Network"
                    height={64}
                    priority
                    src="/TNN_A.jpg"
                    width={64}
                  />
                </div>
              ) : null}
              <nav className="nav" aria-label="Main navigation">
                <Link href="/add-profile">
                  <ClipboardList size={16} aria-hidden="true" />
                  Add profile
                </Link>
                <Link href="/track">Track</Link>
                <Link href="/admin">Admin</Link>
              </nav>
            </div>
          </header>
          {children}
          <footer className="site-footer">
            © 2026 Thai News Network · Powered by Digital Media & AI Team · TikkieTeddie Lab
          </footer>
        </div>
      </body>
    </html>
  );
}
