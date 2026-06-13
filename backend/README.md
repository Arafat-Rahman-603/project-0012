# 🛒Next Shop Backend API

A fully functional Express.js e-commerce REST API with:

- **MongoDB** (Mongoose ODM)
- **JWT Authentication** (access + refresh tokens)
- **Email Verification** (Nodemailer)
- **Forgot/Reset Password** (Nodemailer)
- **Google OAuth 2.0** (Passport.js)
- **Cloudinary** (image uploads for products & avatars)
- **Role-based access control** (user / admin)

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in all values in .env

# 3. Run in development
npm run dev

# 4. Run in production
npm start
```

---

## ⚙️ Environment Variables

| Variable                | Description                                                          |
| ----------------------- | -------------------------------------------------------------------- |
| `PORT`                  | Server port (default: 5000)                                          |
| `MONGODB_URI`           | MongoDB connection string                                            |
| `JWT_SECRET`            | JWT signing secret                                                   |
| `JWT_REFRESH_SECRET`    | Refresh token secret                                                 |
| `EMAIL_HOST`            | SMTP host (e.g. smtp.gmail.com)                                      |
| `EMAIL_USER`            | SMTP email address                                                   |
| `EMAIL_PASS`            | SMTP app password                                                    |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name                                                |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                                                   |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                                                |
| `GOOGLE_CLIENT_ID`      | Google OAuth client ID                                               |
| `GOOGLE_CLIENT_SECRET`  | Google OAuth client secret                                           |
| `GOOGLE_CALLBACK_URL`   | OAuth callback (e.g. http://localhost:5000/api/auth/google/callback) |
| `CLIENT_URL`            | Frontend URL (e.g. http://localhost:3000)                            |

---

## 📡 API Endpoints

### 🔐 Auth — `/api/auth`

| Method | Route                    | Auth | Description                 |
| ------ | ------------------------ | ---- | --------------------------- |
| POST   | `/register`              | ❌   | Register new user           |
| POST   | `/login`                 | ❌   | Login with email/password   |
| POST   | `/logout`                | ❌   | Clear auth cookies          |
| POST   | `/refresh-token`         | ❌   | Get new access token        |
| GET    | `/verify-email/:token`   | ❌   | Verify email address        |
| POST   | `/resend-verification`   | ❌   | Resend verification email   |
| POST   | `/forgot-password`       | ❌   | Send password reset email   |
| PUT    | `/reset-password/:token` | ❌   | Reset password with token   |
| PUT    | `/change-password`       | ✅   | Change password (logged in) |
| GET    | `/me`                    | ✅   | Get current user            |
| GET    | `/google`                | ❌   | Initiate Google OAuth       |
| GET    | `/google/callback`       | ❌   | Google OAuth callback       |

#### Register

```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "pass123"
}
```

#### Login

```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "pass123"
}
```

#### Forgot Password

```json
POST /api/auth/forgot-password
{ "email": "john@example.com" }
```

#### Reset Password

```json
PUT /api/auth/reset-password/<token>
{ "password": "newpass123" }
```

---

### 👤 Users — `/api/users`

| Method | Route                  | Auth | Role  | Description                |
| ------ | ---------------------- | ---- | ----- | -------------------------- |
| GET    | `/profile`             | ✅   | any   | Get own profile + wishlist |
| PUT    | `/profile`             | ✅   | any   | Update name/phone          |
| PUT    | `/avatar`              | ✅   | any   | Upload avatar (multipart)  |
| POST   | `/wishlist/:productId` | ✅   | any   | Toggle wishlist item       |
| POST   | `/addresses`           | ✅   | any   | Add shipping address       |
| PUT    | `/addresses/:id`       | ✅   | any   | Update address             |
| DELETE | `/addresses/:id`       | ✅   | any   | Delete address             |
| GET    | `/`                    | ✅   | admin | Get all users              |
| PUT    | `/:id`                 | ✅   | admin | Update user role/status    |
| DELETE | `/:id`                 | ✅   | admin | Delete user                |

---

### 📦 Products — `/api/products`

| Method | Route                    | Auth | Role     | Description                        |
| ------ | ------------------------ | ---- | -------- | ---------------------------------- |
| GET    | `/`                      | ❌   | —        | List products (filter/search/page) |
| GET    | `/:id`                   | ❌   | —        | Get product by ID or slug          |
| POST   | `/`                      | ✅   | admin    | Create product (multipart images)  |
| PUT    | `/:id`                   | ✅   | admin    | Update product                     |
| DELETE | `/:id`                   | ✅   | admin    | Delete product                     |
| POST   | `/:id/reviews`           | ✅   | verified | Add review                         |
| DELETE | `/:id/reviews/:reviewId` | ✅   | any      | Delete review                      |

#### Product Filters

```
GET /api/products?page=1&limit=12&search=phone&category=<id>&minPrice=100&maxPrice=500&sort=-price&inStock=true&featured=true
```

#### Create Product (multipart/form-data)

```
POST /api/products
Fields: name, description, price, discountPrice, category, stock, brand, sku, tags
Files: images (up to 5)
```

---

### 🛒 Cart — `/api/cart`

| Method | Route      | Auth | Description     |
| ------ | ---------- | ---- | --------------- |
| GET    | `/`        | ✅   | Get cart        |
| POST   | `/`        | ✅   | Add item        |
| PUT    | `/:itemId` | ✅   | Update quantity |
| DELETE | `/:itemId` | ✅   | Remove item     |
| DELETE | `/`        | ✅   | Clear cart      |

---

### 🧾 Orders — `/api/orders`

| Method | Route          | Auth | Role     | Description            |
| ------ | -------------- | ---- | -------- | ---------------------- |
| POST   | `/`            | ✅   | verified | Create order from cart |
| GET    | `/my`          | ✅   | any      | Get my orders          |
| GET    | `/:id`         | ✅   | any      | Get order details      |
| PUT    | `/:id/cancel`  | ✅   | any      | Cancel order           |
| GET    | `/`            | ✅   | admin    | All orders             |
| GET    | `/admin/stats` | ✅   | admin    | Dashboard stats        |
| PUT    | `/:id/status`  | ✅   | admin    | Update order status    |

#### Create Order

```json
POST /api/orders
{
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "01XXXXXXXXX",
    "addressLine1": "123 Main St",
    "city": "Dhaka",
    "state": "Dhaka",
    "postalCode": "1200",
    "country": "BD"
  },
  "paymentMethod": "cod"
}
```

---

### 🏷️ Categories — `/api/categories`

| Method | Route    | Auth | Role  | Description        |
| ------ | -------- | ---- | ----- | ------------------ |
| GET    | `/`      | ❌   | —     | Get all categories |
| GET    | `/:slug` | ❌   | —     | Get category       |
| POST   | `/`      | ✅   | admin | Create category    |
| PUT    | `/:id`   | ✅   | admin | Update category    |
| DELETE | `/:id`   | ✅   | admin | Delete category    |

---

## 🔑 Authentication Flow

### JWT (Bearer Token)

```
Authorization: Bearer <accessToken>
```

Access token expires in **7 days**, refresh token in **30 days**.
Tokens are also set as **httpOnly cookies** automatically.

### Google OAuth Flow

1. Frontend redirects to `GET /api/auth/google`
2. User authenticates with Google
3. Backend callback: `GET /api/auth/google/callback`
4. Returns JWT tokens + user object

---

## 📧 Email Flows

### Register

1. User registers → receives **Verify Email** email
2. User clicks link → `GET /api/auth/verify-email/:token`
3. Email verified → auto-login

### Forgot Password

1. User submits email → `POST /api/auth/forgot-password`
2. User receives **Reset Password** email (valid 1 hour)
3. User submits new password → `PUT /api/auth/reset-password/:token`
4. Password updated → auto-login

---

## 🗂️ Project Structure

```
ecommerce-backend/
├── server.js                  # Entry point
├── .env.example               # Environment template
├── package.json
└── src/
    ├── config/
    │   ├── db.js              # MongoDB connection
    │   ├── cloudinary.js      # Cloudinary + multer
    │   └── passport.js        # Google OAuth strategy
    ├── controllers/
    │   ├── authController.js
    │   ├── userController.js
    │   ├── productController.js
    │   ├── cartController.js
    │   ├── orderController.js
    │   └── categoryController.js
    ├── middleware/
    │   ├── auth.js            # JWT protect, restrictTo
    │   └── errorHandler.js
    ├── models/
    │   ├── User.js
    │   ├── Product.js
    │   ├── Category.js
    │   ├── Order.js
    │   └── Cart.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── userRoutes.js
    │   ├── productRoutes.js
    │   ├── cartRoutes.js
    │   ├── orderRoutes.js
    │   └── categoryRoutes.js
    ├── utils/
    │   ├── email.js           # Nodemailer templates
    │   ├── jwt.js             # Token helpers
    │   └── response.js        # Response helpers
    └── validators/
        └── index.js
```

---

## 🛡️ Security Features

- **Helmet** — HTTP security headers
- **CORS** — Configured for frontend origin
- **Rate Limiting** — Global + per-route (auth, email)
- **bcryptjs** — Password hashing (salt rounds: 12)
- **httpOnly cookies** — XSS-safe token storage
- **Token expiry** — Short-lived access tokens
- **Input validation** — Custom validators
- **Email enumeration prevention** — Consistent forgot-password responses
