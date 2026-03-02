import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next.js | @simplestack/store",
  description:
    "Next.js example for @simplestack/store — a simple, select-based state management library for React with fine-grained reactivity.",
  openGraph: {
    title: "Next.js | @simplestack/store",
    description:
      "A simple, select-based state management library for React with fine-grained reactivity via signals and selectors.",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
