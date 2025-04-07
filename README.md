📄 También disponible en: [Español](README_es.md)

# ATOM FE CHALLENGE - ANGULAR

This project is a robust Angular-based application built with Angular 17.3.6 for the Atom technical challenge. It implements a modern, secure task management application with comprehensive user authentication and a clean, responsive UI.

## Features

### Authentication & Security
- **Google Authentication**: Seamless login via Google accounts using Firebase Authentication
- **Email Authentication**: Traditional email-based registration and login
- **JWT Implementation**: Secure token-based authentication
- **Route Guards**: Protected routes to ensure authenticated access
- **Interceptors**: Automatic token inclusion for authorized API requests

### Firebase Integration
- **Firebase Hosting**: Application deployed and hosted on Firebase
- **Firebase Authentication**: Secure user authentication services

### UI/UX Features
- **Angular Material**: Modern UI components with Material Design
- **Responsive Design**: Fully responsive layout that works on all device sizes
- **Custom Theming**: Indigo-pink color scheme with global styling
- **Toast Notifications**: User-friendly feedback via snackbar notifications

### SEO Optimization
- **Metadata Management**: Comprehensive SEO service for dynamic metadata updates
- **Open Graph Support**: Enhanced social media sharing with OG tags
- **Twitter Cards**: Optimized Twitter sharing experience
- **Canonical URLs**: Proper URL management to avoid duplicate content issues

### Architecture & Organization
- **Feature Modules**: Code organized by feature areas (auth, tasks)
- **Core Services**: Centralized services for authentication and data handling
- **Shared Models**: Type-safe interfaces for data structures
- **Environment Configuration**: Separated development and production settings

### Task Management
- **Task CRUD Operations**: Complete Create, Read, Update, and Delete functionality
- **Task Filtering**: Ability to filter tasks by status
- **Task Prioritization**: Support for task priority levels

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/         # Route guards for authentication
│   │   │   ├── interceptors/   # HTTP interceptors for auth tokens
│   │   │   └── services/       # Core services (auth, seo services)
│   │   ├── features/
│   │   │   ├── auth/           # Authentication feature components
│   │   │   │   ├── components/ # Login, register components
│   │   │   │   └── pages/      # Auth-related pages
│   │   │   └── tasks/          # Task management feature
│   │   │       ├── components/ # Task components (list, item, form)
│   │   │       ├── pages/      # Task pages (dashboard, details)
│   │   │       └── services/   # Task data services
│   │   ├── shared/
│   │   │   └── models/         # Shared interfaces/models
│   │   ├── app.component.ts    # Root component
│   │   ├── app.config.ts       # App configuration
│   │   └── app.routes.ts       # App routing
│   ├── assets/                 # Static assets (images, icons)
│   ├── environments/           # Environment configuration files
│   ├── styles.scss             # Global styles
│   └── index.html              # Main HTML file
├── dist/                       # Build output
├── .firebase/                  # Firebase deployment cache
├── firebase.json               # Firebase configuration
├── .firebaserc                 # Firebase project configuration
├── angular.json                # Angular workspace configuration
├── package.json                # Dependencies and scripts
└── tsconfig.json               # TypeScript configuration
```

## Global Variables & Configuration
The application uses environment files for configuration

## Development Environment

### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Deployment

The application is configured for easy deployment to Firebase:

1. Build the production version: `ng build`
2. Deploy to Firebase: `firebase deploy`

## Technical Decisions

### Architecture

The project follows a modular architecture with clear separation of concerns:

- **Core Module**: Contains services, interceptors and guards that are loaded once
- **Shared Module**: Contains reusable components, directives, and pipes
- **Feature Modules**: Task management and authentication modules with their own components

### State Management

The application uses RxJS BehaviorSubjects for simple state management, which is sufficient for this application size, avoiding the complexity of additional state management libraries.

### API Integration

The application communicates with a RESTful API for task and user management operations.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
