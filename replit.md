# Court Booking System

## Overview

A court booking management system for Cricket and Football that enables users to check availability, make bookings, and view analytics. The application features a public-facing booking interface and an admin dashboard for managing bookings and viewing metrics.

**Core functionality:**
- Two courts (Court A, Court B) with hourly time slots from 6 AM to 11 PM
- Sport-specific pricing (Cricket: ₹2000/hour, Football: ₹2500/hour)
- Real-time availability checking with double-booking prevention
- Admin dashboard with revenue metrics and occupancy analytics
- Mobile-responsive design with sports-themed visual elements

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React with TypeScript
- **Routing:** wouter for client-side navigation
- **State Management:** TanStack Query (React Query) for server state caching and synchronization
- **Form Handling:** React Hook Form with Zod validation
- **UI Components:** shadcn/ui component library built on Radix UI primitives

**Design System:**
- Tailwind CSS for styling with custom design tokens
- Sports-themed visual approach with professional credibility
- "New York" style variant from shadcn/ui
- Responsive layout system with mobile-first approach
- Theme toggle supporting light/dark modes

**Key Pages:**
- Home: Hero section with call-to-action buttons
- Availability: Interactive calendar and time slot selection
- Dashboard: Analytics with charts (Chart.js/Recharts)
- Bookings: List view with search, filter, and status management
- Create Booking: Multi-step form with availability validation

**Component Architecture:**
- Reusable UI components in `client/src/components/ui/`
- Business logic components (BookingModal, AppSidebar, ThemeToggle)
- Custom icons for sports (Cricket, Football) and courts

### Backend Architecture

**Framework:** Express.js with TypeScript
- **Server:** HTTP server with JSON request/response handling
- **Routing:** RESTful API endpoints under `/api` prefix
- **Development:** Vite middleware for HMR in development mode
- **Production:** Static file serving from built assets

**API Endpoints:**
- `GET /api/courts` - Fetch available courts
- `GET /api/sports` - Fetch sports with pricing
- `GET /api/availability?date=YYYY-MM-DD` - Get slot availability for a date
- `GET /api/bookings` - List all bookings with court/sport details
- `POST /api/bookings` - Create new booking
- `PATCH /api/bookings/:id` - Update booking status
- `GET /api/dashboard` - Fetch dashboard metrics and chart data

**Business Logic:**
- Slot availability calculation (6 AM - 11 PM, hourly slots)
- Double-booking prevention through time slot validation
- Automatic amount calculation based on sport pricing and hours
- Status management (booked, cancelled, completed)

### Data Storage

**Current Implementation:** In-memory storage (MemStorage class)
- Courts stored in Map with id as key
- Sports stored in Map with pricing information
- Bookings stored in Map with UUID for public reference

**Database Schema (Drizzle ORM ready):**
```typescript
courts: { id, name }
sports: { id, name, pricePerHour }
bookings: { id, uuid, name, phone, sportId, courtId, date, startTime, hours, amount, status }
```

**Rationale:** The application is structured to use Drizzle ORM with PostgreSQL (via Neon serverless), but currently operates with in-memory storage. This allows for easy development and testing while maintaining production-ready schema definitions.

**Data Flow:**
- Client queries trigger TanStack Query cache lookups
- Cache misses result in API calls to Express endpoints
- Storage layer handles data persistence and retrieval
- Mutations invalidate relevant query cache entries for UI consistency

### External Dependencies

**Database:**
- Drizzle ORM for type-safe database queries
- @neondatabase/serverless for PostgreSQL connection
- Drizzle Kit for migrations (configured but storage not connected)

**UI Framework:**
- Radix UI primitives for accessible components
- Tailwind CSS for utility-first styling
- Chart.js and Recharts for data visualization
- date-fns for date manipulation and formatting

**Form & Validation:**
- React Hook Form for form state management
- Zod for schema validation
- @hookform/resolvers for integration

**Development Tools:**
- Vite for build tooling and dev server
- TypeScript for type safety
- esbuild for server bundling
- @replit plugins for Replit-specific features

**Key Architectural Decisions:**

1. **Hybrid Rendering:** SPA architecture with client-side routing, avoiding full-page reloads for better UX
2. **API-First Design:** Clear separation between frontend and backend enables independent scaling
3. **Type Safety:** Shared TypeScript schemas between client and server reduce runtime errors
4. **Component Reusability:** shadcn/ui approach allows customization while maintaining consistency
5. **Query Caching:** TanStack Query reduces unnecessary network requests and provides optimistic updates
6. **Schema-First Development:** Drizzle schema definitions serve as single source of truth for data models