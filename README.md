# 🚀 Guido Miranda Blog

Modern personal blog built with Next.js 14, Firebase, and OpenAI integration. Features Markdown-based content management, automated CI/CD workflows, and Specification-Driven Development (SDD) practices.

## ✨ Features

### Core Features
- 📝 **Markdown Blog** - Write posts in Markdown with frontmatter metadata
- 🎨 **Modern UI** - Built with Next.js 14 App Router, TypeScript, and Tailwind CSS
- 🔥 **Firebase Integration** - Authentication, Firestore, Storage, and Hosting
- 🤖 **AI-Powered Features** - OpenAI integration for enhanced functionality
- 📱 **Responsive Design** - Mobile-first, fully responsive
- 🌙 **Dark Mode** - Automatic dark/light theme switching
- ⚡ **Performance** - Optimized for Core Web Vitals

### Development Features
- 🧪 **Comprehensive Testing**:
  - Unit tests with Vitest
  - E2E tests with Playwright
  - Component testing with React Testing Library
- 🔄 **Advanced CI/CD Pipeline**:
  - **PR Validation** - Automatic checks on pull requests (changelog, tests, linting)
  - **Release Candidate** - Auto-deploy to Firebase Preview on merge to `develop`
  - **Production Deploy** - Auto-deploy to Firebase Hosting on merge to `main`
  - Semantic versioning and automated changelog
- 📊 **Specification-Driven Development (SDD)**:
  - Spec validation workflows
  - Coverage tracking
  - Protocol-based agent system

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

### 1. Clone and Install

```bash
git clone https://github.com/GuiMiran/guidomirandablog.git
cd guidomirandablog
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and add your credentials:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# OpenAI (optional)
OPENAI_API_KEY=sk-your_key_here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your blog!

### 4. Add Your First Blog Post

Create a file in `content/posts/my-first-post.md`:

```markdown
---
title: "My First Post"
excerpt: "This is my first blog post"
author: "Your Name"
publishedAt: "2026-03-05"
tags: ["blog", "first-post"]
imageUrl: "/images/my-post.jpg"
---

# Hello World

This is my first blog post content!
```

The post will appear automatically at [http://localhost:3000/blog](http://localhost:3000/blog)

## 📁 Project Structure

```
guidomirandablog/
├── .github/
│   └── workflows/              # CI/CD workflows
│       ├── pr-validation.yml   # PR checks
│       ├── release-candidate-develop.yml  # Deploy to preview
│       └── production-deploy.yml          # Deploy to production
├── content/
│   └── posts/                  # 📝 Blog posts (Markdown)
├── docs/                       # 📚 Documentation
│   ├── CI-CD-STRUCTURE.md
│   └── FIREBASE-SECRETS-GUIDE.md
├── public/
│   └── images/                 # Static assets
├── src/
│   ├── app/
│   │   ├── api/ai/            # AI API routes
│   │   ├── blog/              # Blog pages
│   │   │   ├── page.tsx       # Blog list
│   │   │   └── [slug]/page.tsx # Blog post detail
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ai/                # AI components
│   │   ├── blog/              # Blog components
│   │   └── ui/                # UI components
│   ├── lib/
│   │   ├── posts.ts           # 🔥 Blog post utilities
│   │   ├── agents/            # SDD agents
│   │   ├── firebase/          # Firebase config
│   │   ├── openai/            # OpenAI config
│   │   ├── protocols/         # SDD protocols
│   │   └── skills/            # Agent skills
│   ├── types/                 # TypeScript types
│   └── utils/                 # Utility functions
├── tests/
│   ├── e2e/                   # Playwright E2E tests
│   └── unit/                  # Vitest unit tests
├── CHANGELOG.md               # Auto-generated changelog
├── firebase.json              # Firebase configuration
├── next.config.mjs            # Next.js configuration
└── package.json
```

## 🧪 Testing

```bash
# Unit tests
npm run test                 # Run once
npm run test:watch          # Watch mode
npm run test:ui             # With UI

# E2E tests
npm run test:e2e            # Headless
npm run test:e2e:ui         # With UI

# Spec validation (SDD)
npm run spec:validate       # Validate specs
npm run spec:coverage       # Coverage report
npm run spec:check          # Full validation
```

## 🚢 CI/CD Workflow

This project uses a comprehensive CI/CD pipeline with three main workflows:

### 1. Pull Request Validation (`pr-validation.yml`)
**Triggers:** When you create or update a PR to `main` or `develop`

**Checks:**
- ✅ Validates CHANGELOG.md was updated
- ✅ Runs TypeScript type checking
- ✅ Runs ESLint and Prettier
- ✅ Executes all tests (unit + E2E)
- ✅ Validates SDD specifications
- ✅ Verifies production build

### 2. Release Candidate (`release-candidate-develop.yml`)
**Triggers:** When you merge to `develop` branch

**Actions:**
- 🔨 Builds the application
- 🚀 Deploys to Firebase Preview Channel (`develop`)
- 📦 Creates Release Candidate tag (e.g., `v1.0.0-rc.1`)
- 📝 Generates pre-release on GitHub

**Preview URL:** `https://PROJECT-ID--develop-HASH.web.app`

### 3. Production Deploy (`production-deploy.yml`)
**Triggers:** When you merge to `main` branch

**Actions:**
- ✅ Runs full validation suite
- 🔨 Builds optimized production bundle
- 🚀 Deploys to Firebase Hosting (production)
- 📦 Creates production release with semantic-release
- 📝 Auto-updates CHANGELOG.md
- 🔍 Runs health checks
- 🔔 Notifies team

**Production URL:** `https://PROJECT-ID.web.app`

### Workflow Diagram

```
feature/xxx → PR → develop → PR → main
                     ↓          ↓
               Firebase      Firebase
               Preview       Production
               (RC)          (Release)
```

## 📝 Creating Blog Posts

### Method 1: Create Markdown File (Recommended)

Create a file in `content/posts/`:

```markdown
---
title: "Your Post Title"
excerpt: "Brief description of your post"
author: "Your Name"
publishedAt: "2026-03-05"
tags: ["tag1", "tag2", "tag3"]
imageUrl: "/images/your-image.jpg"
---

# Your Content

Write your content here using Markdown...

## Subheading

- List item 1
- List item 2

\```javascript
// Code blocks work too!
console.log("Hello World");
\```
```

### Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Post title |
| `excerpt` | string | ✅ | Short description |
| `author` | string | ✅ | Author name |
| `publishedAt` | date | ✅ | Publication date (YYYY-MM-DD) |
| `tags` | array | ❌ | Post tags |
| `imageUrl` | string | ❌ | Featured image path |

Posts appear automatically at `/blog` once created!

## 🔐 GitHub Secrets Configuration

To enable CI/CD workflows, configure these secrets in GitHub:

**Settings → Secrets and variables → Actions → New repository secret**

### Required Secrets

| Secret | Description | Where to Get |
|--------|-------------|--------------|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON | Firebase Console → Project Settings → Service Accounts |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID | Firebase Console → Project Settings |
| `GH_TOKEN` | GitHub token for releases | GitHub → Settings → Developer settings → Personal access tokens |

### Optional Secrets (for Firebase features)

| Secret | Description |
|--------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `OPENAI_API_KEY` | OpenAI API key (for AI features) |

**📖 For detailed setup instructions, see [docs/FIREBASE-SECRETS-GUIDE.md](docs/FIREBASE-SECRETS-GUIDE.md)**

## 📚 Documentation

- **[CI/CD Structure](docs/CI-CD-STRUCTURE.md)** - Complete CI/CD workflow documentation
- **[Firebase Secrets Guide](docs/FIREBASE-SECRETS-GUIDE.md)** - Step-by-step secrets configuration
- **[Changes Summary](CAMBIOS-COMPLETOS.md)** - Recent changes and improvements (Spanish)
- **[Update Summary](UPDATE-SUMMARY.md)** - Quick reference guide

## 📄 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at http://localhost:3000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run E2E tests |
| `npm run spec:validate` | Validate SDD specifications |
| `npm run spec:coverage` | Generate spec coverage report |
| `npm run spec:check` | Full SDD validation |

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. **Update CHANGELOG.md** (required for PR approval)
5. Commit using [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add new feature`
   - `fix: correct bug`
   - `docs: update documentation`
   - `chore: maintenance task`
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request to `develop` branch

The PR validation workflow will automatically check your code!

## 🔄 Development Workflow

```bash
# Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# Make changes and test
npm run dev
npm test

# Commit with conventional commits
git add .
git commit -m "feat: add my awesome feature"

# Update changelog
echo "- Added my awesome feature" >> CHANGELOG.md
git add CHANGELOG.md
git commit -m "docs: update changelog"

# Push and create PR
git push origin feature/my-feature
# Create PR on GitHub to 'develop' branch
```

## 🎯 Branch Strategy

- `main` - Production (auto-deploys to Firebase Hosting)
- `develop` - Staging (auto-deploys to Firebase Preview)
- `feature/*` - New features
- `fix/*` - Bug fixes

## 🏗️ Built With

- [Next.js 14](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Firebase](https://firebase.google.com/) - Backend services
- [OpenAI](https://openai.com/) - AI capabilities
- [Vitest](https://vitest.dev/) - Unit testing
- [Playwright](https://playwright.dev/) - E2E testing
- [GitHub Actions](https://github.com/features/actions) - CI/CD

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details

## 👤 Author

**Guido Miranda**
- GitHub: [@GuiMiran](https://github.com/GuiMiran)
- Repository: [guidomirandablog](https://github.com/GuiMiran/guidomirandablog)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Firebase for reliable backend services
- OpenAI for AI capabilities
- The open-source community

---

**Made with ❤️ using Next.js, Firebase, and OpenAI**

*Last updated: March 5, 2026*
