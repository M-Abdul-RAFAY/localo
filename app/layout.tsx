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
  title: "Local Business Ranking Tool",
  description:
    "Track your business rankings and analyze competitor positions in local search results",
  keywords: [
    "local SEO",
    "business rankings",
    "competitor analysis",
    "Google Places",
    "local search",
    "ranking tracker",
  ],
  authors: [{ name: "Local Ranking Tool" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "Local Business Ranking Tool",
    description: "Analyze your local business rankings and outrank competitors",
    type: "website",
    locale: "en_US",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to Google domains for better performance */}
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* DNS prefetch for faster loading */}
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />

        {/* Meta tags for better mobile experience */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Theme color */}
        <meta name="theme-color" content="#3b82f6" />

        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />

        {/* Note: Google Maps script is now loaded dynamically via useGoogleMaps hook */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <noscript>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              fontSize: "18px",
              textAlign: "center",
              padding: "20px",
            }}
          >
            <div>
              <h1>JavaScript Required</h1>
              <p>This application requires JavaScript to function properly.</p>
              <p>
                Please enable JavaScript in your browser and reload the page.
              </p>
            </div>
          </div>
        </noscript>

        {/* Main content */}
        <main id="main-content">{children}</main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-8 mt-12">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                © {new Date().getFullYear()} Local Business Ranking Tool.
                Powered by Google Places API.
              </p>
              <div className="mt-2 space-x-4 text-xs text-gray-500">
                <span>Track rankings</span>
                <span>•</span>
                <span>Analyze competitors</span>
                <span>•</span>
                <span>Improve local SEO</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
