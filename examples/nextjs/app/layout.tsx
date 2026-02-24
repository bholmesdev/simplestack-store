import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simple State Management for React | @simplestack/store",
  description:
    "Interactive demo of @simplestack/store with Next.js. A simple and powerful state management library for React with fine-grained reactivity.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Simple State Management for React | @simplestack/store",
    description:
      "Interactive demo of @simplestack/store with Next.js. A simple and powerful state management library for React.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Simple State Management for React | @simplestack/store",
    description:
      "Interactive demo of @simplestack/store with Next.js. A simple and powerful state management library for React.",
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
