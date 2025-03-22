# Hacker News Redesigned

A modern, accessible redesign of Hacker News built with Angular 19. This project showcases a clean, responsive UI for the popular tech news aggregator using the official Hacker News API.

## Features

- **Modern UI**: A sleek, responsive design that works across devices
- **Full Accessibility**: ARIA-compliant, keyboard navigable, and screen reader friendly
- **Dark/Light Mode**: Automatic theme detection with manual override option
- **Performance Optimized**: Lazy loading, pagination, and caching for fast load times
- **Comprehensive Testing**: High test coverage for reliability and maintenance
- **Signal-based Reactivity**: Uses Angular 19's signal-based reactivity model

## Technology Stack

- **Angular 19**: Latest version with signals for reactive state management
- **TypeScript**: Type-safe JavaScript for better developer experience
- **SCSS**: Maintainable styling with variables and mixins
- **RxJS**: Reactive programming for handling async operations
- **Karma/Jasmine**: Testing framework for unit tests

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm (v9 or later)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/hacker-news-redesigned.git
   cd hacker-news-redesigned
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:4200/`

## Architecture

The application follows a component-based architecture with a focus on:

- **Separation of Concerns**: Each component, service, and pipe has a single responsibility
- **Reactive State Management**: Using signals and RxJS for reactive state handling
- **Scalability**: Designed to scale with additional features while maintaining performance
- **Maintainability**: Clean code practices, comprehensive documentation, and tests

## API Integration

The application uses the official [Hacker News API](https://github.com/HackerNews/API) to fetch:

- Top, new, best, ask, show, and job stories
- Story details including title, URL, points, and comments
- User information

## Accessibility Features

- **Semantic HTML**: Proper use of HTML elements for structure
- **ARIA Attributes**: Enhanced screen reader experience
- **Keyboard Navigation**: Full support for keyboard-only users
- **Focus Management**: Clear focus indicators and navigation
- **Color Contrast**: WCAG compliant contrast ratios
- **Responsive Design**: Adapts to different screen sizes and orientations
- **Skip Links**: Jump directly to main content

## Performance Optimizations

- **Caching Strategy**: Local caching of API responses
- **Pagination**: Load stories in batches to reduce initial load time
- **Lazy Loading**: Components and modules loaded as needed
- **Code Splitting**: Reduce main bundle size
- **Optimized Change Detection**: Signals and OnPush for efficient updates

## Testing

The project includes extensive test coverage:

```bash
# Run unit tests
npm test

# Run with code coverage report
npm run test:coverage
```

## Future Enhancements

- User authentication with saved story list
- Comment viewing and threading
- PWA support for offline access
- User profile pages
- Real-time updates with WebSockets

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Y Combinator](https://www.ycombinator.com/) for creating the original Hacker News
- [Hacker News API](https://github.com/HackerNews/API) for providing the data
- [Angular Team](https://angular.io/) for the excellent framework
