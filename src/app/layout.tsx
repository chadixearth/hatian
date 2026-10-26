import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Hatian — split bills with your barkada",
    template: "%s · Hatian",
  },
  description:
    "Split shared expenses with your barkada, housemates, family, or travel group. No sign-up — create a group, share the link, and see the fewest payments to settle up.",
  openGraph: {
    title: "Hatian — split bills with your barkada",
    description:
      "No-sign-up bill splitting for trips, dorms, and group dinners. Track who paid and settle up in the fewest transfers.",
    type: "website",
    siteName: "Hatian",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-accent/20">
        {children}
      </body>
    </html>
  );
}
