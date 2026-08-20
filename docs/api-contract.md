# API Contract

Base URL in production: `https://your-app.duckdns.org/api`
Base URL in development: `http://localhost:3000/api`

All authenticated endpoints require `Authorization: Bearer <token>`.

## Response envelope

Every response uses one of these two shapes.

```json
{ "success": true,  "data": { }, "message": "..." }
```

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

## Auth

| Method | Path | Auth | Roles | Notes |
|---|---|---|---|---|
| POST | `/auth/register` | none | — | Always creates a `viewer` account |
| POST | `/auth/login` | none | — | Rate limited: 5 attempts / 15 min / IP |
| GET | `/auth/me` | required | any | Returns the current user |
| POST | `/auth/users` | required | admin | Creates an account with an explicit role (`admin`/`staff`/`viewer`) — the only path to a non-viewer account besides seeding |

## Products

| Method | Path | Auth | Roles | Notes |
|---|---|---|---|---|
| GET | `/products?search=&category=&page=&limit=` | required | any | Paginated, joins category/supplier names, returns pre-signed image URLs |
| GET | `/products/:id` | required | any | |
| POST | `/products` | required | admin, staff | `multipart/form-data`, optional `image` field |
| PUT | `/products/:id` | required | admin, staff | `multipart/form-data`, replaces image if a new one is sent |
| DELETE | `/products/:id` | required | admin | Also deletes the S3 object |

## Categories

| Method | Path | Auth | Roles |
|---|---|---|---|
| GET | `/categories` | required | any |
| GET | `/categories/:id` | required | any |
| POST | `/categories` | required | admin |
| PUT | `/categories/:id` | required | admin |
| DELETE | `/categories/:id` | required | admin |

## Suppliers

| Method | Path | Auth | Roles |
|---|---|---|---|
| GET | `/suppliers` | required | any |
| GET | `/suppliers/:id` | required | any |
| POST | `/suppliers` | required | admin, staff |
| PUT | `/suppliers/:id` | required | admin, staff |
| DELETE | `/suppliers/:id` | required | admin |

## Stock

| Method | Path | Auth | Roles | Notes |
|---|---|---|---|---|
| POST | `/stock/in` | required | admin, staff | `{ productId, quantity, reference?, note? }` |
| POST | `/stock/out` | required | admin, staff | Rejects if it would take quantity below 0 (`INSUFFICIENT_STOCK`) |
| GET | `/stock/movements?from=&to=&productId=&page=&limit=` | required | any | |

## Reports

| Method | Path | Auth | Roles | Returns |
|---|---|---|---|---|
| GET | `/reports/summary` | required | any | `{ totalProducts, totalStockValue, lowStockCount, movementsToday }` |
| GET | `/reports/low-stock` | required | any | Products where `quantity <= reorder_level` |
| GET | `/reports/inventory` | required | any | Full inventory valuation, one row per product |

## Error codes

| Code | HTTP status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body/query failed express-validator checks |
| `INSUFFICIENT_STOCK` | 400 | A stock-out would take quantity below 0 |
| `UNAUTHENTICATED` | 401 | Missing/invalid/expired JWT |
| `INVALID_CREDENTIALS` | 401 | Login failed (deliberately generic — no email enumeration) |
| `FORBIDDEN` | 403 | Authenticated but role not permitted |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Duplicate SKU / category name / email |
| `RATE_LIMITED` | 429 | Too many auth attempts |
| `INTERNAL_ERROR` | 500 | Unexpected server error (no stack trace ever returned) |
