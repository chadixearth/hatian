import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SiteHeader } from "@/components/shell/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
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
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-accent/20">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="mt-16 border-t border-border bg-surface/60">
          <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-muted sm:px-6">
            Hatian — shared bill splitting for barkadas, housemates, and trips.
            No sign-up required; share any group link to split expenses.
          </div>
        </footer>
      </body>
    </html>
  );
}
