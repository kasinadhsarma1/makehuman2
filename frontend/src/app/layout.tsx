import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// next/font/google downloads and self-hosts fonts at BUILD time.
// The final out/ bundle contains the font files locally — no CDN at runtime.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",        // render with system font immediately, swap when loaded
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "MakeHuman 2",
  description: "Open source 3D human character modelling desktop application",
  // No manifest / icons needed for an Electron desktop app
};

// Disable mobile viewport scaling — this is a desktop-only app
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      // overflow-hidden prevents any accidental page-level scrollbars
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-hidden antialiased`}
    >
      <body
        suppressHydrationWarning
        className={[
          "h-full flex flex-col",
          "bg-[#0a0a0a] text-white",
          // Disable text selection in the desktop app (feels more native)
          "select-none",
          // Disable context menu text cursor on non-editable elements
          "cursor-default",
        ].join(" ")}
      >
        {children}
      </body>
    </html>
  );
}
