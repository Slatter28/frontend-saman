# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Angular 20.1 warehouse management application called "frontend-saman" that implements modern Angular patterns with PrimeNG UI components, JWT authentication, and a comprehensive routing system with layout management.

## Key Commands

**Development:**
- `npm start` or `ng serve` - Start development server on http://localhost:4200
- `ng build --watch --configuration development` - Build in watch mode for development

**Building:**
- `npm run build` or `ng build` - Production build (outputs to dist/)
- `ng build --configuration development` - Development build

**Testing:**
- `npm test` or `ng test` - Run unit tests with Karma/Jasmine

**Code Generation:**
- `ng generate component component-name` - Generate new component
- `ng generate --help` - See all available schematics

## Architecture

### Core Technology Stack
- **Angular 20.1** with standalone components architecture
- **PrimeNG 20.0** with Aura theme preset and Spanish translations
- **SCSS** styling with PrimeFlex for flexbox utilities
- **JWT Authentication** using @auth0/angular-jwt with functional guards
- **RxJS 7.8** for reactive programming patterns
- **Chart.js 4.5** for data visualization

### Application Structure
```
src/app/
├── pages/           # Feature pages (auth, dashboard, unidades-medida, bodegas, clientes, productos)
├── layout/          # Layout components (header, sidebar, main-layout)  
├── services/        # Business logic and API services
├── guards/          # Route protection (auth-guard, login-guard)
├── interceptors/    # HTTP interceptors (auth.interceptor.functional)
├── interfaces/      # TypeScript type definitions
├── app.routes.ts    # Centralized routing configuration
└── app.config.ts    # Application providers configuration
```

### Authentication System
- **JWT-based authentication** with localStorage persistence
- **Functional guards** (`authGuard`, `loginGuard`) using `CanActivateFn`
- **HTTP interceptor** automatically attaches Bearer tokens to requests
- **AuthService** manages auth state with BehaviorSubject pattern
- **API base URL**: `http://localhost:3000/api`

### Routing Architecture
- **Layout-based routing** with MainLayout wrapper for protected routes
- **Guard protection** on all authenticated routes
- **Lazy loading** implemented for bodegas, clientes, and productos modules
- **Login/Dashboard flow** with automatic redirection

**Route Structure:**
```typescript
// Public routes
{ path: 'login', component: AuthComponent }

// Protected routes with layout
{
  path: '',
  component: MainLayout,
  canActivate: [authGuard],
  children: [
    { path: 'dashboard', component: Dashboard },
    { path: 'unidades-medida', component: UnidadesMedida },
    { path: 'bodegas', loadComponent: () => import('./pages/bodegas/bodegas').then(m => m.Bodegas) },
    { path: 'clientes', loadComponent: () => import('./pages/clientes/clientes').then(m => m.Clientes) },
    { path: 'productos', loadComponent: () => import('./pages/productos/productos').then(m => m.Productos) }
  ]
}
```

### Component Patterns
- **Standalone components** with explicit imports (no NgModules)
- **Signal-based state management** using Angular signals
- **SCSS component styling** with strict budgets (4kB warning/8kB error)
- **Co-located files** (component.ts, .html, .scss in same directory)
- **Interface-driven development** with comprehensive TypeScript types

### PrimeNG Configuration
- **Aura theme preset** with dark mode support (`.my-app-dark` selector)
- **Spanish UI translations** configured
- **Ripple effects** enabled
- **Custom z-index configuration** for modals and overlays
- **PrimeFlex utilities** for responsive layouts

### Data Models
Key business entities include:
- **Authentication**: User, LoginRequest, LoginResponse, ValidateResponse
- **Inventory**: Producto, UnidadMedida, Bodega
- **Operations**: Movimiento, Cliente
- **UI**: TableColumn, SelectOption

### Service Layer
- **Injectable services** with `providedIn: 'root'`
- **HttpClient** for API communication with centralized base URL
- **Error handling** with navigation fallbacks
- **Reactive state management** using BehaviorSubject/Observable patterns

### Bundle Configuration
- **Initial bundle**: 500kB warning, 1MB error
- **Component styles**: 4kB warning, 8kB error
- **Source maps** enabled in development
- **Output hashing** for production builds

### Testing Setup
- **Karma + Jasmine** framework configured
- **Angular testing utilities** available
- **Code coverage** reporting enabled
- **Spec files** co-located with components