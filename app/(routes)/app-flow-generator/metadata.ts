import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'App Flow Generator - Create User Flow Diagrams',
  description: 'Generate professional app flow diagrams and user journey maps with AI. Visualize your app structure and user flows instantly.',
  keywords: ['app flow', 'user flow', 'flow diagram', 'user journey', 'app structure', 'flowchart generator', 'mermaid diagram'],
  openGraph: {
    title: 'App Flow Generator - AI User Flow Creator',
    description: 'Create professional app flow diagrams with AI.',
    url: 'https://wireframetocode.com/app-flow-generator',
    images: [
      {
        url: '/og-app-flow.jpg',
        width: 1200,
        height: 630,
        alt: 'App Flow Generator',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'App Flow Generator',
    description: 'Create app flow diagrams with AI.',
  },
}
