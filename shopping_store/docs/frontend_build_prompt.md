# Frontend Build Prompt — Shopping Store

Use this entire document as a prompt for ChatGPT to build a complete React frontend for the Shopping Store backend.

---

## CONTEXT

This is a learning project. The backend is already fully built using FastAPI + SQLite. Your job is to build a professional React frontend that connects to it.

---

## PROJECT LOCATION

Create the frontend at this exact path:
```
/Volumes/Aditya SSD/python_learnings/python_learnings/shopping_store_frontend/
```

The backend already exists at:
```
/Volumes/Aditya SSD/python_learnings/python_learnings/shopping_store/
```

Both folders sit side by side inside:
```
/Volumes/Aditya SSD/python_learnings/python_learnings/
```

Initialize the React project inside `shopping_store_frontend/` using Vite:
```
npm create vite@latest . -- --template react
```
Then install all dependencies and scaffold the full project structure described below.

---

## BACKEND SETUP NOTE (Important)

Before the frontend can work, the backend needs CORS enabled.

Add this to `/Volumes/Aditya SSD/python_learnings/python_learnings/shopping_store/main.py` after `app = FastAPI(...)`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

The backend runs at: `http://localhost:8000`
The backend entry point is: `main.py` at the root of the shopping_store folder (not inside app/).

---

## TECH STACK

- React 18 + Vite
- React Router v6
- Axios (with interceptors for JWT auth)
- Zustand (global state: auth, cart count)
- TailwindCSS
- shadcn/ui components
- React Hot Toast (notifications)
- TanStack Query / React Query v5 (data fetching + caching)

---

## AUTH SYSTEM

**Base URL:** `http://localhost:8000`

Store `access_token` and `refresh_token` in Zustand + localStorage.

### Endpoints

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | /auth/register | `{ name, email, password }` | Register new user |
| POST | /auth/login | `{ email, email, password }` | Login — returns tokens only |
| POST | /auth/logout | `{ refresh_token }` | Logout |
| POST | /auth/refresh_token | `{ refresh_token }` | Get new access token |

### Login Response Shape
```json
{
  "status": true,
  "message": "Login successful",
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "token_type": "bearer"
  }
}
```

> **Important:** Login does NOT return user info. After login, call `GET /user/me` to get the user's name, email, and role. Store role in Zustand.

### Axios Interceptor Rules
- Attach `Authorization: Bearer <access_token>` to every request
- On 401 → auto-call `/auth/refresh_token` with `{ refresh_token }` → retry original request
- On refresh failure → logout user + redirect to `/login`

### Roles
- `user` — browse products, manage cart, place/cancel orders
- `admin` — everything above + create/edit/delete products and categories

---

## ALL API ENDPOINTS

### User
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /user/me | user | Get my profile |
| PATCH | /user/me | user | Update profile `{ name?, email?, password? }` |

### Products
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /products/ | user | List all products |
| GET | /products/{product_id} | user | Get single product |
| GET | /products/search?product_name=xyz | user | Search by name |
| GET | /products/category/{category_id} | user | Filter by category |
| POST | /products/ | admin | Create product |
| PATCH | /products/{product_id} | admin | Update product |
| PATCH | /products/{product_id}/stock?new_quantity=10 | admin | Update stock (query param) |
| PATCH | /products/{product_id}/price?new_price=99.99 | admin | Update price (query param) |
| DELETE | /products/{product_id} | admin | Delete product |

**Product Response Shape:**
```json
{
  "id": "uuid",
  "name": "Product Name",
  "description": "...",
  "price": "99.99",
  "stock_quantity": 10,
  "sku": "SKU-001",
  "is_active": true,
  "category_id": "uuid",
  "created_at": "...",
  "updated_at": "..."
}
```

**Create Product Body:**
```json
{ "name": "", "description": "", "price": 0.0, "stock_quantity": 0, "sku": "", "category_id": "uuid" }
```

### Categories
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /categories/ | user | List all |
| GET | /categories/{category_id} | user | Get single |
| GET | /categories/search/?category_name=xyz | user | Search |
| POST | /categories/ | admin | Create `{ name, description }` |
| PATCH | /categories/{category_id} | admin | Update |
| DELETE | /categories/{category_id} | admin | Delete |

### Cart
| Method | Path | Auth | Body | Description |
|--------|------|------|------|-------------|
| GET | /cart/ | user | — | Get my cart |
| POST | /cart/ | user | `{ product_id, quantity }` | Add to cart |
| PATCH | /cart/{product_id} | user | `{ quantity }` | Update quantity |
| DELETE | /cart/{product_id} | user | — | Remove item |

**Cart Response Shape:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "items": [
    {
      "id": "uuid",
      "cart_id": "uuid",
      "product_id": "uuid",
      "quantity": 2,
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "created_at": "...",
  "updated_at": "..."
}
```

> **Important:** Cart items only contain `product_id` and `quantity` — no product name or price. To display cart properly, fetch product details for each `product_id` using `GET /products/{product_id}`, or fetch all products once and match by ID.

### Orders
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /orders/ | user | My order history |
| POST | /orders/ | user | Create order from current cart |
| POST | /orders/{order_id}/cancel | user | Cancel order |

**Order Response Shape:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "status": "pending",
  "total_amount": "199.98",
  "items": [
    {
      "id": "uuid",
      "order_id": "uuid",
      "product_id": "uuid",
      "product_name": "Product Name",
      "unit_price": "99.99",
      "quantity": 2,
      "subtotal": "199.98",
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "created_at": "...",
  "updated_at": "..."
}
```

> Order items DO have `product_name` and `unit_price` (snapshotted at order time), so no extra API call needed for orders.

---

## STANDARD API RESPONSE FORMAT

Every API response follows this wrapper:
```json
{
  "status": true,
  "message": "...",
  "data": { ... }
}
```

Always read data from `response.data.data` in Axios.

For errors:
```json
{
  "status": false,
  "message": "Error description",
  "data": null
}
```

---

## PAGES & ROUTES

### Public (no auth)
- `/login` — Login page
- `/register` — Register page

### Private (any logged-in user)
- `/` — Home / Product listing
- `/products/:id` — Product detail
- `/cart` — Cart
- `/orders` — My orders
- `/profile` — View + edit profile

### Admin only
- `/admin/products` — Manage products
- `/admin/categories` — Manage categories

---

## UI DESIGN REQUIREMENTS

Design this like a premium e-commerce site (Shopify-level quality).

### Global
- **Font:** Inter (from Google Fonts)
- **Color palette:**
  - Navbar/sidebar background: `#0f172a` (dark navy)
  - Main content background: `#f8fafc` (off-white)
  - Primary CTA color: `#6366f1` (indigo)
  - Success: green, Warning: yellow, Error: red
- **Spacing:** generous padding, clean card shadows (`shadow-md`)
- **Animations:** subtle fade-in on page load, smooth hover transitions
- **Fully mobile responsive** with hamburger menu on small screens

### Navbar
- Logo on left
- Nav links in center (Home, Orders, Cart)
- Cart icon with item count badge on right
- User avatar with dropdown (Profile, Logout) on right
- Admin link visible only if `role === "admin"`

### Home / Product Listing
- Category filter tabs (horizontal scroll)
- Search bar
- Product grid (3 cols desktop, 2 cols tablet, 1 col mobile)
- Product card: gradient placeholder image, name, price, stock badge, "Add to Cart" button
- Stock badges: "In Stock" (green), "Low Stock" (yellow, if stock < 5), "Out of Stock" (red, disable button)
- Loading skeleton cards while fetching

### Product Detail
- Large gradient image placeholder
- Name, SKU, price, stock, category name
- Quantity selector with +/- buttons
- "Add to Cart" CTA (disabled if out of stock)

### Cart Page
- Left: list of cart items — product name, quantity stepper, unit price, line total, remove button
- Right sidebar: order summary — item count, subtotal, "Place Order" button
- Empty cart state with illustration/message and "Browse Products" link
- After placing order: show success toast + redirect to `/orders`

### Orders Page
- List of orders, newest first
- Each order card: order ID (show first 8 chars), date, status badge (color-coded), total amount, item count
- Status colors: PENDING=yellow, CONFIRMED=blue, SHIPPED=purple, DELIVERED=green, CANCELLED=red
- "Cancel Order" button visible only for `status === "pending"`
- Expandable order items list (show product_name, quantity, unit_price, subtotal)

### Admin — Products Page
- Table with all products
- Columns: Name, SKU, Category, Price, Stock, Status (active/inactive), Actions
- Actions per row: Edit (modal), Delete (confirm dialog), Update Stock (inline input), Update Price (inline input)
- "Create Product" button → modal with full form (name, sku, description, price, stock, category dropdown populated from API)

### Admin — Categories Page
- Same table pattern
- Fields: name, description
- Create/Edit/Delete

### Profile Page
- Editable form: name, email
- Separate section: change password (current password not required — just send new password in PATCH /user/me)

---

## PROJECT FILE STRUCTURE

```
shopping_store_frontend/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── api/
    │   ├── axios.js           ← axios instance + interceptors
    │   ├── authApi.js
    │   ├── productApi.js
    │   ├── categoryApi.js
    │   ├── cartApi.js
    │   ├── orderApi.js
    │   └── userApi.js
    ├── store/
    │   ├── authStore.js       ← Zustand: user, role, tokens, login(), logout()
    │   └── cartStore.js       ← Zustand: cart item count for navbar badge
    ├── components/
    │   ├── Navbar.jsx
    │   ├── ProtectedRoute.jsx
    │   ├── AdminRoute.jsx
    │   ├── ProductCard.jsx
    │   ├── SkeletonCard.jsx
    │   ├── CartItem.jsx
    │   └── OrderCard.jsx
    ├── pages/
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── Home.jsx
    │   ├── ProductDetail.jsx
    │   ├── Cart.jsx
    │   ├── Orders.jsx
    │   ├── Profile.jsx
    │   └── admin/
    │       ├── AdminProducts.jsx
    │       └── AdminCategories.jsx
    └── utils/
        └── jwtUtils.js        ← decode JWT to extract role
```

---

## KEY IMPLEMENTATION NOTES

1. **Getting user role:** After login, call `GET /user/me` to get `{ name, email, role }` and store in Zustand authStore.

2. **Cart display:** Cart API returns only `product_id` + `quantity`. Fetch all products once with React Query, then match cart items to products by ID to get name and price.

3. **React Query:** Use for all GET requests. After any mutation (create/update/delete), call `queryClient.invalidateQueries(...)` to refetch fresh data.

4. **Toast notifications:** Show success toast on add-to-cart, order placed, profile updated. Show error toast with `response.data.message` on API failures.

5. **Order status machine:** PENDING → CONFIRMED → SHIPPED → DELIVERED → CANCELLED. Only PENDING orders can be cancelled.

6. **Admin guard:** If non-admin visits `/admin/*`, show "Access Denied" page, not a redirect.

7. **stock/price update endpoints use query params**, not JSON body:
   - `PATCH /products/{id}/stock?new_quantity=10`
   - `PATCH /products/{id}/price?new_price=99.99`

---

Build the complete project with all files. It should run with `npm install && npm run dev`.
