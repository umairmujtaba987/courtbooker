# Court Booking System Design Guidelines

## Design Approach

**Selected Approach:** Design System with Sports-Themed Customization  
**Rationale:** This booking management system prioritizes efficiency, data clarity, and reliable functionality. Using a systematic approach with athletic visual touches creates professional credibility while maintaining usability.

**Core Principles:**
- Clean, organized information architecture for quick booking decisions
- Energetic sports-themed accents without sacrificing professionalism
- Data-first dashboard design for admin insights
- Mobile-responsive for on-the-go booking management

---

## Typography

**Font Families:**
- Primary: Inter (headings, UI elements) - clean, modern, professional
- Secondary: System UI fonts for body text and data tables

**Hierarchy:**
- Hero/Page Headers: text-4xl to text-5xl, font-bold
- Section Headers: text-2xl to text-3xl, font-semibold
- Card Titles: text-xl, font-semibold
- Body Text: text-base, font-normal
- Data/Numbers: text-lg to text-2xl, font-bold (for metrics)
- Labels/Captions: text-sm, font-medium

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16  
- Component padding: p-4, p-6, p-8
- Section spacing: space-y-8, space-y-12
- Card gaps: gap-6, gap-8
- Margins: m-4, m-6, m-8

**Grid Structure:**
- Desktop: max-w-7xl container with px-8
- Tablet: px-6
- Mobile: px-4
- Availability grid: 2-column (courts side-by-side) on desktop, stack on mobile

---

## Core Components

### Navigation
- Fixed header with logo, navigation links (Home, Book Now, Bookings, Dashboard - admin only)
- Transparent overlay on hero, solid background on scroll
- Mobile: Hamburger menu with slide-out drawer
- Quick booking CTA button (rounded-full, prominent)

### Hero Section (Public Homepage)
- Height: 70vh minimum
- Background: High-energy sports action image (cricket batsman mid-swing or football player kicking, blurred/dynamic)
- Overlay: Dark gradient (from transparent to black 40% opacity at bottom)
- Content: Centered text with "Book Your Court" headline, subheading about both sports, primary CTA "Check Availability"
- Search widget overlay card (white, rounded-xl, shadow-xl) floating at bottom 1/3 with quick filters: Date picker, Sport selector, Court selector, Search button

### Availability Calendar View
- Two-column grid showing Court A and Court B side-by-side (desktop)
- Each court column: header with court name, sport pricing display
- Slot cards: Hourly time slots as clickable cards (grid layout)
  - Available slots: border-2 with sport-themed accent (green for cricket, blue for football), hover lift effect
  - Booked slots: opacity-50, gray, cursor-not-allowed
  - Include: time range (09:00-10:00), sport icon, price
- Date selector at top: Calendar-style picker with today highlighted

### Booking Form Modal
- Modal overlay: backdrop-blur, bg-black/50
- Form card: max-w-2xl, bg-white, rounded-2xl, shadow-2xl, p-8
- Form fields in 2-column grid (desktop):
  - Name (text input)
  - Phone (tel input with validation indicator)
  - Sport (radio buttons with icons - cricket bat, football)
  - Court (radio buttons - Court A, Court B)
  - Date (date picker, pre-filled)
  - Start Time (time picker, pre-filled)
  - Hours (number input with +/- buttons)
  - Amount (read-only, prominently displayed with PKR prefix, auto-calculated)
- Submit button: Full-width, rounded-xl, font-semibold
- Real-time validation messages below each field

### Admin Dashboard
- Sidebar navigation (left, fixed): Dashboard, Create Booking, All Bookings, Settings
- Main content area: Grid layout for metrics cards

**Metrics Cards (Top Row):**
- 4-column grid (responsive to 2-col on tablet, 1-col mobile)
- Cards: rounded-xl, shadow-md, p-6
- Each card: Large number (text-3xl, font-bold), label below, icon top-right, trend indicator (up/down arrow with percentage)
- Metrics: Today's Revenue, Total Bookings, Court A Occupancy %, Court B Occupancy %

**Charts Section (Middle):**
- 2-column grid
- Revenue Line Chart (7 days): Card with header "Revenue Trend", Chart.js canvas, responsive height
- Bookings Bar Chart: Card with header "Daily Bookings", grouped bars for each court
- Court Occupancy Doughnut: Card showing percentage breakdown, legend below

**Bookings Table (Bottom):**
- DataTable component with search, filters (date range, court, sport, status)
- Columns: Booking ID, Customer Name, Phone, Sport, Court, Date, Time, Hours, Amount, Status, Actions
- Status badges: rounded-full pills (green for booked, gray for cancelled, blue for completed)
- Actions: Icon buttons for View, Edit, Cancel (trash icon)
- Pagination at bottom

### Form Inputs (Consistent Style)
- Text/Tel inputs: rounded-lg, border-2, px-4, py-3, focus ring with sport accent
- Radio buttons: Custom styled with checkmark, border-2, larger touch targets
- Date/Time pickers: Calendar dropdown with header, navigation arrows
- Number inputs: Centered display with +/- buttons on sides, rounded borders

### Buttons
- Primary: rounded-xl, px-8, py-3, font-semibold, shadow-md, smooth transitions
- Secondary: outlined variant with border-2
- Icon buttons: rounded-full, p-2, hover background transition
- Disabled state: opacity-50, cursor-not-allowed

---

## Images

**Hero Image:**
- Large, full-width background image (70vh)
- Subject: Dynamic sports action - either a cricket batsman in batting stance mid-swing OR a football player kicking a ball (choose one with motion blur effect)
- Treatment: Slight blur or motion effect, dark overlay gradient at bottom
- Position: Background-cover, center-center

**Dashboard Icons/Illustrations:**
- Sport icons for cricket/football selection (SVG from Heroicons or Font Awesome)
- Court illustrations: Simple line drawings or icons representing court layouts (optional decorative elements in dashboard cards)

---

## Animations

**Minimal Approach:**
- Hover lift on available slot cards (translate-y-1, shadow increase)
- Smooth transitions on button states (0.2s ease)
- Modal fade-in/scale animation
- Chart animations on load (Chart.js default)
- NO scroll animations or parallax effects

---

## Responsive Behavior

- Desktop (lg+): Full multi-column layouts, sidebar visible, charts side-by-side
- Tablet (md): 2-column grids collapse to single column for forms, stack charts vertically, hamburger menu
- Mobile (base): Single column throughout, bottom navigation for key actions, simplified dashboard cards stack vertically