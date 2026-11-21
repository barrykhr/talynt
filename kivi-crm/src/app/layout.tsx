import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "KiviTronics CRM", template: "%s · KiviTronics CRM" },
  description: "Internal CRM for KiviTronics Consulting.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#f6f5f2", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:shadow">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
