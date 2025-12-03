# MySQL Setup Guide for Court Booking System

This guide walks you through converting the Court Booking Management System from PostgreSQL to MySQL on your local machine.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Install MySQL](#step-1-install-mysql)
3. [Step 2: Create Database & User](#step-2-create-database--user)
4. [Step 3: Update Project Configuration](#step-3-update-project-configuration)
5. [Step 4: Update Dependencies](#step-4-update-dependencies)
6. [Step 5: Update Backend Code](#step-5-update-backend-code)
7. [Step 6: Run Migrations](#step-6-run-migrations)
8. [Step 7: Start the Application](#step-7-start-the-application)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js v16+ installed
- npm or yarn package manager
- Terminal/Command Prompt access
- Git (optional, for version control)

---

## Step 1: Install MySQL

### macOS (Using Homebrew)
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install MySQL
brew install mysql

# Start MySQL service
brew services start mysql

# Verify installation
mysql --version
```

### Ubuntu/Debian (Linux)
```bash
# Update package manager
sudo apt update

# Install MySQL Server
sudo apt install mysql-server

# Start MySQL service
sudo systemctl start mysql

# Verify installation
mysql --version
```

### Windows

1. Download MySQL Community Server from: https://dev.mysql.com/downloads/mysql/
2. Run the installer (.msi file)
3. Follow the setup wizard:
   - Choose "Server Machine" configuration
   - Use port 3306 (default)
   - Set root password (remember this!)
   - Configure MySQL as a Windows Service
4. Complete the installation

Verify installation by opening Command Prompt:
```bash
mysql --version
```

---

## Step 2: Create Database & User

### Login to MySQL

**macOS/Linux:**
```bash
mysql -u root -p
# Enter your root password (empty by default on Linux/macOS)
```

**Windows (if you set a root password):**
```bash
mysql -u root -p
# Enter your root password
```

### Create Database and User

Once logged into MySQL, run these commands:

```sql
-- Create the database
CREATE DATABASE court_booking;

-- Create a new user (replace 'your_password' with a strong password)
CREATE USER 'court_admin'@'localhost' IDENTIFIED BY 'your_password';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON court_booking.* TO 'court_admin'@'localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

**Example with specific password:**
```sql
CREATE USER 'court_admin'@'localhost' IDENTIFIED BY 'SecurePass123!';
GRANT ALL PRIVILEGES ON court_booking.* TO 'court_admin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## Step 3: Update Project Configuration

### 3.1 Edit `drizzle.config.ts`

Open `drizzle.config.ts` and change the dialect from PostgreSQL to MySQL:

**Before:**
```typescript
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

**After:**
```typescript
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

### 3.2 Create `.env` File

In the project root directory, create a `.env` file:

```env
DATABASE_URL=mysql://court_admin:your_password@localhost:3306/court_booking
NODE_ENV=development
SESSION_SECRET=your-session-secret-key-here
PORT=5000
```

**Replace the following:**
- `your_password` - The password you set for the `court_admin` user
- `your-session-secret-key-here` - A random string for session encryption (e.g., generate one with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

**Example:**
```env
DATABASE_URL=mysql://court_admin:SecurePass123!@localhost:3306/court_booking
NODE_ENV=development
SESSION_SECRET=7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p
PORT=5000
```

---

## Step 4: Update Dependencies

### 4.1 Remove PostgreSQL Packages

```bash
npm uninstall @neondatabase/serverless connect-pg-simple @types/connect-pg-simple
```

### 4.2 Install MySQL Packages

```bash
npm install mysql2 express-mysql-session
```

### 4.3 Verify Installation

```bash
npm list mysql2 express-mysql-session
```

---

## Step 5: Update Backend Code

### 5.1 Create `server/db.ts`

Create a new file `server/db.ts` to initialize the MySQL connection:

```typescript
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Parse DATABASE_URL format: mysql://user:password@host:port/database
const url = new URL(process.env.DATABASE_URL);
const poolConnection = mysql.createPool({
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  port: parseInt(url.port || '3306'),
});

export const db = drizzle(poolConnection);
```

### 5.2 Update `server/index.ts`

Replace the session store to use MySQL instead of memory storage:

**Find this section:**
```typescript
import session from "express-session";

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
  }),
);
```

**Replace with:**
```typescript
import session from "express-session";
import MySQLStore from 'express-mysql-session';
import mysql from 'mysql2/promise';

// Create MySQL connection pool for sessions
const sessionPool = mysql.createPool({
  host: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : 'localhost',
  user: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).username : 'court_admin',
  password: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).password : '',
  database: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).pathname.slice(1) : 'court_booking',
});

const sessionStore = new MySQLStore({
  connectionPool: sessionPool,
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
  }),
);
```

### 5.3 Update `server/storage.ts`

Replace the MemStorage implementation with DrizzleStorage using MySQL:

**Replace the entire `server/storage.ts` with:**

```typescript
import {
  type Court,
  type InsertCourt,
  type Sport,
  type InsertSport,
  type Booking,
  type InsertBooking,
  type TimeSlot,
  type DashboardMetrics,
  type ChartData,
  type User,
  courts as courtsTable,
  sports as sportsTable,
  bookings as bookingsTable,
  users as usersTable,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { format, subDays, startOfWeek, startOfMonth } from "date-fns";
import bcrypt from "bcrypt";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getCourts(): Promise<Court[]>;
  getCourt(id: string): Promise<Court | undefined>;
  createCourt(court: InsertCourt): Promise<Court>;
  
  getSports(): Promise<Sport[]>;
  getSport(id: string): Promise<Sport | undefined>;
  createSport(sport: InsertSport): Promise<Sport>;
  
  getBookings(): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingByUuid(uuid: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: string, status: string): Promise<Booking | undefined>;
  getBookingsForDateAndCourt(date: string, courtId: string): Promise<Booking[]>;
  
  getAvailability(date: string): Promise<{ courts: Court[]; sports: Sport[]; slots: Record<string, TimeSlot[]> }>;
  checkSlotAvailability(courtId: string, date: string, startTime: string, hours: number): Promise<boolean>;
  
  getDashboardMetrics(): Promise<DashboardMetrics>;
  getChartData(): Promise<ChartData>;
  
  verifyAdminPassword(username: string, password: string): Promise<User | null>;
  initializeData(): Promise<void>;
}

export class DrizzleStorage implements IStorage {
  private readonly OPENING_HOUR = 6;
  private readonly CLOSING_HOUR = 23;

  async initializeData(): Promise<void> {
    try {
      // Check if data already exists
      const existingCourts = await db.select().from(courtsTable).limit(1);
      if (existingCourts.length > 0) {
        return; // Data already initialized
      }

      // Insert courts
      const courtAId = "court-a";
      const courtBId = "court-b";

      await db.insert(courtsTable).values([
        { id: courtAId, name: "Court A" },
        { id: courtBId, name: "Court B" },
      ]);

      // Insert sports
      await db.insert(sportsTable).values([
        { id: "cricket", name: "Cricket", pricePerHour: 2000 },
        { id: "football", name: "Football", pricePerHour: 2500 },
      ]);

      // Insert admin user
      const adminPassword = bcrypt.hashSync("admin123", 10);
      await db.insert(usersTable).values({
        id: "admin-1",
        username: "admin",
        password: adminPassword,
      });

      // Insert sample bookings
      const today = new Date();
      const sampleBookings = [
        { name: "Ahmed Khan", phone: "+92 300 1234567", sportId: "cricket", courtId: "court-a", date: format(today, "yyyy-MM-dd"), startTime: "09:00", hours: 2, amount: 4000 },
        { name: "Ali Hassan", phone: "+92 321 9876543", sportId: "football", courtId: "court-b", date: format(today, "yyyy-MM-dd"), startTime: "14:00", hours: 1, amount: 2500 },
        { name: "Muhammad Rizwan", phone: "+92 333 5556789", sportId: "cricket", courtId: "court-a", date: format(subDays(today, 1), "yyyy-MM-dd"), startTime: "10:00", hours: 3, amount: 6000 },
        { name: "Usman Tariq", phone: "+92 345 1112233", sportId: "football", courtId: "court-a", date: format(subDays(today, 1), "yyyy-MM-dd"), startTime: "16:00", hours: 2, amount: 5000 },
        { name: "Bilal Ahmed", phone: "+92 301 4445566", sportId: "cricket", courtId: "court-b", date: format(subDays(today, 2), "yyyy-MM-dd"), startTime: "08:00", hours: 2, amount: 4000 },
        { name: "Hassan Ali", phone: "+92 312 7778899", sportId: "football", courtId: "court-a", date: format(subDays(today, 2), "yyyy-MM-dd"), startTime: "18:00", hours: 1, amount: 2500 },
        { name: "Imran Shah", phone: "+92 323 0001122", sportId: "cricket", courtId: "court-b", date: format(subDays(today, 3), "yyyy-MM-dd"), startTime: "11:00", hours: 2, amount: 4000 },
        { name: "Kashif Raza", phone: "+92 334 3334455", sportId: "football", courtId: "court-b", date: format(subDays(today, 3), "yyyy-MM-dd"), startTime: "15:00", hours: 2, amount: 5000 },
        { name: "Naveed Iqbal", phone: "+92 345 6667788", sportId: "cricket", courtId: "court-a", date: format(subDays(today, 4), "yyyy-MM-dd"), startTime: "07:00", hours: 1, amount: 2000 },
        { name: "Shahid Malik", phone: "+92 300 9990011", sportId: "football", courtId: "court-a", date: format(subDays(today, 4), "yyyy-MM-dd"), startTime: "19:00", hours: 2, amount: 5000 },
        { name: "Waqar Younis", phone: "+92 321 2223344", sportId: "cricket", courtId: "court-b", date: format(subDays(today, 5), "yyyy-MM-dd"), startTime: "12:00", hours: 3, amount: 6000 },
        { name: "Yasir Arafat", phone: "+92 333 5556677", sportId: "football", courtId: "court-b", date: format(subDays(today, 5), "yyyy-MM-dd"), startTime: "17:00", hours: 1, amount: 2500 },
        { name: "Zain Abbas", phone: "+92 345 8889900", sportId: "cricket", courtId: "court-a", date: format(subDays(today, 6), "yyyy-MM-dd"), startTime: "08:00", hours: 2, amount: 4000 },
        { name: "Farhan Saeed", phone: "+92 301 1112233", sportId: "football", courtId: "court-a", date: format(subDays(today, 6), "yyyy-MM-dd"), startTime: "20:00", hours: 2, amount: 5000 },
        { name: "Junaid Khan", phone: "+92 312 4445566", sportId: "cricket", courtId: "court-b", date: format(today, "yyyy-MM-dd"), startTime: "18:00", hours: 1, amount: 2000 },
      ];

      const bookingsToInsert = sampleBookings.map((booking) => ({
        id: randomUUID(),
        uuid: randomUUID().slice(0, 8).toUpperCase(),
        ...booking,
        status: "booked" as const,
      }));

      if (bookingsToInsert.length > 0) {
        await db.insert(bookingsTable).values(bookingsToInsert);
      }
    } catch (error) {
      console.error("Error initializing database data:", error);
    }
  }

  async getCourts(): Promise<Court[]> {
    return db.select().from(courtsTable);
  }

  async getCourt(id: string): Promise<Court | undefined> {
    const result = await db.select().from(courtsTable).where(eq(courtsTable.id, id));
    return result[0];
  }

  async createCourt(court: InsertCourt): Promise<Court> {
    const id = randomUUID();
    await db.insert(courtsTable).values({ id, ...court });
    return { id, ...court };
  }

  async getSports(): Promise<Sport[]> {
    return db.select().from(sportsTable);
  }

  async getSport(id: string): Promise<Sport | undefined> {
    const result = await db.select().from(sportsTable).where(eq(sportsTable.id, id));
    return result[0];
  }

  async createSport(sport: InsertSport): Promise<Sport> {
    const id = randomUUID();
    await db.insert(sportsTable).values({ id, ...sport });
    return { id, ...sport };
  }

  async getBookings(): Promise<Booking[]> {
    const allBookings = await db.select().from(bookingsTable);
    return allBookings.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const result = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
    return result[0];
  }

  async getBookingByUuid(uuid: string): Promise<Booking | undefined> {
    const result = await db.select().from(bookingsTable).where(eq(bookingsTable.uuid, uuid));
    return result[0];
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const uuid = randomUUID().slice(0, 8).toUpperCase();
    const newBooking = {
      id,
      uuid,
      ...booking,
      status: booking.status || "booked",
    };
    await db.insert(bookingsTable).values(newBooking);
    return newBooking;
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    await db.update(bookingsTable).set({ status }).where(eq(bookingsTable.id, id));
    return this.getBooking(id);
  }

  async getBookingsForDateAndCourt(date: string, courtId: string): Promise<Booking[]> {
    return db
      .select()
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.date, date),
          eq(bookingsTable.courtId, courtId),
          eq(bookingsTable.status, "booked")
        )
      );
  }

  async checkSlotAvailability(
    courtId: string,
    date: string,
    startTime: string,
    hours: number
  ): Promise<boolean> {
    const existingBookings = await this.getBookingsForDateAndCourt(date, courtId);
    const requestedStartHour = parseInt(startTime.split(":")[0], 10);
    const requestedEndHour = requestedStartHour + hours;

    if (requestedStartHour < this.OPENING_HOUR || requestedEndHour > this.CLOSING_HOUR) {
      return false;
    }

    for (const booking of existingBookings) {
      const bookingStartHour = parseInt(booking.startTime.split(":")[0], 10);
      const bookingEndHour = bookingStartHour + booking.hours;

      if (
        (requestedStartHour >= bookingStartHour && requestedStartHour < bookingEndHour) ||
        (requestedEndHour > bookingStartHour && requestedEndHour <= bookingEndHour) ||
        (requestedStartHour <= bookingStartHour && requestedEndHour >= bookingEndHour)
      ) {
        return false;
      }
    }

    return true;
  }

  async getAvailability(date: string): Promise<{
    courts: Court[];
    sports: Sport[];
    slots: Record<string, TimeSlot[]>;
  }> {
    const courts = await this.getCourts();
    const sports = await this.getSports();
    const slots: Record<string, TimeSlot[]> = {};

    for (const court of courts) {
      const courtBookings = await this.getBookingsForDateAndCourt(date, court.id);
      const bookedHours = new Set<number>();

      for (const booking of courtBookings) {
        const startHour = parseInt(booking.startTime.split(":")[0], 10);
        for (let h = 0; h < booking.hours; h++) {
          bookedHours.add(startHour + h);
        }
      }

      const courtSlots: TimeSlot[] = [];
      for (let hour = this.OPENING_HOUR; hour < this.CLOSING_HOUR; hour++) {
        const time = `${hour.toString().padStart(2, "0")}:00`;
        const displayTime = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? "PM" : "AM"}`;
        const available = !bookedHours.has(hour);
        const existingBooking = courtBookings.find(
          (b) => parseInt(b.startTime.split(":")[0], 10) === hour
        );

        courtSlots.push({
          time,
          displayTime,
          available,
          bookingId: existingBooking?.id,
        });
      }

      slots[court.id] = courtSlots;
    }

    return { courts, sports, slots };
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const allBookings = await db.select().from(bookingsTable);
    const bookings = allBookings.filter(
      (b) => b.status === "booked" || b.status === "completed"
    );
    
    const today = format(new Date(), "yyyy-MM-dd");
    const weekStart = format(startOfWeek(new Date()), "yyyy-MM-dd");
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");

    const todayRevenue = bookings
      .filter((b) => b.date === today)
      .reduce((sum, b) => sum + b.amount, 0);

    const weekRevenue = bookings
      .filter((b) => b.date >= weekStart)
      .reduce((sum, b) => sum + b.amount, 0);

    const monthRevenue = bookings
      .filter((b) => b.date >= monthStart)
      .reduce((sum, b) => sum + b.amount, 0);

    const totalBookings = bookings.length;

    const totalSlots = (this.CLOSING_HOUR - this.OPENING_HOUR) * 7;
    const courtABookings = bookings.filter((b) => b.courtId === "court-a" && b.date >= format(subDays(new Date(), 7), "yyyy-MM-dd"));
    const courtBBookings = bookings.filter((b) => b.courtId === "court-b" && b.date >= format(subDays(new Date(), 7), "yyyy-MM-dd"));

    const courtAHours = courtABookings.reduce((sum, b) => sum + b.hours, 0);
    const courtBHours = courtBBookings.reduce((sum, b) => sum + b.hours, 0);

    const courtAOccupancy = Math.round((courtAHours / totalSlots) * 100);
    const courtBOccupancy = Math.round((courtBHours / totalSlots) * 100);

    return {
      todayRevenue,
      weekRevenue,
      monthRevenue,
      totalBookings,
      courtAOccupancy,
      courtBOccupancy,
    };
  }

  async getChartData(): Promise<ChartData> {
    const allBookings = await db.select().from(bookingsTable);
    const bookings = allBookings.filter(
      (b) => b.status === "booked" || b.status === "completed"
    );

    const revenueByDay: { date: string; revenue: number }[] = [];
    const bookingsByDay: { date: string; courtA: number; courtB: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      const dayBookings = bookings.filter((b) => b.date === date);
      
      revenueByDay.push({
        date,
        revenue: dayBookings.reduce((sum, b) => sum + b.amount, 0),
      });

      bookingsByDay.push({
        date,
        courtA: dayBookings.filter((b) => b.courtId === "court-a").length,
        courtB: dayBookings.filter((b) => b.courtId === "court-b").length,
      });
    }

    const cricketBookings = bookings.filter((b) => b.sportId === "cricket").length;
    const footballBookings = bookings.filter((b) => b.sportId === "football").length;
    const totalSportBookings = cricketBookings + footballBookings;

    const occupancyByCourtAndSport = [
      {
        court: "All",
        sport: "Cricket",
        percentage: totalSportBookings > 0 ? Math.round((cricketBookings / totalSportBookings) * 100) : 0,
      },
      {
        court: "All",
        sport: "Football",
        percentage: totalSportBookings > 0 ? Math.round((footballBookings / totalSportBookings) * 100) : 0,
      },
    ];

    return {
      revenueByDay,
      bookingsByDay,
      occupancyByCourtAndSport,
    };
  }

  async verifyAdminPassword(username: string, password: string): Promise<User | null> {
    const result = await db.select().from(usersTable).where(eq(usersTable.username, username));
    const user = result[0];
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }
}

export const storage = new DrizzleStorage();
```

---

## Step 6: Run Migrations

In your project root directory, run:

```bash
# Create tables in MySQL
npm run db:push

# If there are conflicts, force push (use with caution)
npm run db:push -- --force
```

This command will:
- Read your Drizzle schema from `shared/schema.ts`
- Create the necessary tables in your MySQL database
- Set up indexes and constraints

**Expected Output:**
```
✔ Creating database tables...
✔ Tables created successfully
✔ Drizzle Kit Push complete
```

---

## Step 7: Start the Application

```bash
# Start development server
npm run dev
```

The application will:
1. Initialize database connection
2. Create sample data (courts, sports, bookings, admin user)
3. Start Express server on http://localhost:5000
4. Load Vite HMR for frontend hot reload

**Expected Output:**
```
12:34:56 PM [express] listening on port 5000
✓ Vite server running...
```

---

## Testing the Setup

### 1. Access the Application
- Open http://localhost:5000 in your browser

### 2. Test Public Booking
- Click "Book a Court"
- Select a date
- Choose a sport (Cricket/Football)
- Select a court and time slot
- Complete the booking

### 3. Test Admin Dashboard
- Click "Admin Login"
- Username: `admin`
- Password: `admin123`
- View dashboard metrics and bookings list

### 4. Verify Database
Login to MySQL and check tables:

```bash
mysql -u court_admin -p court_booking

# In MySQL:
SHOW TABLES;
SELECT COUNT(*) FROM courts;
SELECT COUNT(*) FROM sports;
SELECT COUNT(*) FROM bookings;
SELECT COUNT(*) FROM users;
EXIT;
```

---

## Troubleshooting

### Issue: "Access denied for user 'court_admin'@'localhost'"
**Solution:**
- Verify your `.env` DATABASE_URL has correct username/password
- Check MySQL user exists: `mysql -u root -p -e "SELECT user FROM mysql.user;"`
- Reset user password if needed:
  ```sql
  ALTER USER 'court_admin'@'localhost' IDENTIFIED BY 'new_password';
  FLUSH PRIVILEGES;
  ```

### Issue: "database court_booking does not exist"
**Solution:**
```bash
mysql -u root -p -e "CREATE DATABASE court_booking;"
```

### Issue: "Port 3306 already in use"
**Solution:**
- Kill existing MySQL process or use a different port:
  ```bash
  # Edit .env DATABASE_URL to use port 3307
  DATABASE_URL=mysql://court_admin:password@localhost:3307/court_booking
  ```

### Issue: "npm install fails with mysql2"
**Solution:**
```bash
# Install build tools first
# macOS: xcode-select --install
# Ubuntu: sudo apt install build-essential python3

# Then retry
npm install mysql2
```

### Issue: "Tables already exist during npm run db:push"
**Solution:**
```bash
# Use force push to sync schema
npm run db:push -- --force
```

### Issue: "Connection timeout errors"
**Solution:**
- Verify MySQL is running: `sudo systemctl status mysql` (Linux) or `brew services list` (macOS)
- Check connection string in `.env`
- Ensure firewall allows port 3306

### Issue: "Cannot find module express-mysql-session"
**Solution:**
```bash
npm install express-mysql-session --save
```

---

## Environment Variables Reference

| Variable | Value | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | `mysql://user:pass@localhost:3306/db` | MySQL connection string |
| `SESSION_SECRET` | Random string | Session encryption |
| `NODE_ENV` | `development` or `production` | Environment mode |
| `PORT` | `5000` | Server port |

---

## Quick Reference Commands

```bash
# Start development
npm run dev

# Type checking
npm run check

# Build production
npm run build

# Run production build
npm start

# Drizzle migrations
npm run db:push
npm run db:push -- --force

# Connect to MySQL
mysql -u court_admin -p court_booking

# View MySQL logs (macOS)
tail -f /usr/local/var/mysql/$(hostname).err
```

---

## Security Notes

⚠️ **Important for Production:**

1. **Do NOT commit `.env` to Git** - Add to `.gitignore`:
   ```
   .env
   .env.local
   ```

2. **Use strong passwords** - Replace `your_password` with a secure password

3. **Change default admin credentials** after first login:
   - Update admin password in database
   - Or modify seed data in `server/storage.ts`

4. **Use environment variables** for all sensitive data

5. **Enable SSL/TLS** for production MySQL connections

---

## Next Steps

Once MySQL is running successfully:

1. **Customize admin credentials** - Change default admin/admin123
2. **Add user registration** - Allow public users to create accounts
3. **Integrate payments** - Add Stripe for online payments
4. **Email notifications** - Send booking confirmations via email
5. **Advanced analytics** - Add date range filters and exports

---

## Support Resources

- **MySQL Documentation:** https://dev.mysql.com/doc/
- **Drizzle ORM:** https://orm.drizzle.team/
- **Express.js:** https://expressjs.com/
- **React Documentation:** https://react.dev/

---

**Created:** December 2024
**Last Updated:** December 2024
**Compatibility:** Node.js v16+, MySQL 5.7+
