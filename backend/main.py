
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import redis
import json
import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set
import math
import base64
from PIL import Image
import io
import hashlib
from pydantic import BaseModel
from contextlib import asynccontextmanager

# Redis connection
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.seller_connections: Dict[str, WebSocket] = {}
        
    async def connect(self, websocket: WebSocket, client_id: str, user_type: str = "buyer"):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        if user_type == "seller":
            self.seller_connections[client_id] = websocket
            
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        if client_id in self.seller_connections:
            del self.seller_connections[client_id]
            
    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_text(message)
            
    async def broadcast_to_sellers(self, message: str, radius_km: float = None, lat: float = None, lng: float = None):
        """Broadcast to all sellers or sellers within radius"""
        target_sellers = self.seller_connections.keys()
        
        if radius_km and lat and lng:
            # Filter sellers by proximity
            nearby_sellers = []
            for seller_id in self.seller_connections.keys():
                seller_data = redis_client.hget(f"seller:{seller_id}", "location")
                if seller_data:
                    seller_location = json.loads(seller_data)
                    distance = calculate_distance(lat, lng, seller_location["lat"], seller_location["lng"])
                    if distance <= radius_km:
                        nearby_sellers.append(seller_id)
            target_sellers = nearby_sellers
            
        for seller_id in target_sellers:
            if seller_id in self.seller_connections:
                await self.seller_connections[seller_id].send_text(message)

manager = ConnectionManager()

# Pydantic models
class SellerLocation(BaseModel):
    lat: float
    lng: float
    timestamp: datetime = None

class Offer(BaseModel):
    id: str
    seller_id: str
    buyer_id: str
    product_name: str
    description: str
    price: float
    quantity: int
    images: List[str]
    location: dict
    status: str = "pending"  # pending, accepted, countered, rejected
    created_at: datetime
    expires_at: datetime

class CounterOffer(BaseModel):
    offer_id: str
    new_price: float
    message: Optional[str] = None

class Report(BaseModel):
    reporter_id: str
    reported_id: str
    offer_id: Optional[str] = None
    reason: str
    description: str

# Utility functions
def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points using Haversine formula"""
    R = 6371  # Earth's radius in km
    
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    
    a = (math.sin(dlat/2) * math.sin(dlat/2) + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
         math.sin(dlng/2) * math.sin(dlng/2))
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def convert_to_webp_base64(image_data: bytes) -> str:
    """Convert image to WebP format and encode as base64"""
    try:
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
            
        # Resize if too large
        max_size = (800, 800)
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Convert to WebP
        output = io.BytesIO()
        image.save(output, format="WebP", quality=85)
        
        # Encode as base64
        webp_data = output.getvalue()
        base64_string = base64.b64encode(webp_data).decode('utf-8')
        
        return f"data:image/webp;base64,{base64_string}"
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format: {str(e)}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Redis with sample data
    await initialize_sample_data()
    yield
    # Cleanup
    pass

app = FastAPI(lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

async def initialize_sample_data():
    """Initialize Redis with sample seller data"""
    sellers = [
        {
            "id": "seller_1",
            "name": "John Mukamuri",
            "phone": "+263 77 123 4567",
            "whatsapp": "+263 77 123 4567",
            "rating": 4.8,
            "category": "Food & Groceries",
            "location": {"lat": -17.8201, "lng": 31.0369}
        },
        {
            "id": "seller_2", 
            "name": "Grace Chimedza",
            "phone": "+263 77 234 5678",
            "whatsapp": "+263 77 234 5678",
            "rating": 4.6,
            "category": "Food & Groceries",
            "location": {"lat": -17.8290, "lng": 31.0410}
        },
        {
            "id": "seller_3",
            "name": "Tendai Moyo", 
            "phone": "+263 77 345 6789",
            "whatsapp": "+263 77 345 6789",
            "rating": 4.9,
            "category": "Electronics",
            "location": {"lat": -17.8150, "lng": 31.0280}
        }
    ]
    
    for seller in sellers:
        redis_client.hset(f"seller:{seller['id']}", mapping={
            "data": json.dumps(seller),
            "location": json.dumps(seller["location"]),
            "last_seen": datetime.now().isoformat(),
            "is_online": "false"
        })

# WebSocket endpoints
@app.websocket("/ws/{client_id}/{user_type}")
async def websocket_endpoint(websocket: WebSocket, client_id: str, user_type: str):
    await manager.connect(websocket, client_id, user_type)
    
    # Mark seller as online if seller connection
    if user_type == "seller":
        redis_client.hset(f"seller:{client_id}", "is_online", "true")
        redis_client.hset(f"seller:{client_id}", "last_seen", datetime.now().isoformat())
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Handle location updates from sellers
            if message_data.get("type") == "location_update" and user_type == "seller":
                location = {
                    "lat": message_data["lat"],
                    "lng": message_data["lng"]
                }
                redis_client.hset(f"seller:{client_id}", "location", json.dumps(location))
                redis_client.hset(f"seller:{client_id}", "last_seen", datetime.now().isoformat())
                
    except WebSocketDisconnect:
        manager.disconnect(client_id)
        if user_type == "seller":
            redis_client.hset(f"seller:{client_id}", "is_online", "false")
            redis_client.hset(f"seller:{client_id}", "last_seen", datetime.now().isoformat())

# API endpoints
@app.get("/api/sellers/nearby")
async def get_nearby_sellers(lat: float, lng: float, radius: float = 5.0):
    """Get sellers within specified radius"""
    sellers = []
    
    # Get all seller keys
    seller_keys = redis_client.keys("seller:*")
    
    for key in seller_keys:
        seller_data = redis_client.hget(key, "data")
        location_data = redis_client.hget(key, "location")
        is_online = redis_client.hget(key, "is_online") == "true"
        last_seen = redis_client.hget(key, "last_seen")
        
        if seller_data and location_data:
            seller = json.loads(seller_data)
            location = json.loads(location_data)
            
            distance = calculate_distance(lat, lng, location["lat"], location["lng"])
            
            if distance <= radius:
                seller.update({
                    "distance": round(distance, 1),
                    "is_online": is_online,
                    "last_seen": last_seen
                })
                sellers.append(seller)
    
    # Sort by distance
    sellers.sort(key=lambda x: x["distance"])
    return sellers

@app.post("/api/offers")
async def create_offer(
    buyer_id: str = Form(...),
    product_name: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    quantity: int = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    radius: float = Form(5.0),
    images: List[UploadFile] = File(...)
):
    """Create a new offer and broadcast to nearby sellers"""
    
    # Validate minimum 2 images
    if len(images) < 2:
        raise HTTPException(status_code=400, detail="Minimum 2 images required")
    
    # Process images
    processed_images = []
    for image in images:
        image_data = await image.read()
        webp_base64 = convert_to_webp_base64(image_data)
        processed_images.append(webp_base64)
    
    # Create offer
    offer_id = str(uuid.uuid4())
    offer_data = {
        "id": offer_id,
        "buyer_id": buyer_id,
        "product_name": product_name,
        "description": description,
        "price": price,
        "quantity": quantity,
        "images": processed_images,
        "location": {"lat": lat, "lng": lng},
        "status": "pending",
        "created_at": datetime.now().isoformat(),
        "expires_at": (datetime.now() + timedelta(hours=24)).isoformat()
    }
    
    # Store in Redis
    redis_client.hset(f"offer:{offer_id}", "data", json.dumps(offer_data))
    redis_client.expire(f"offer:{offer_id}", 86400)  # 24 hours
    
    # Broadcast to nearby sellers
    broadcast_message = {
        "type": "new_offer",
        "offer": offer_data
    }
    
    await manager.broadcast_to_sellers(
        json.dumps(broadcast_message),
        radius_km=radius,
        lat=lat,
        lng=lng
    )
    
    return {"offer_id": offer_id, "message": "Offer created and broadcasted"}

@app.get("/api/offers/{offer_id}")
async def get_offer(offer_id: str):
    """Get offer details"""
    offer_data = redis_client.hget(f"offer:{offer_id}", "data")
    if not offer_data:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    return json.loads(offer_data)

@app.post("/api/offers/{offer_id}/counter")
async def counter_offer(offer_id: str, counter: CounterOffer):
    """Submit counter offer (seller can only change price)"""
    offer_data = redis_client.hget(f"offer:{offer_id}", "data")
    if not offer_data:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    offer = json.loads(offer_data)
    
    # Create counter offer
    counter_id = str(uuid.uuid4())
    counter_data = {
        "id": counter_id,
        "original_offer_id": offer_id,
        "seller_id": counter.offer_id,  # This should be seller_id in real implementation
        "new_price": counter.new_price,
        "message": counter.message,
        "created_at": datetime.now().isoformat()
    }
    
    redis_client.hset(f"counter:{counter_id}", "data", json.dumps(counter_data))
    
    # Notify buyer
    notification = {
        "type": "counter_offer",
        "counter_offer": counter_data,
        "original_offer": offer
    }
    
    await manager.send_personal_message(
        json.dumps(notification),
        offer["buyer_id"]
    )
    
    return {"counter_id": counter_id, "message": "Counter offer sent"}

@app.post("/api/offers/{offer_id}/accept")
async def accept_offer(offer_id: str, seller_id: str = Form(...)):
    """Accept an offer and reveal contact information"""
    offer_data = redis_client.hget(f"offer:{offer_id}", "data")
    if not offer_data:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    offer = json.loads(offer_data)
    
    # Update offer status
    offer["status"] = "accepted"
    offer["seller_id"] = seller_id
    offer["accepted_at"] = datetime.now().isoformat()
    
    redis_client.hset(f"offer:{offer_id}", "data", json.dumps(offer))
    
    # Get seller and buyer contact info
    seller_data = redis_client.hget(f"seller:{seller_id}", "data")
    # In real app, you'd get buyer data too
    
    if seller_data:
        seller = json.loads(seller_data)
        
        # Send mutual contact info
        contact_exchange = {
            "type": "offer_accepted",
            "offer_id": offer_id,
            "seller_contact": {
                "name": seller["name"],
                "phone": seller["phone"],
                "whatsapp": seller.get("whatsapp")
            },
            "buyer_contact": {
                "name": "Buyer",  # You'd get real buyer data
                "phone": "+263 77 XXX XXXX"  # Placeholder
            }
        }
        
        # Notify both parties
        await manager.send_personal_message(
            json.dumps(contact_exchange),
            offer["buyer_id"]
        )
        await manager.send_personal_message(
            json.dumps(contact_exchange),
            seller_id
        )
    
    return {"message": "Offer accepted, contact information exchanged"}

@app.post("/api/reports")
async def report_user(report: Report):
    """Report inappropriate behavior"""
    report_id = str(uuid.uuid4())
    report_data = {
        "id": report_id,
        "reporter_id": report.reporter_id,
        "reported_id": report.reported_id,
        "offer_id": report.offer_id,
        "reason": report.reason,
        "description": report.description,
        "created_at": datetime.now().isoformat()
    }
    
    redis_client.hset(f"report:{report_id}", "data", json.dumps(report_data))
    
    return {"report_id": report_id, "message": "Report submitted"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
