# 🤝 Contributing to Exaroton Servers Manager

First off, thank you for considering contributing to Exaroton Servers Manager! It's people like you that make this project better for everyone.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Style Guidelines](#style-guidelines)
- [Commit Guidelines](#commit-guidelines)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 🐛 Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates.

**When creating a bug report, please include:**

- **Clear and descriptive title**
- **Steps to reproduce** the behavior
- **Expected behavior** vs **actual behavior**
- **Screenshots** (if applicable)
- **Environment details:**
  - OS and version
  - Node.js version
  - Browser and version
  - Any relevant console errors

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) when opening a new issue.

## 💡 Suggesting Enhancements

We love new ideas! When suggesting an enhancement:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **Include mockups or examples** if applicable

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) when opening a new issue.

## 🔧 Pull Requests

### Before Starting

1. Check if there's an existing issue for what you want to work on
2. If not, create an issue first to discuss the changes
3. Make sure the issue is assigned to you before starting work

### Pull Request Process

1. **Fork** the repository
2. **Clone** your fork locally
   ```bash
   git clone https://github.com/YOUR_USERNAME/exaroton-servers.git
   cd exaroton-servers
   ```
3. **Create a branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```
4. **Make your changes** following our [style guidelines](#style-guidelines)
5. **Test your changes**
   ```bash
   npm run lint
   npm run build
   ```
6. **Commit your changes** following our [commit guidelines](#commit-guidelines)
7. **Push** to your fork
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Open a Pull Request** against the `main` branch

### PR Requirements

- [ ] Code compiles without errors (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Changes are tested locally
- [ ] PR description clearly describes the changes
- [ ] Related issue is linked

## 🛠 Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project (for local testing)
- Exaroton API key (optional, for API testing)

### Getting Started

1. Install dependencies
   ```bash
   npm install
   ```

2. Copy environment example
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` file with required variables

4. Start development server
   ```bash
   npm run dev
   ```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## 📝 Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Define types in `types/index.ts`
- Prefer interfaces over type aliases for objects
- Use explicit return types for functions
- Avoid `any` type when possible

### React Components

- Use functional components with hooks
- Use `'use client'` directive for client components
- Place components in appropriate directories:
  - `components/ui/` for shadcn/ui primitives
  - `components/` for app-specific components

### Styling

- Use Tailwind CSS for styling
- Use `cn()` utility for conditional classes
- Follow mobile-first responsive design

### File Naming

- React components: `PascalCase.tsx`
- Utilities/hooks: `camelCase.ts`
- API routes: `route.ts`

### Imports

- Use `@/` path alias for imports
- Order imports: external, internal, types, styles

```typescript
// External
import { useState } from 'react';
import { NextResponse } from 'next/server';

// Internal
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

// Types
import type { Server } from '@/types';
```

## 📨 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, etc.) |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |
| `ci` | CI/CD changes |

### Examples

```bash
feat(servers): add server console feature
fix(auth): resolve token refresh issue
docs(readme): update installation instructions
style(components): format with prettier
refactor(api): simplify error handling
```

## ❓ Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers.

---

Thank you for contributing! 🎉
