import { pgTable, text, varchar, integer, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const courts = pgTable("courts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
});

export const sports = pgTable("sports", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  pricePerHour: integer("price_per_hour").notNull(),
});

export const bookings = pgTable("bookings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  sportId: varchar("sport_id", { length: 36 }).notNull(),
  courtId: varchar("court_id", { length: 36 }).notNull(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  hours: integer("hours").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("booked"),
});

export const insertCourtSchema = createInsertSchema(courts).omit({ id: true });
export const insertSportSchema = createInsertSchema(sports).omit({ id: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, uuid: true }).extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^[0-9\-\+ ]{7,20}$/, "Please enter a valid phone number"),
  hours: z.number().min(1, "Minimum 1 hour").max(8, "Maximum 8 hours"),
  date: z.string(),
  startTime: z.string(),
});

export type InsertCourt = z.infer<typeof insertCourtSchema>;
export type Court = typeof courts.$inferSelect;

export type InsertSport = z.infer<typeof insertSportSchema>;
export type Sport = typeof sports.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

export type BookingStatus = "booked" | "cancelled" | "completed";

export interface TimeSlot {
  time: string;
  displayTime: string;
  available: boolean;
  bookingId?: string;
}

export interface DashboardMetrics {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  totalBookings: number;
  courtAOccupancy: number;
  courtBOccupancy: number;
}

export interface ChartData {
  revenueByDay: { date: string; revenue: number }[];
  bookingsByDay: { date: string; courtA: number; courtB: number }[];
  occupancyByCourtAndSport: { court: string; sport: string; percentage: number }[];
}

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
