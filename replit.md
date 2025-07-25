# replit.md

## Overview

ElectroProject Pro is a comprehensive project management system designed specifically for electrical contractors, particularly Union Electrical PM. The application provides a full-stack solution for managing electrical projects, from planning and tracking to time management and integration with external systems.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API following standard HTTP conventions
- **Middleware**: Custom logging, JSON parsing, and error handling
- **Development Server**: Integration with Vite for hot module replacement

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Neon Database serverless PostgreSQL
- **Validation**: Zod schemas for runtime type safety

## Key Components

### Core Modules
1. **Project Management**: Complete CRUD operations for electrical projects
2. **Task Management**: Hierarchical task structure with Gantt charts, sheet views, and calendar views
3. **Time Tracking**: Employee time entry with project and task association
4. **RFI Tracking**: Request for Information management with status tracking
5. **Change Orders**: Financial change management with approval workflows
6. **Risk Management**: Project risk identification and mitigation tracking

### Integration Features
1. **Acumatica Sync**: Bidirectional synchronization with Acumatica ERP system
2. **Excel Import/Export**: Comprehensive data exchange with Excel and MPP formats
3. **Mobile Support**: Responsive design for field workers

### UI Components
- **Dashboard**: Real-time metrics and project health visualization
- **Data Tables**: Sortable, filterable tables with pagination
- **Charts**: Interactive charts using custom chart utilities
- **Forms**: Validated forms using React Hook Form and Zod
- **Navigation**: Sidebar navigation with role-based access

## Data Flow

### Client-Server Communication
1. Frontend makes HTTP requests to `/api/*` endpoints
2. Express server processes requests with validation middleware
3. Storage layer (currently in-memory) handles data operations
4. Responses include proper error handling and logging

### State Management
1. TanStack React Query manages server state caching
2. Form state handled by React Hook Form
3. UI state managed through React hooks
4. Global state minimized in favor of server state

### Data Validation
1. Shared Zod schemas between client and server
2. Runtime validation on API endpoints
3. Form validation with user-friendly error messages
4. Type safety throughout the application

## External Dependencies

### Database & ORM
- PostgreSQL database hosted on Neon
- Drizzle ORM for type-safe database operations
- Drizzle Kit for schema management and migrations

### UI & Styling
- Radix UI for accessible component primitives
- Tailwind CSS for utility-first styling
- Lucide React for consistent iconography
- shadcn/ui for pre-built component patterns

### Development & Build
- Vite for fast development and optimized builds
- TypeScript for type safety
- ESBuild for server bundling
- Replit-specific plugins for development environment

### Third-Party Integrations
- Neon Database for PostgreSQL hosting
- Excel/MPP export capabilities (planned)
- Acumatica ERP integration (API structure in place)

## Deployment Strategy

### Development Environment
- Replit-based development with hot reload
- Vite dev server proxying API requests
- In-memory storage for rapid prototyping
- TypeScript compilation and type checking

### Production Build
1. Frontend: Vite builds optimized static assets
2. Backend: ESBuild bundles server code for Node.js
3. Database: Drizzle migrations ensure schema consistency
4. Assets: Served statically from Express server

### Environment Configuration
- Development: Uses Vite dev server with proxy
- Production: Express serves static files and API
- Database: Environment-based connection strings
- Build outputs: Separate dist directories for client and server

### Scalability Considerations
- Database connection pooling through Neon
- Static asset optimization through Vite
- API response caching opportunities
- Component-based architecture for maintainability