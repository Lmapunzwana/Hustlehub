import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRequestSchema, insertOfferSchema, insertOrderSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for image uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  }, express.static(uploadDir));

  // Get nearby sellers
  app.get("/api/sellers/nearby", async (req, res) => {
    try {
      const { lat, lng, radius = 5 } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const radiusKm = parseFloat(radius as string);

      const sellers = await storage.getSellersNearby(latitude, longitude, radiusKm);
      res.json(sellers);
    } catch (error) {
      console.error("Error fetching nearby sellers:", error);
      res.status(500).json({ message: "Failed to fetch sellers" });
    }
  });

  // Get all sellers
  app.get("/api/sellers", async (req, res) => {
    try {
      const sellers = await storage.getSellers();
      res.json(sellers);
    } catch (error) {
      console.error("Error fetching sellers:", error);
      res.status(500).json({ message: "Failed to fetch sellers" });
    }
  });

  // Get categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Create a new request
  app.post("/api/requests", upload.single('image'), async (req, res) => {
    try {
      const requestData = {
        ...req.body,
        buyerId: 1, // For demo purposes, using fixed user ID
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null
      };

      const validatedData = insertRequestSchema.parse(requestData);
      const request = await storage.createRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating request:", error);
      res.status(500).json({ message: "Failed to create request" });
    }
  });

  // Get active requests
  app.get("/api/requests/active", async (req, res) => {
    try {
      await storage.expireOldRequests(); // Clean up expired requests
      const requests = await storage.getActiveRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching active requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  // Get specific request with offers
  app.get("/api/requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      res.json(request);
    } catch (error) {
      console.error("Error fetching request:", error);
      res.status(500).json({ message: "Failed to fetch request" });
    }
  });

  // Create an offer
  app.post("/api/offers", async (req, res) => {
    try {
      const validatedData = insertOfferSchema.parse(req.body);
      const offer = await storage.createOffer(validatedData);
      res.status(201).json(offer);
    } catch (error) {
      console.error("Error creating offer:", error);
      res.status(500).json({ message: "Failed to create offer" });
    }
  });

  // Accept an offer
  app.patch("/api/offers/:id/accept", async (req, res) => {
    try {
      const offerId = parseInt(req.params.id);
      await storage.updateOfferStatus(offerId, "accepted");
      
      // Get the offer to create an order
      const offers = await storage.getOffersByRequest(0); // This is inefficient, but for demo
      const offer = offers.find(o => o.id === offerId);
      
      if (offer) {
        // Update request status to completed
        await storage.updateRequestStatus(offer.requestId!, "completed");
        
        // Create order
        const order = await storage.createOrder({
          requestId: offer.requestId!,
          offerId: offer.id,
          buyerId: 1, // For demo purposes
          sellerId: offer.sellerId!,
          finalPrice: parseFloat(offer.price),
          deliveryOption: "pickup"
        });
        
        res.json({ offer, order });
      } else {
        res.status(404).json({ message: "Offer not found" });
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
      res.status(500).json({ message: "Failed to accept offer" });
    }
  });

  // Get offers for a request (for polling)
  app.get("/api/requests/:id/offers", async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const offers = await storage.getOffersByRequest(requestId);
      res.json(offers);
    } catch (error) {
      console.error("Error fetching offers:", error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  // Demo endpoint to create sample offers (for testing)
  app.post("/api/demo/create-offers/:requestId", async (req, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const sellers = await storage.getSellers();
      
      // Create sample offers from random sellers
      const sampleOffers = [
        {
          requestId,
          sellerId: sellers[0]?.id || 1,
          price: 22.00,
          message: "Fresh vegetables from my garden. Available now!"
        },
        {
          requestId,
          sellerId: sellers[1]?.id || 2,
          price: 20.00,
          message: "Organic vegetables, can deliver in 30 minutes"
        }
      ];

      const createdOffers = [];
      for (const offerData of sampleOffers) {
        const offer = await storage.createOffer(offerData);
        createdOffers.push(offer);
      }

      res.json(createdOffers);
    } catch (error) {
      console.error("Error creating demo offers:", error);
      res.status(500).json({ message: "Failed to create demo offers" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
