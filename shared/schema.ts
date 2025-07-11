import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const sellers = pgTable("sellers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.0"),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
  profileImageUrl: text("profile_image_url"),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").references(() => users.id),
  description: text("description").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  maxPrice: decimal("max_price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  status: varchar("status", { length: 20 }).default("active"), // active, completed, expired
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => requests.id),
  sellerId: integer("seller_id").references(() => sellers.id),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  message: text("message"),
  status: varchar("status", { length: 20 }).default("pending"), // pending, accepted, rejected, countered
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => requests.id),
  offerId: integer("offer_id").references(() => offers.id),
  buyerId: integer("buyer_id").references(() => users.id),
  sellerId: integer("seller_id").references(() => sellers.id),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }).notNull(),
  deliveryOption: varchar("delivery_option", { length: 20 }).notNull(), // pickup, delivery, meet_halfway
  status: varchar("status", { length: 20 }).default("confirmed"), // confirmed, in_progress, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSellerSchema = createInsertSchema(sellers).omit({
  id: true,
  rating: true,
  lastSeen: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertRequestSchema = createInsertSchema(requests).omit({
  id: true,
  status: true,
  createdAt: true,
}).extend({
  maxPrice: z.coerce.number().positive(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
});

export const insertOfferSchema = createInsertSchema(offers).omit({
  id: true,
  status: true,
  createdAt: true,
}).extend({
  price: z.coerce.number().positive(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  status: true,
  createdAt: true,
}).extend({
  finalPrice: z.coerce.number().positive(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Seller = typeof sellers.$inferSelect;
export type InsertSeller = z.infer<typeof insertSellerSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Request = typeof requests.$inferSelect;
export type InsertRequest = z.infer<typeof insertRequestSchema>;

export type Offer = typeof offers.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Extended types for API responses
export type SellerWithDistance = Seller & {
  distance?: number;
};

export type RequestWithOffers = Request & {
  offers: (Offer & { seller: Seller })[];
  category: Category;
};

export type OfferWithSeller = Offer & {
  seller: Seller;
};
