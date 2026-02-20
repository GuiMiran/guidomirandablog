# 🚀 Guido Miranda - Personal AI-Powered Blog

Modern, interactive personal blog built with Next.js 14, Firebase, and OpenAI integration. Features AI-powered content generation, automated testing, and CI/CD deployment.

## ✨ Features

### Core Features
- 🎨 **Modern UI** - Built with Next.js 14 App Router, TypeScript, and Tailwind CSS
- 🔥 **Firebase Integration** - Authentication, Firestore database, Storage, and Hosting
- 🤖 **AI-Powered Features**:
  - Content generation assistance
  - Interactive chatbot for articles
  - Automatic post summarization
- 📱 **Responsive Design** - Mobile-first, fully responsive
- 🌙 **Dark Mode** - Automatic dark/light theme switching
- ⚡ **Performance** - Optimized for Core Web Vitals

### Development Features
- 🧪 **Comprehensive Testing**:
  - Unit tests with Vitest
  - E2E tests with Playwright
  - Component testing
- 🔄 **CI/CD Pipeline**:
  - GitHub Actions workflows
  - Automated testing on PRs
  - Automatic deployment to Firebase
- 📦 **Semantic Versioning**:
  - Automated releases
  - Changelog generation
  - Version management

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **AI**: OpenAI GPT-4
- **Testing**: Vitest + Playwright
- **CI/CD**: GitHub Actions
- **Release**: Semantic Release
- **Analytics**: Vercel Analytics

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase account
- OpenAI API key
- GitHub account (for Actions and releases)

## 🚀 Quick Start

### 1. Clone and Setup

\`\`\`bash
# Run the setup script
setup.bat

# Or manually:
npm install
\`\`\`

### 2. Configure Environment

Copy \`.env.example\` to \`.env\` and fill in your credentials:

\`\`\`env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# OpenAI
OPENAI_API_KEY=sk-your_key_here
\`\`\`

### 3. Firebase Setup

\`\`\`bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Deploy Firestore rules
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
\`\`\`

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

\`\`\`
guidomirandablog/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
├── content/
│   └── posts/              # Blog posts (Markdown)
├── public/
│   └── images/             # Static assets
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── ai/         # AI API routes
│   │   ├── blog/           # Blog pages
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ai/             # AI components
│   │   ├── blog/           # Blog components
│   │   └── ui/             # UI components
│   ├── lib/
│   │   ├── firebase/       # Firebase config
│   │   └── openai/         # OpenAI config
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── tests/
│   ├── e2e/                # Playwright tests
│   └── unit/               # Vitest tests
├── firebase.json           # Firebase config
├── firestore.rules         # Firestore security
├── storage.rules           # Storage security
└── package.json
\`\`\`

## 🧪 Testing

\`\`\`bash
# Unit tests
npm run test
npm run test:ui          # With UI

# E2E tests
npm run test:e2e
npm run test:e2e:ui      # With UI
\`\`\`

## 🚢 Deployment

### Automatic (via GitHub Actions)

1. Push to \`main\` branch
2. GitHub Actions will:
   - Run linting
   - Run tests
   - Build the application
   - Deploy to Firebase
   - Create a release

### Manual

\`\`\`bash
# Build for production
npm run build

# Deploy to Firebase
firebase deploy
\`\`\`

## 📝 Creating Blog Posts

Create Markdown files in \`content/posts/\`:

\`\`\`markdown
---
title: "Your Post Title"
date: "2024-01-01"
excerpt: "Brief description"
tags: ["ai", "nextjs"]
published: true
---

Your content here...
\`\`\`

## 🤖 AI Features Usage

### Content Generation
Navigate to the admin panel to generate AI-assisted content.

### Chat with Articles
Each blog post has an AI chatbot that can answer questions about the content.

### Auto-Summarization
Posts are automatically summarized using OpenAI GPT-4.

## 🔐 Security

- Firestore security rules configured
- Storage security rules configured
- Environment variables for sensitive data
- Server-side API routes for OpenAI calls

## 📦 GitHub Actions Secrets

Configure these secrets in your GitHub repository:

- \`NEXT_PUBLIC_FIREBASE_API_KEY\`
- \`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN\`
- \`NEXT_PUBLIC_FIREBASE_PROJECT_ID\`
- \`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET\`
- \`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID\`
- \`NEXT_PUBLIC_FIREBASE_APP_ID\`
- \`FIREBASE_SERVICE_ACCOUNT\` (JSON)
- \`FIREBASE_PROJECT_ID\`
- \`OPENAI_API_KEY\`
- \`GH_TOKEN\` (for semantic-release)

## 🎨 Customization

- Edit \`tailwind.config.ts\` for theme customization
- Modify \`src/app/globals.css\` for global styles
- Update Firebase rules for your specific needs

## 📄 Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run lint\` - Run ESLint
- \`npm run test\` - Run unit tests
- \`npm run test:e2e\` - Run E2E tests
- \`npm run semantic-release\` - Generate release

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit changes (\`git commit -m 'feat: add amazing feature'\`)
4. Push to branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

## 📜 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Firebase for backend services
- OpenAI for AI capabilities
- Vercel for hosting and analytics

## 📞 Contact

**Guido Miranda**
- Website: [Your URL]
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile]

---

Built with ❤️ using Next.js, Firebase, and OpenAI
