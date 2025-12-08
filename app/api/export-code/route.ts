import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

export async function POST(req: NextRequest) {
    try {
        const { code, description, fileName } = await req.json()

        if (!code) {
            return NextResponse.json(
                { error: 'No code provided' },
                { status: 400 }
            )
        }

        // Create new ZIP file
        const zip = new JSZip()

        // Extract code content (handle both old and new formats)
        const codeContent = typeof code === 'string' ? code : (code.resp || code)

        // Add main App.js file
        zip.file('src/App.js', codeContent)

        // Add package.json with dependencies
        const packageJson = {
            name: fileName ? fileName.toLowerCase().replaceAll(/[^a-z0-9]/g, '-') : 'wireframe-app',
            version: '1.0.0',
            description: description || 'Generated from wireframe',
            private: true,
            dependencies: {
                'react': '^18.2.0',
                'react-dom': '^18.2.0',
                'lucide-react': '^0.263.1',
                'axios': '^1.4.0'
            },
            devDependencies: {
                '@vitejs/plugin-react': '^4.0.3',
                'vite': '^4.4.5',
                'tailwindcss': '^3.3.3',
                'autoprefixer': '^10.4.14',
                'postcss': '^8.4.27'
            },
            scripts: {
                'dev': 'vite',
                'build': 'vite build',
                'preview': 'vite preview'
            }
        }
        zip.file('package.json', JSON.stringify(packageJson, null, 2))

        // Add index.html
        const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${description || 'Wireframe App'}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
        zip.file('index.html', indexHtml)

        // Add main.jsx entry point
        const mainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
        zip.file('src/main.jsx', mainJsx)

        // Add Tailwind CSS configuration
        const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`
        zip.file('tailwind.config.js', tailwindConfig)

        // Add PostCSS configuration
        const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
        zip.file('postcss.config.js', postcssConfig)

        // Add index.css with Tailwind directives
        const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`
        zip.file('src/index.css', indexCss)

        // Add Vite configuration
        const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`
        zip.file('vite.config.js', viteConfig)

        // Add .gitignore
        const gitignore = `# Dependencies
node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build
/dist

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*`
        zip.file('.gitignore', gitignore)

        // Add README
        const readme = `# ${description || 'Wireframe App'}

This project was generated from a wireframe using AI.

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build for Production

\`\`\`bash
npm run build
\`\`\`

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Lucide React Icons
`
        zip.file('README.md', readme)

        // Generate ZIP file as blob
        const zipBlob = await zip.generateAsync({ type: 'nodebuffer' })

        // Return as downloadable file
        return new NextResponse(new Uint8Array(zipBlob), {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${fileName || 'wireframe-app'}.zip"`,
            },
        })

    } catch (error: any) {
        console.error('Export error:', error)
        return NextResponse.json(
            { error: 'Failed to export code', details: error.message },
            { status: 500 }
        )
    }
}
