import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cover Page Creator - Professional Cover Pages',
  description: 'Create stunning cover pages for academic papers, reports, and documents. Multiple templates, custom logos, and professional designs with AI.',
  keywords: ['cover page creator', 'cover page maker', 'academic cover page', 'report cover', 'document cover', 'title page generator'],
  openGraph: {
    title: 'Cover Page Creator - Professional Templates',
    description: 'Create professional cover pages with customizable templates.',
    url: 'https://wireframetocode.com/cover-page-creator',
    images: [
      {
        url: '/og-cover-page.jpg',
        width: 1200,
        height: 630,
        alt: 'Cover Page Creator',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cover Page Creator',
    description: 'Create professional cover pages instantly.',
  },
}
