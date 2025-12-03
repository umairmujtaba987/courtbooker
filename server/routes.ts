import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema } from "@shared/schema";
import { z } from "zod";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized - please log in" });
  }
  next();
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/courts", async (req, res) => {
    try {
      const courts = await storage.getCourts();
      res.json(courts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courts" });
    }
  });

  app.get("/api/sports", async (req, res) => {
    try {
      const sports = await storage.getSports();
      res.json(sports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sports" });
    }
  });

  app.get("/api/availability", async (req, res) => {
    try {
      const date = req.query.date as string;
      if (!date) {
        return res.status(400).json({ message: "Date parameter is required" });
      }
      const availability = await storage.getAvailability(date);
      res.json(availability);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.get("/api/bookings", requireAuth, async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      const courts = await storage.getCourts();
      const sports = await storage.getSports();
      res.json({ bookings, courts, sports });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:id", requireAuth, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.post("/api/bookings", requireAuth, async (req, res) => {
    try {
      const validationResult = insertBookingSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validationResult.error.flatten().fieldErrors,
        });
      }

      const { courtId, date, startTime, hours } = validationResult.data;

      const isAvailable = await storage.checkSlotAvailability(
        courtId,
        date,
        startTime,
        hours
      );

      if (!isAvailable) {
        return res.status(409).json({
          message: "That slot is already taken — please pick another time or court.",
        });
      }

      const booking = await storage.createBooking(validationResult.data);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.post("/api/bookings/:id/cancel", requireAuth, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.status === "cancelled") {
        return res.status(400).json({ message: "Booking is already cancelled" });
      }

      const updatedBooking = await storage.updateBookingStatus(req.params.id, "cancelled");
      res.json(updatedBooking);
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  app.post("/api/bookings/:id/complete", requireAuth, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.status === "cancelled") {
        return res.status(400).json({ message: "Cannot complete a cancelled booking" });
      }

      const updatedBooking = await storage.updateBookingStatus(req.params.id, "completed");
      res.json(updatedBooking);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete booking" });
    }
  });

  app.get("/api/dashboard", requireAuth, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      const charts = await storage.getChartData();
      res.json({ metrics, charts });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  app.get("/api/slots", async (req, res) => {
    try {
      const date = req.query.date as string;
      const courtId = req.query.court_id as string;
      
      if (!date) {
        return res.status(400).json({ message: "Date parameter is required" });
      }
      
      const availability = await storage.getAvailability(date);
      
      if (courtId) {
        const courtSlots = availability.slots[courtId];
        if (!courtSlots) {
          return res.status(404).json({ message: "Court not found" });
        }
        return res.json({ slots: courtSlots });
      }
      
      res.json(availability);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch slots" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.verifyAdminPassword(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      req.session.userId = user.id;
      req.session.username = user.username;
      
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    res.json({ id: req.session.userId, username: req.session.username });
  });

  return httpServer;
}
