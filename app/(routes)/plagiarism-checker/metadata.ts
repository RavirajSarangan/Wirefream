import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Plagiarism Checker - AI-Powered Content Detection',
  description: 'Check for plagiarism and AI-generated content. Advanced plagiarism detection with source matching, AI content analysis, and detailed reports.',
  keywords: ['plagiarism checker', 'AI detection', 'content checker', 'plagiarism detector', 'duplicate content', 'AI content detector'],
  openGraph: {
    title: 'Plagiarism Checker - AI-Powered Detection',
    description: 'Check for plagiarism and AI-generated content with advanced detection.',
    url: 'https://wireframetocode.com/plagiarism-checker',
    images: [
      {
        url: '/og-plagiarism.jpg',
        width: 1200,
        height: 630,
        alt: 'Plagiarism Checker Tool',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plagiarism Checker - AI Detection',
    description: 'Advanced plagiarism and AI content detection.',
  },
}
