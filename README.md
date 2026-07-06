# E-Commerce Backend API

A full-featured, production-ready REST API for an e-commerce platform, built with **Node.js**, **Express**, and **MongoDB**. Supports user authentication (JWT + Google OAuth), product management, shopping cart, wishlists, orders, Stripe payments, coupon discounts, product reviews, and a full admin panel.

---

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
  - [Auth](#-auth)
  - [Products](#-products)
  - [Categories](#-categories)
  - [Cart](#-cart)
  - [Wishlist](#-wishlist)
  - [Orders](#-orders)
  - [Coupons](#-coupons)
  - [Reviews](#-reviews)
  - [Admin](#-admin)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Testing](#testing)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT (HTTP-only cookie) + Google OAuth |
| Payments | Stripe Checkout + Webhooks |
| Password Hashing | bcryptjs |
| Dev Server | Nodemon |

---

## ✨ Features

- **Auth** — Register, login, logout, Google OAuth sign-in
- **JWT Auth** — Secure HTTP-only cookie-based sessions with 30-day expiry
- **Role-based Access** — `customer` and `admin` roles with protected routes
- **Products** — Full CRUD with search, category filter, price range, sorting, and pagination
- **Categories** — Slug auto-generation, lookup by ID or slug
- **Shopping Cart** — Per-user cart with stock validation and quantity management
- **Wishlist** — Toggle products in/out of wishlist
- **Orders** — COD (manual) orders and Stripe Checkout Session flow
- **Stripe Webhooks** — Automatic order fulfillment on payment success
- **Coupons** — Percentage and flat discount coupons with expiry
- **Reviews** — Create/update/delete reviews; auto-recalculates product rating
- **Admin Panel** — Manage users, orders, and view dashboard analytics
- **Error Handling** — Centralized error middleware with Mongoose-specific error parsing

---

## 📁 Project Structure

```
server/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── adminController.js     # Admin: users, orders, analytics
│   ├── authController.js      # Register, login, Google OAuth, profile
│   ├── cartController.js      # Cart CRUD
│   ├── categoryController.js  # Category CRUD
│   ├── couponController.js    # Coupon management & validation
│   ├── orderController.js     # Stripe checkout, COD, webhooks
│   ├── productController.js   # Product CRUD with filtering
│   ├── reviewController.js    # Product reviews
│   └── wishlistController.js  # Wishlist toggle
├── middleware/
│   ├── authMiddleware.js      # protect + admin guards
│   └── errorMiddleware.js     # Global error handler
├── models/
│   ├── Cart.js
│   ├── Category.js
│   ├── Coupon.js
│   ├── Order.js
│   ├── Product.js
│   ├── Review.js
│   └── User.js
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── cartRoutes.js
│   ├── categoryRoutes.js
│   ├── couponRoutes.js
│   ├── orderRoutes.js
│   ├── productRoutes.js
│   ├── reviewRoutes.js
│   └── wishlistRoutes.js
├── utils/
│   └── generateToken.js       # JWT generation + cookie setter
├── .env                       # Environment variables (not committed)
├── package.json
└── server.js                  # App entry point
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (or local MongoDB)
- [Stripe](https://stripe.com/) account (optional, for payments)

### Installation

```bash
# 1. Navigate to the server directory
cd server

# 2. Install dependencies
npm install

# 3. Create your .env file (see Environment Variables below)

# 4. Start the development server
npm run dev
```

The API will be running at **`http://localhost:5000`**.

---

## 🔑 Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/ecommerce

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d

# Stripe (optional — required for Stripe Checkout)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google OAuth (optional — required for Google sign-in)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Frontend URL (for CORS and Stripe redirects)
CLIENT_URL=http://localhost:3000
```

---

## 📡 API Reference

> **Legend:**
> - 🔓 Public — No authentication required
> - 🔒 Private — Requires a logged-in user (JWT cookie)
> - 🛡 Admin — Requires admin role

---

### 👤 Auth

**Base path:** `/api/auth`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/register` | 🔓 Public | Register a new user |
| `POST` | `/login` | 🔓 Public | Login and receive JWT cookie |
| `POST` | `/google` | 🔓 Public | Sign in / sign up via Google ID token |
| `POST` | `/logout` | 🔓 Public | Clear the JWT cookie |
| `GET` | `/profile` | 🔒 Private | Get the logged-in user's profile |
| `PUT` | `/profile` | 🔒 Private | Update name, email, or password |

**Register Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

**Login Body:**
```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```

---

### 📦 Products

**Base path:** `/api/products`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/` | 🔓 Public | Get all products (with filters) |
| `GET` | `/:id` | 🔓 Public | Get a single product by ID |
| `POST` | `/` | 🛡 Admin | Create a new product |
| `PUT` | `/:id` | 🛡 Admin | Update a product |
| `DELETE` | `/:id` | 🛡 Admin | Delete a product (and its reviews) |

**Query Parameters for `GET /api/products`:**

| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `keyword` | string | `laptop` | Search name or description |
| `category` | ObjectId | `664abc...` | Filter by category ID |
| `minPrice` | number | `100` | Minimum price |
| `maxPrice` | number | `500` | Maximum price |
| `sortBy` | string | `price:asc` | Field and direction (`asc`/`desc`) |
| `page` | number | `1` | Page number |
| `limit` | number | `12` | Results per page |

**Create/Update Product Body:**
```json
{
  "name": "Gaming Laptop",
  "price": 1299.99,
  "description": "High performance gaming laptop",
  "images": ["https://example.com/image.jpg"],
  "category": "<categoryId>",
  "stock": 25
}
```

---

### 🏷 Categories

**Base path:** `/api/categories`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/` | 🔓 Public | Get all categories |
| `GET` | `/:idOrSlug` | 🔓 Public | Get by MongoDB ID or slug |
| `POST` | `/` | 🛡 Admin | Create a category |
| `PUT` | `/:id` | 🛡 Admin | Update a category |
| `DELETE` | `/:id` | 🛡 Admin | Delete a category |

> Slugs are auto-generated from the name on save.  
> Example: `"Phone Accessories"` → `phone-accessories`

---

### 🛒 Cart

**Base path:** `/api/cart` — All routes require authentication.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/` | 🔒 Private | Get the current user's cart |
| `POST` | `/` | 🔒 Private | Add an item to the cart |
| `PUT` | `/:productId` | 🔒 Private | Update item quantity |
| `DELETE` | `/:productId` | 🔒 Private | Remove a specific item |
| `DELETE` | `/` | 🔒 Private | Clear the entire cart |

**Add to Cart Body:**
```json
{
  "productId": "<productId>",
  "quantity": 2
}
```

---

### ❤️ Wishlist

**Base path:** `/api/wishlist` — All routes require authentication.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/` | 🔒 Private | Get the user's wishlist |
| `POST` | `/:productId` | 🔒 Private | Toggle product in/out of wishlist |

---

### 📬 Orders

**Base path:** `/api/orders`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/checkout-session` | 🔒 Private | Create a Stripe Checkout session |
| `POST` | `/webhook` | 🔓 Public | Stripe webhook receiver |
| `POST` | `/` | 🔒 Private | Place a manual / COD order |
| `GET` | `/myorders` | 🔒 Private | Get all orders for the logged-in user |
| `GET` | `/:id` | 🔒 Private | Get a specific order by ID |

**COD Order Body:**
```json
{
  "shippingAddress": {
    "address": "123 Main Street",
    "city": "Karachi",
    "postalCode": "75000",
    "country": "Pakistan"
  },
  "paymentMethod": "COD (Cash On Delivery)",
  "couponCode": "SAVE20"
}
```

**Pricing Logic:**
| Item | Rule |
|------|------|
| Shipping | Free on orders > $100, otherwise $10 |
| Discount | Applied before tax via coupon |
| Tax | 15% of (itemsPrice − discount) |
| Total | itemsPrice − discount + tax + shipping |

---

### 🎟 Coupons

**Base path:** `/api/coupons`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/` | 🛡 Admin | Get all coupons |
| `POST` | `/` | 🛡 Admin | Create a coupon |
| `DELETE` | `/:id` | 🛡 Admin | Delete a coupon |
| `GET` | `/apply/:code` | 🔒 Private | Validate and preview a coupon |

**Create Coupon Body:**
```json
{
  "code": "SAVE20",
  "discountType": "Percentage",
  "discountValue": 20,
  "expiryDate": "2027-12-31",
  "isActive": true
}
```

> `discountType`: `"Percentage"` or `"Flat"`

---

### ⭐ Reviews

**Base path:** `/api/reviews`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/:productId` | 🔓 Public | Get all reviews for a product |
| `POST` | `/:productId` | 🔒 Private | Create or update your review |
| `DELETE` | `/:id` | 🔒 Private | Delete a review (owner or admin) |

> Submitting a review when one already exists **updates** it.  
> The product's `ratings` and `numReviews` are recalculated automatically after every change.

**Create Review Body:**
```json
{
  "rating": 5,
  "comment": "Excellent product, highly recommended!"
}
```

---

### 🛡 Admin

**Base path:** `/api/admin` — All routes require authentication **and** the `admin` role.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users` | Get all registered users |
| `PUT` | `/users/:id/role` | Promote or demote a user |
| `GET` | `/orders` | Get all orders in the system |
| `PUT` | `/orders/:id/status` | Update an order's status |
| `GET` | `/analytics` | Get dashboard analytics |

**Update User Role Body:**
```json
{ "role": "admin" }
```

> Valid roles: `customer`, `admin`

**Update Order Status Body:**
```json
{
  "orderStatus": "Shipped",
  "isPaid": true,
  "isDelivered": false
}
```

> Valid `orderStatus` values: `Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`

**Analytics Response:**
```json
{
  "success": true,
  "data": {
    "counts": { "users": 120, "products": 45, "orders": 310 },
    "financials": { "totalSales": 48320.50 },
    "monthlySales": [
      { "month": "Jan 2026", "sales": 8200.00, "orderCount": 52 }
    ]
  }
}
```

---

## 🔐 Authentication

This API uses **JWT stored in an HTTP-only cookie** named `jwt`.

- The cookie is set automatically on **register**, **login**, and **Google OAuth**
- It is cleared on **logout**
- For browser clients: cookies are sent automatically (set `credentials: 'include'` in fetch or `withCredentials: true` in axios)
- For API testing tools: manually copy the `jwt` cookie value after login and send it as a `Cookie: jwt=<value>` header

**Cookie properties:**

| Property | Value |
|----------|-------|
| `httpOnly` | `true` — not accessible via JS |
| `secure` | `true` in production (HTTPS only) |
| `sameSite` | `strict` |
| `maxAge` | 30 days |

---

## ❗ Error Handling

All errors return a consistent JSON structure:

```json
{
  "success": false,
  "message": "Descriptive error message",
  "stack": "..."
}
```

> `stack` is only included in `development` mode.

| Error Type | HTTP Status | Trigger |
|------------|-------------|---------|
| Invalid ObjectId (CastError) | `400` | Malformed ID in URL |
| Validation Error | `400` | Mongoose schema validation failed |
| Duplicate Key (11000) | `400` | Unique field conflict (e.g. duplicate email) |
| Not Authorized | `401` | Missing or invalid JWT |
| Forbidden | `403` | Valid token but insufficient role |
| Not Found | `404` | Resource does not exist |
| Server Error | `500` | Unexpected internal error |

---

## 🧪 Testing

A complete **Bruno** collection is provided in the `api-tests/` directory, covering every route.

### Setup

1. Download [Bruno](https://www.usebruno.com/) (free, offline API client)
2. Open Bruno → **Open Collection** → navigate to `api-tests/`
3. Select **"Local Dev"** from the environment dropdown (top right)

### Recommended Test Order

```
1.  Auth → Register User
2.  Auth → Login User               ← copy jwt cookie → paste into jwtToken env var
3.  Categories → Create Category    ← copy _id → paste into categoryId env var
4.  Products → Create Product       ← copy _id → paste into productId env var
5.  Cart → Add Item To Cart
6.  Cart → Get Cart
7.  Wishlist → Toggle Wishlist
8.  Orders → Create Manual Order    ← copy _id → paste into orderId env var
9.  Coupons → Create Coupon
10. Coupons → Apply Coupon
11. Reviews → Create Review
12. Admin → Get Dashboard Analytics
```

### NPM Scripts

```bash
npm run dev    # Start with hot reload (nodemon)
npm start      # Start production server
```
