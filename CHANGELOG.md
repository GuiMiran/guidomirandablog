# 1.0.0 (2026-09-05)


### Bug Fixes

* ensure release and tag are always generated on main merge ([#12](https://github.com/GuiMiran/guidomirandablog/issues/12)) ([d0ec378](https://github.com/GuiMiran/guidomirandablog/commit/d0ec378e01709dc25f58b80cf37aca03901266b5))
* repair broken CI/CD pipeline — missing E2E tests, hanging vitest, missing env vars ([#3](https://github.com/GuiMiran/guidomirandablog/issues/3)) ([7b0b3ad](https://github.com/GuiMiran/guidomirandablog/commit/7b0b3adb3abf9a1d171b4d0d154cafca2f2b3dbf))
* resolve failing unit tests — logger dynamic log level, missing testing deps, vitest JSX/jsdom config ([#8](https://github.com/GuiMiran/guidomirandablog/issues/8)) ([b8f22ce](https://github.com/GuiMiran/guidomirandablog/commit/b8f22ceb1e2988f62beac280edaa2b0a0f55f859))


### Features

* Implement complete SDD pipeline and reach 100% spec alignment ([98845ef](https://github.com/GuiMiran/guidomirandablog/commit/98845ef0223e6b2cd12d98d9ed0203418c9aabe0))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial blog application setup with Next.js 14
- Homepage with recent blog posts display
- Blog listing page with all posts
- Individual blog post detail pages with dynamic routing
- AI-powered chatbot with OpenAI integration
- PostCard component for displaying blog post previews
- ChatBot component for AI assistant functionality
- API route for AI chat functionality (`/api/ai/chat`)
- TypeScript types for BlogPost, Comment, and ChatMessage
- Comprehensive unit tests for API routes and components
- CI/CD pipeline with GitHub Actions
- Semantic release configuration for automated versioning
- Firebase integration (configuration files)
- Tailwind CSS for modern, responsive styling
- Dark mode support across the application

### Features
- Server-side rendering with Next.js App Router
- Static site generation for blog posts
- Responsive design with mobile-first approach
- Error handling and 404 pages
- Mock data system for development
- Environment variable support for API keys
- Modern UI with Tailwind CSS utilities

### Developer Experience
- Vitest for unit testing
- Playwright for E2E testing
- ESLint for code quality
- TypeScript for type safety
- Automated semantic versioning
- GitHub Actions CI/CD pipeline
