# Wireframe to Code - AI-Powered Development Suite

A comprehensive Next.js application that provides multiple AI-powered tools for web development, design conversion, and content analysis.

## 🚀 Features

### 1. **Generate Wireframe** (AI-Powered)
- Generate wireframes from text descriptions
- Customize device type, style, and components
- AI models: Gemini, Llama, Deepseek

### 2. **UI to Wireframe**
- Convert UI screenshots to wireframe layouts
- AI analyzes and extracts design patterns
- Exports clean wireframe structures

### 3. **Wireframe to Code**
- Generate React/HTML code from wireframes
- Multiple AI model support
- Export and refine generated code

### 4. **PDF Tools**
- **Word to PDF**: Convert DOCX to PDF
- **PDF to Word**: Extract text and convert PDF to DOCX
- **PDF Compress**: Reduce PDF file sizes

### 5. **Plagiarism Checker**
- AI-powered plagiarism detection
- Detailed similarity reports with source URLs
- AI content detection
- Export reports as PDF

### 6. **App Flow Generator**
- Generate complete app flows from descriptions
- Creates:
  - Screen list with details
  - Flow diagrams
  - User journey maps
- Export as JSON or PDF

### 7. **Unified Activity History**
- View all activities across all features
- Filter by type, search, and sort
- Delete with database persistence
- View detailed reports

### 8. **Design Library**
- Browse all generated designs
- Preview and manage wireframes
- Delete and organize designs

### 9. **Credits System**
- 2 credits per AI generation/check
- Track usage across features
- Add credits functionality

## 🛠️ Tech Stack

- **Framework**: Next.js 15.1.6
- **UI Library**: React 19
- **Language**: TypeScript
- **Database**: Neon PostgreSQL with Drizzle ORM
- **AI Provider**: OpenRouter API
- **PDF Generation**: jsPDF + html2canvas
- **UI Components**: Shadcn/ui + TailwindCSS
- **Authentication**: Firebase
- **Icons**: Lucide React

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/RavirajSarangan/Wirefream.git
cd Wirefream

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your API keys:
# - OPENROUTER_AI_API_KEY
# - Firebase credentials
# - Neon database URL

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🗄️ Database Schema

- **WireframeToCodeTable**: Stores wireframe-to-code conversions
- **GeneratedWireframesTable**: Stores AI-generated wireframes
- **UIToWireframeTable**: Stores UI-to-wireframe conversions
- **PlagiarismChecksTable**: Stores plagiarism check results
- **AppFlowGeneratorTable**: Stores app flow generations
- **usersTable**: User data and credits

## 🔑 Environment Variables

```env
OPENROUTER_AI_API_KEY=your_openrouter_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
DATABASE_URL=your_neon_database_url
```

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push database schema changes
```

## 🎨 Features in Detail

### AI Models Supported
- Google Gemini 2.0 Flash
- Meta Llama 3.3 70B
- Deepseek R1
- Qwen Turbo

### Export Formats
- JSON (structured data)
- PDF (formatted reports)
- React/HTML code
- DOCX documents

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Raviraj Sarangan**
- GitHub: [@RavirajSarangan](https://github.com/RavirajSarangan)

## 🙏 Acknowledgments

- OpenRouter for AI API access
- Neon for PostgreSQL database
- Vercel for Next.js framework
- Shadcn for UI components
