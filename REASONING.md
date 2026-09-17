# Reasoning

## Problem
Built a full-stack café loyalty points management system.

## Architecture
The application uses React/Vite for the frontend, Node.js/Express.js for REST APIs, and MongoDB/Mongoose for persistence.

## Core Features
- User registration and login
- Member CRUD
- Search by name and phone
- Pagination and sorting
- Purchase point earning
- Point redemption
- Silver, Gold and Platinum tiers
- Lifetime point tracking
- 90-day point expiry
- Tier-change notification using an outbox

## Loyalty Logic
Members have a current points balance and lifetime earned points.

Current usable balance can decrease through redemption and expiry.

Lifetime points represent total points earned and are not decreased by redemption or expiry.

Platinum is supported for members with lifetime points of at least 5000 and earns 0.30 points per ₹.

## Expiry
Each purchase creates a PointLot with an expiry date 90 days after earning.

POST /clock processes expired point lots and removes their remaining points from the usable balance.

## Notifications
When a purchase causes a member to cross into a new tier, a TIER_CHANGED event is written to the Outbox collection.

GET /outbox exposes these notification events.

## Testing
The backend was tested for MongoDB connectivity, server startup, member APIs, purchase, redemption, clock processing and outbox access.