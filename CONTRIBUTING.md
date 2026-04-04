# Contributing to SwapNet

Thank you for your interest in contributing to SwapNet! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Bug Reports](#bug-reports)
- [Feature Requests](#feature-requests)
- [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git
- A Supabase account (for backend development)

### Local Development Setup

1. **Fork the repository**
   ```bash
   # Fork the repository on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/SkillBridge.git
   cd SkillBridge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Install Playwright for testing** (optional)
   ```bash
   npx playwright install chromium
   ```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical fixes for production

### Creating a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### Making Changes

1. Follow the [coding standards](#coding-standards)
2. Write tests for new functionality
3. Ensure all tests pass
4. Update documentation as needed

### Commit Messages

Use clear, descriptive commit messages:

```
type(scope): description

feat(auth): add Google OAuth integration
fix(dashboard): resolve loading state issue
docs(readme): update installation instructions
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Provide proper type definitions
- Avoid `any` types when possible
- Use interfaces for object shapes

### React Components

- Use functional components with hooks
- Follow React best practices
- Use proper prop types/interfaces
- Keep components focused and reusable

### Code Style

- Use Prettier for code formatting
- Follow ESLint rules
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### File Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── context/       # React context providers
├── lib/           # Utility functions and configurations
├── types/         # TypeScript type definitions
└── utils/         # Helper functions
```

## Testing

### Running Tests

```bash
# Run linting
npm run lint

# Run type checking
npm run build

# Run browser verification
npm run verify:browser
```

### Writing Tests

- Test new features and bug fixes
- Ensure browser verification passes
- Test responsive design
- Verify accessibility

## Submitting Changes

### Pull Request Process

1. **Update your fork**
   ```bash
   git checkout main
   git pull upstream main
   git checkout feature/your-feature-name
   git rebase main
   ```

2. **Create a pull request**
   - Use descriptive title and description
   - Link to relevant issues
   - Include screenshots for UI changes
   - Add testing instructions

3. **Code review**
   - Address reviewer feedback promptly
   - Keep discussions focused and constructive
   - Update PR as needed

### Pull Request Template

Use the provided [PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) for consistency.

## Bug Reports

### Reporting Bugs

1. Check existing issues first
2. Use the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md)
3. Provide detailed information:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Screenshots if applicable

### Debugging Information

Include:
- Browser and version
- Operating system
- Node.js version
- Console errors
- Network requests (if relevant)

## Feature Requests

### Proposing Features

1. Check existing issues and discussions
2. Use the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md)
3. Provide detailed description:
   - Problem statement
   - Proposed solution
   - Alternative approaches considered
   - Use cases and benefits

### Discussion

- Open an issue for discussion before implementation
- Gather community feedback
- Consider impact on existing features

## Documentation

### Types of Documentation

- **README.md** - Project overview and setup
- **API Documentation** - Function and component documentation
- **Code Comments** - Inline code documentation
- **User Guides** - End-user documentation

### Writing Documentation

- Keep it clear and concise
- Include code examples
- Update with each feature change
- Use consistent formatting

## Getting Help

- **GitHub Issues** - For bug reports and feature requests
- **Discussions** - For general questions and ideas
- **Code Review** - For code-specific feedback

## Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Git commit history

Thank you for contributing to SwapNet! 🚀
