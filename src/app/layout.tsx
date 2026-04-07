import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InstaBackend AI — Live Backend in 1 Minute",
  description:
    "Type one sentence describing your business. Get a live REST API, a real database seeded with smart data, and a beautiful auto-generated admin panel — all in under 1 minute.",
  keywords: ["backend", "AI", "REST API", "database", "hackathon", "prototype"],
  openGraph: {
    title: "InstaBackend AI",
    description: "From Idea to Live Business in 1 Minute",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="bg-grid" aria-hidden="true" />
        <div className="bg-grid-radial" aria-hidden="true" />
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
