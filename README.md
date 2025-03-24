# Hacker News Redesign

A modern, accessible redesign of Hacker News built with Angular 19, utilizing the official Hacker News API.

## Features

- **Clean, Modern UI**: A complete redesign of the Hacker News front page
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- **Dark/Light Mode**: Toggle between dark and light themes with preference persistence
- **Accessibility**: ARIA-compliant, keyboard navigable, and screen reader friendly
- **Performance Optimized**:
  - Caching for faster load times
  - Pagination to reduce initial load
  - Signal-based reactivity for efficient change detection

## Technical Overview

### Technology Stack

- **Angular 19**: Utilizes the latest features including signal-based reactivity
- **TypeScript**: For type-safe coding
- **RxJS**: Reactive programming for handling asynchronous operations
- **SCSS**: For more maintainable styling
- **Cypress**: End-to-end testing
- **Jasmine/Karma**: Unit testing

### Architecture Highlights

- **Component-Based Design**: Modular architecture with standalone components
- **Responsive Layout**: Flexbox and media queries for multi-device support
- **State Management**: Using signals for efficient state management
- **Data Caching**: Optimized data fetching with client-side caching
- **Reactive Patterns**: Combining RxJS with Angular signals for reactive UI updates

## Development

### Prerequisites

- Node.js (v18+)
- npm (v9+)

### Installation

# Install dependencies

npm install

# Start the development server

npm start

````

The application will be available at `http://localhost:4200`.

### Testing

```bash
# Run unit tests
npm test

# Run end-to-end tests
npm run e2e

````
