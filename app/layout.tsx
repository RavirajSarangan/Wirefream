import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Provider from "./provider";
import { Toaster } from "@/components/ui/sonner";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  title: {
    default: "Wireframe to Code - AI-Powered Design to Code Converter",
    template: "%s | Wireframe to Code"
  },
  description: "Transform your wireframes, UI designs, and ideas into production-ready code instantly with AI. Generate React, HTML, CSS code from images, check plagiarism, create cover pages, and more.",
  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/logo.svg', sizes: '32x32', type: 'image/svg+xml' },
    ],
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  keywords: [
    "wireframe to code",
    "UI to code",
    "design to code",
    "AI code generator",
    "wireframe converter",
    "React code generator",
    "HTML CSS generator",
    "plagiarism checker",
    "PDF tools",
    "cover page creator",
    "app flow generator",
    "UI wireframe",
    "design converter",
    "AI design tools",
    "figma to code",
    "sketch to code"
  ],
  authors: [{ name: "VenomXTechnology" }],
  creator: "VenomXTechnology",
  publisher: "VenomXTechnology",
  metadataBase: new URL('https://wireframetocode.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://wireframetocode.com',
    title: 'Wireframe to Code - AI-Powered Design to Code Converter',
    description: 'Transform your wireframes and UI designs into production-ready code instantly with AI. Generate React, HTML, CSS code from images.',
    siteName: 'Wireframe to Code',
    images: [
      {
        url: '/Wireframetocode.png',
        width: 1200,
        height: 630,
        alt: 'Wireframe to Code - AI Design Converter',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wireframe to Code - AI-Powered Design to Code Converter',
    description: 'Transform your wireframes and UI designs into production-ready code instantly with AI.',
    images: ['/Wireframetocode.png'],
    creator: '@venomxtech',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://wireframetocode.com',
  },
  category: 'technology',
};

const outfit = Outfit({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#ffffff" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Wireframe to Code",
              "applicationCategory": "DeveloperApplication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "operatingSystem": "Web",
              "description": "AI-powered tool to convert wireframes and UI designs into production-ready code",
              "creator": {
                "@type": "Organization",
                "name": "VenomXTechnology"
              }
            })
          }}
        />
      </head>
      <body
        className={outfit.className}
      >
        <Provider>
          {children}
          <Toaster />
        </Provider>
      </body>
    </html>
  );
}
