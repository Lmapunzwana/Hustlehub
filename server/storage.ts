import { 
  users, sellers, categories, requests, offers, orders, requestViewers,
  type User, type InsertUser,
  type Seller, type InsertSeller, type SellerWithDistance,
  type Category, type InsertCategory,
  type Request, type InsertRequest, type RequestWithOffers,
  type Offer, type InsertOffer, type OfferWithSeller,
  type Order, type InsertOrder,
  type RequestViewer, type InsertRequestViewer
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Seller operations
  getSellers(): Promise<Seller[]>;
  getSellersNearby(lat: number, lng: number, radiusKm: number): Promise<SellerWithDistance[]>;
  createSeller(seller: InsertSeller): Promise<Seller>;
  updateSellerStatus(id: number, isOnline: boolean): Promise<void>;

  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Request operations
  getActiveRequests(): Promise<Request[]>;
  getRequest(id: number): Promise<RequestWithOffers | undefined>;
  createRequest(request: InsertRequest): Promise<Request>;
  updateRequestStatus(id: number, status: string): Promise<void>;
  expireOldRequests(): Promise<void>;

  // Offer operations
  getOffersByRequest(requestId: number): Promise<OfferWithSeller[]>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  updateOfferStatus(id: number, status: string): Promise<void>;

  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getOrdersByUser(userId: number): Promise<Order[]>;

  // Request viewer operations
  addRequestViewer(viewer: InsertRequestViewer): Promise<RequestViewer>;
  getRequestViewers(requestId: number): Promise<Seller[]>;
  updateViewerStatus(requestId: number, sellerId: number, isViewing: boolean): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private sellers: Map<number, Seller> = new Map();
  private categories: Map<number, Category> = new Map();
  private requests: Map<number, Request> = new Map();
  private offers: Map<number, Offer> = new Map();
  private orders: Map<number, Order> = new Map();
  private requestViewers: Map<string, RequestViewer> = new Map(); // key: "requestId-sellerId"
  
  private currentUserId = 1;
  private currentSellerId = 1;
  private currentCategoryId = 1;
  private currentRequestId = 1;
  private currentOfferId = 1;
  private currentOrderId = 1;
  private currentViewerId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed categories
    const foodCategory: Category = {
      id: this.currentCategoryId++,
      name: "Food & Groceries",
      slug: "food-groceries"
    };
    this.categories.set(foodCategory.id, foodCategory);

    const electronicsCategory: Category = {
      id: this.currentCategoryId++,
      name: "Electronics",
      slug: "electronics"
    };
    this.categories.set(electronicsCategory.id, electronicsCategory);

    const clothingCategory: Category = {
      id: this.currentCategoryId++,
      name: "Clothing",
      slug: "clothing"
    };
    this.categories.set(clothingCategory.id, clothingCategory);

    const homeCategory: Category = {
      id: this.currentCategoryId++,
      name: "Home & Garden",
      slug: "home-garden"
    };
    this.categories.set(homeCategory.id, homeCategory);

    const servicesCategory: Category = {
      id: this.currentCategoryId++,
      name: "Services",
      slug: "services"
    };
    this.categories.set(servicesCategory.id, servicesCategory);

    // Seed sellers around Harare, Zimbabwe
    const sellers: Omit<Seller, 'id'>[] = [
      {
        name: "John Mukamuri",
        phone: "+263 77 123 4567",
        whatsapp: "+263 77 123 4567",
        latitude: "-17.8201",
        longitude: "31.0369",
        rating: "4.8",
        isOnline: true,
        lastSeen: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=96&h=96&fit=crop&crop=face"
      },
      {
        name: "Grace Chimedza",
        phone: "+263 77 234 5678",
        whatsapp: "+263 77 234 5678",
        latitude: "-17.8290",
        longitude: "31.0410",
        rating: "4.6",
        isOnline: false,
        lastSeen: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&w=96&h=96&fit=crop&crop=face"
      },
      {
        name: "Tendai Moyo",
        phone: "+263 77 345 6789",
        whatsapp: "+263 77 345 6789",
        latitude: "-17.8150",
        longitude: "31.0280",
        rating: "4.9",
        isOnline: true,
        lastSeen: new Date(),
        profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=96&h=96&fit=crop&crop=face"
      },
      {
        name: "Mary Ncube",
        phone: "+263 77 456 7890",
        whatsapp: "+263 77 456 7890",
        latitude: "-17.8340",
        longitude: "31.0450",
        rating: "4.7",
        isOnline: true,
        lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        profileImageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&w=96&h=96&fit=crop&crop=face"
      },
      {
        name: "David Zimba",
        phone: "+263 77 567 8901",
        whatsapp: "+263 77 567 8901",
        latitude: "-17.8180",
        longitude: "31.0320",
        rating: "4.5",
        isOnline: false,
        lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&w=96&h=96&fit=crop&crop=face"
      }
    ];

    sellers.forEach(seller => {
      const newSeller: Seller = { ...seller, id: this.currentSellerId++ };
      this.sellers.set(newSeller.id, newSeller);
    });
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { ...insertUser, id: this.currentUserId++ };
    this.users.set(user.id, user);
    return user;
  }

  async getSellers(): Promise<Seller[]> {
    return Array.from(this.sellers.values());
  }

  async getSellersNearby(lat: number, lng: number, radiusKm: number): Promise<SellerWithDistance[]> {
    const sellers = Array.from(this.sellers.values());
    return sellers
      .map(seller => {
        const distance = this.calculateDistance(
          lat, lng,
          parseFloat(seller.latitude), parseFloat(seller.longitude)
        );
        return { ...seller, distance };
      })
      .filter(seller => seller.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }

  async createSeller(seller: InsertSeller): Promise<Seller> {
    const newSeller: Seller = { 
      ...seller, 
      id: this.currentSellerId++,
      rating: "0.0",
      lastSeen: new Date(),
      whatsapp: seller.whatsapp || null,
      isOnline: seller.isOnline || false,
      profileImageUrl: seller.profileImageUrl || null
    };
    this.sellers.set(newSeller.id, newSeller);
    return newSeller;
  }

  async updateSellerStatus(id: number, isOnline: boolean): Promise<void> {
    const seller = this.sellers.get(id);
    if (seller) {
      seller.isOnline = isOnline;
      seller.lastSeen = new Date();
      this.sellers.set(id, seller);
    }
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const newCategory: Category = { ...category, id: this.currentCategoryId++ };
    this.categories.set(newCategory.id, newCategory);
    return newCategory;
  }

  async getActiveRequests(): Promise<Request[]> {
    const now = new Date();
    return Array.from(this.requests.values())
      .filter(request => request.status === "active" && request.expiresAt > now);
  }

  async getRequest(id: number): Promise<RequestWithOffers | undefined> {
    const request = this.requests.get(id);
    if (!request) return undefined;

    const offers = await this.getOffersByRequest(id);
    const category = this.categories.get(request.categoryId!);
    
    return {
      ...request,
      offers,
      category: category!
    };
  }

  async createRequest(request: InsertRequest): Promise<Request> {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    const newRequest: Request = { 
      ...request, 
      id: this.currentRequestId++,
      status: "active",
      expiresAt,
      createdAt: new Date(),
      latitude: request.latitude.toString(),
      longitude: request.longitude.toString(),
      maxPrice: request.maxPrice.toString(),
      autoAcceptPrice: request.autoAcceptPrice ? request.autoAcceptPrice.toString() : null,
      autoAcceptEnabled: request.autoAcceptEnabled || false,
      buyerId: request.buyerId || null,
      categoryId: request.categoryId || null,
      imageUrl: request.imageUrl || null
    };
    this.requests.set(newRequest.id, newRequest);
    return newRequest;
  }

  async updateRequestStatus(id: number, status: string): Promise<void> {
    const request = this.requests.get(id);
    if (request) {
      request.status = status;
      this.requests.set(id, request);
    }
  }

  async expireOldRequests(): Promise<void> {
    const now = new Date();
    Array.from(this.requests.values()).forEach(request => {
      if (request.status === "active" && request.expiresAt <= now) {
        request.status = "expired";
        this.requests.set(request.id, request);
      }
    });
  }

  async getOffersByRequest(requestId: number): Promise<OfferWithSeller[]> {
    return Array.from(this.offers.values())
      .filter(offer => offer.requestId === requestId)
      .map(offer => {
        const seller = this.sellers.get(offer.sellerId!);
        return { ...offer, seller: seller! };
      });
  }

  async createOffer(offer: InsertOffer): Promise<Offer> {
    const newOffer: Offer = { 
      ...offer, 
      id: this.currentOfferId++,
      status: "pending",
      createdAt: new Date(),
      price: offer.price.toString(),
      requestId: offer.requestId || null,
      sellerId: offer.sellerId || null,
      message: offer.message || null
    };
    this.offers.set(newOffer.id, newOffer);
    return newOffer;
  }

  async updateOfferStatus(id: number, status: string): Promise<void> {
    const offer = this.offers.get(id);
    if (offer) {
      offer.status = status;
      this.offers.set(id, offer);
    }
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const newOrder: Order = { 
      ...order, 
      id: this.currentOrderId++,
      status: "confirmed",
      createdAt: new Date(),
      finalPrice: order.finalPrice.toString(),
      requestId: order.requestId || null,
      buyerId: order.buyerId || null,
      sellerId: order.sellerId || null,
      offerId: order.offerId || null
    };
    this.orders.set(newOrder.id, newOrder);
    return newOrder;
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.buyerId === userId);
  }

  // Request viewer operations
  async addRequestViewer(viewer: InsertRequestViewer): Promise<RequestViewer> {
    const key = `${viewer.requestId}-${viewer.sellerId}`;
    const existing = this.requestViewers.get(key);
    
    if (existing) {
      // Update existing viewer
      existing.isCurrentlyViewing = viewer.isCurrentlyViewing ?? true;
      existing.viewedAt = new Date();
      this.requestViewers.set(key, existing);
      return existing;
    } else {
      // Create new viewer
      const newViewer: RequestViewer = {
        ...viewer,
        id: this.currentViewerId++,
        viewedAt: new Date(),
        requestId: viewer.requestId || null,
        sellerId: viewer.sellerId || null,
        isCurrentlyViewing: viewer.isCurrentlyViewing ?? true
      };
      this.requestViewers.set(key, newViewer);
      return newViewer;
    }
  }

  async getRequestViewers(requestId: number): Promise<Seller[]> {
    const viewers = Array.from(this.requestViewers.values())
      .filter(viewer => viewer.requestId === requestId && viewer.isCurrentlyViewing);
    
    const sellers: Seller[] = [];
    for (const viewer of viewers) {
      const seller = this.sellers.get(viewer.sellerId!);
      if (seller) {
        sellers.push(seller);
      }
    }
    return sellers;
  }

  async updateViewerStatus(requestId: number, sellerId: number, isViewing: boolean): Promise<void> {
    const key = `${requestId}-${sellerId}`;
    const viewer = this.requestViewers.get(key);
    if (viewer) {
      viewer.isCurrentlyViewing = isViewing;
      this.requestViewers.set(key, viewer);
    }
  }
}

export const storage = new MemStorage();
