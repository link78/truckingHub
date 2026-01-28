# Contributing to TruckingHub

Thank you for your interest in contributing to TruckingHub! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Prioritize the community's best interests

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment (OS, Node version, etc.)

### Suggesting Features

1. Check if the feature has already been suggested
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach
   - Any relevant mockups or examples

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes**
   - Ensure all existing tests pass
   - Add new tests for your changes
   - Test manually in the browser

5. **Commit your changes**
   ```bash
   git commit -m "Add some feature"
   ```
   Use clear, descriptive commit messages

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request**
   - Provide a clear description
   - Link any related issues
   - Include screenshots for UI changes

## Development Guidelines

### Code Style

**JavaScript/JSX:**
- Use ES6+ syntax
- Use descriptive variable names
- Keep functions small and focused
- Use async/await instead of callbacks

**React Components:**
- Use functional components with hooks
- Keep components small and reusable
- Use meaningful prop names
- Add PropTypes or TypeScript types

**Backend:**
- Follow RESTful API conventions
- Use async/await for database operations
- Add proper error handling
- Validate inputs

### Project Structure

```
truckingHub/
├── server/              # Backend code
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── controllers/    # Business logic
│   ├── middleware/     # Express middleware
│   └── utils/          # Helper functions
├── client/             # Frontend code
│   └── src/
│       ├── components/ # Reusable components
│       ├── pages/      # Page components
│       ├── context/    # React Context
│       ├── services/   # API services
│       └── utils/      # Helper functions
└── docs/               # Documentation
```

### Naming Conventions

- **Files**: camelCase for utilities, PascalCase for components
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Components**: PascalCase
- **CSS Classes**: kebab-case

### Git Workflow

1. Keep commits atomic (one logical change per commit)
2. Write clear commit messages
3. Rebase on main before submitting PR
4. Squash commits if necessary

### Testing

- Write unit tests for utilities and services
- Write integration tests for API endpoints
- Test components with React Testing Library
- Ensure all tests pass before submitting PR

## Areas to Contribute

### High Priority
- Payment gateway integration
- Advanced search and filtering
- Mobile responsive improvements
- Performance optimizations
- Security enhancements

### Medium Priority
- Additional user roles
- Advanced analytics
- Notification preferences
- Export/reporting features
- Multi-language support

### Good First Issues
- UI/UX improvements
- Documentation updates
- Bug fixes
- Code refactoring
- Adding tests

## Questions?

- Open an issue with the "question" label
- Reach out to maintainers
- Check existing documentation

Thank you for contributing to TruckingHub! 🚛
