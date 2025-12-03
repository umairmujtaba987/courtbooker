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
} from "@shared/schema";
import { randomUUID } from "crypto";
import { format, subDays, parseISO, startOfDay, endOfDay, startOfWeek, startOfMonth } from "date-fns";
import bcrypt from "bcrypt";

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
}

export class MemStorage implements IStorage {
  private courts: Map<string, Court>;
  private sports: Map<string, Sport>;
  private bookings: Map<string, Booking>;
  private admins: Map<string, User>;

  private readonly OPENING_HOUR = 6;
  private readonly CLOSING_HOUR = 23;

  constructor() {
    this.courts = new Map();
    this.sports = new Map();
    this.bookings = new Map();
    this.admins = new Map();
    this.seedData();
  }

  private seedData() {
    const courtA: Court = { id: "court-a", name: "Court A" };
    const courtB: Court = { id: "court-b", name: "Court B" };
    this.courts.set(courtA.id, courtA);
    this.courts.set(courtB.id, courtB);

    const cricket: Sport = { id: "cricket", name: "Cricket", pricePerHour: 2000 };
    const football: Sport = { id: "football", name: "Football", pricePerHour: 2500 };
    this.sports.set(cricket.id, cricket);
    this.sports.set(football.id, football);

    const adminPassword = bcrypt.hashSync("admin123", 10);
    const admin: User = { id: "admin-1", username: "admin", password: adminPassword };
    this.admins.set(admin.username, admin);

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

    sampleBookings.forEach((booking) => {
      const id = randomUUID();
      const uuid = randomUUID().slice(0, 8).toUpperCase();
      this.bookings.set(id, {
        id,
        uuid,
        ...booking,
        status: "booked",
      });
    });
  }

  async getCourts(): Promise<Court[]> {
    return Array.from(this.courts.values());
  }

  async getCourt(id: string): Promise<Court | undefined> {
    return this.courts.get(id);
  }

  async createCourt(court: InsertCourt): Promise<Court> {
    const id = randomUUID();
    const newCourt: Court = { id, ...court };
    this.courts.set(id, newCourt);
    return newCourt;
  }

  async getSports(): Promise<Sport[]> {
    return Array.from(this.sports.values());
  }

  async getSport(id: string): Promise<Sport | undefined> {
    return this.sports.get(id);
  }

  async createSport(sport: InsertSport): Promise<Sport> {
    const id = randomUUID();
    const newSport: Sport = { id, ...sport };
    this.sports.set(id, newSport);
    return newSport;
  }

  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values()).sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingByUuid(uuid: string): Promise<Booking | undefined> {
    return Array.from(this.bookings.values()).find((b) => b.uuid === uuid);
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const uuid = randomUUID().slice(0, 8).toUpperCase();
    const newBooking: Booking = {
      id,
      uuid,
      ...booking,
      status: booking.status || "booked",
    };
    this.bookings.set(id, newBooking);
    return newBooking;
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    const updatedBooking = { ...booking, status };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  async getBookingsForDateAndCourt(date: string, courtId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      (b) => b.date === date && b.courtId === courtId && b.status === "booked"
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
    const bookings = Array.from(this.bookings.values()).filter(
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
    const bookings = Array.from(this.bookings.values()).filter(
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
    const admin = this.admins.get(username);
    if (!admin) return null;
    
    const isValid = await bcrypt.compare(password, admin.password);
    return isValid ? admin : null;
  }
}

export const storage = new MemStorage();
