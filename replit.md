# Location-Based Marketplace Application

## Overview

This is a full-stack TypeScript application that creates a location-based marketplace for connecting buyers and sellers. The application uses a modern web stack with React on the frontend and Express.js on the backend, featuring real-time geolocation services, interactive maps, and a mobile-first design approach.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Maps**: Leaflet with marker clustering for interactive geolocation features

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **File Uploads**: Multer for handling image uploads
- **Session Management**: Built-in session handling

### Database Design
- **Users**: Basic user authentication and profiles
- **Sellers**: Vendor profiles with geolocation and rating system
- **Categories**: Product/service categorization
- **Requests**: Buyer requests with location and time constraints
- **Offers**: Seller responses to buyer requests
- **Orders**: Completed transactions between buyers and sellers

## Key Components

### Geolocation Services
The application heavily relies on location-based features:
- Real-time seller proximity detection
- Interactive map with clustered markers
- Distance-based seller filtering
- User location acquisition and management

### Request-Offer System
Core marketplace functionality:
- Buyers create time-limited requests with location and budget
- Sellers can make offers with pricing and availability
- Real-time polling for new offers
- Automated request expiration handling

### Mobile-First Design
- Responsive expandable modal system
- Touch-friendly map interactions
- Mobile-optimized form layouts
- Progressive Web App capabilities

### File Upload System
- Image upload support for requests and profiles
- File validation and size limits
- Static file serving for uploaded content

## Data Flow

### Request Creation Flow
1. User enables location services
2. User fills out request form with description, budget, and optional image
3. Request is created with expiration timestamp
4. Nearby sellers are notified (future enhancement)
5. Real-time polling begins for incoming offers

### Offer Management Flow
1. Sellers view active requests in their area
2. Sellers submit offers with pricing and messages
3. Buyers receive real-time offer updates
4. Buyers can accept offers to create orders
5. Communication channels open between buyer and seller

### Location-Based Discovery
1. User location is acquired through browser geolocation API
2. Backend calculates seller proximity using PostGIS-style distance queries
3. Map displays sellers with clustering for performance
4. Real-time updates refresh seller availability status

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **leaflet**: Interactive mapping functionality
- **wouter**: Lightweight routing
- **multer**: File upload handling

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe styling variants
- **react-hook-form**: Form state management with validation

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **drizzle-kit**: Database migration management

## Deployment Strategy

### Development Mode
- Vite development server for frontend with HMR
- TSX for running TypeScript backend with hot reload
- Database migrations through Drizzle Kit
- Local file uploads to uploads directory

### Production Build
- Frontend builds to static assets via Vite
- Backend compiles to single JavaScript bundle via esbuild
- Static file serving integrated into Express server
- Environment-based configuration for database connections

### Database Management
- Drizzle migrations stored in migrations directory
- Schema definitions in shared directory for type safety
- PostgreSQL with geospatial extensions for location queries
- Connection pooling through Neon serverless

### File Storage
- Local file system for development
- Configurable upload directory with size limits
- CORS-enabled static file serving
- Image validation and processing pipeline

The application is designed to be easily deployable to platforms like Replit, Vercel, or traditional VPS environments with minimal configuration changes.