# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Angular 20.1 application called "frontend-saman" that uses PrimeNG UI components with the Aura theme preset. The project uses JWT authentication (@auth0/angular-jwt) and SCSS for styling.

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

**UI Framework:** PrimeNG with Aura theme preset, Spanish translations configured
**Styling:** SCSS with PrimeFlex for flexbox utilities
**Authentication:** JWT-based using @auth0/angular-jwt
**Component Style:** SCSS (configured as default in angular.json)

**Current Structure:**
- Single route configured: `/login` → `AuthComponent` 
- Components are stored in `src/app/pages/` directory
- Auth component located at `src/app/pages/auth/`

**Angular Configuration:**
- Uses standalone components architecture (Angular 20+)
- PrimeNG configured with system dark mode detection
- Component prefix: "app"
- Source root: "src"

**Bundle Limits:**
- Initial bundle: 500kB warning, 1MB error
- Component styles: 4kB warning, 8kB error