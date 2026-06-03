# SmartKhata AI Backend

Node.js, Express, MongoDB, and JWT backend foundation for SmartKhata AI.

## Setup

```bash
cd smartkhata-ai-backend
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell:

```powershell
cd smartkhata-ai-backend
npm install
Copy-Item .env.example .env
npm run dev
```

## Environment Variables

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

## Health Check

`GET /api/health`

Response:

```json
{
  "success": true,
  "message": "SmartKhata AI backend is running"
}
```

## API Endpoints

### Auth

`POST /api/auth/register`

```json
{
  "fullName": "Mohammed",
  "businessName": "Smart Store",
  "email": "test@example.com",
  "password": "12345678"
}
```

`POST /api/auth/login`

```json
{
  "email": "test@example.com",
  "password": "12345678"
}
```

`GET /api/auth/me`

Protected. Header:

```http
Authorization: Bearer YOUR_TOKEN
```

### Dashboard

`GET /api/dashboard`

Protected. Returns placeholder dashboard metrics.

### Transactions

`GET /api/transactions`

Protected. Returns an empty transaction array for now.

`POST /api/transactions`

Protected. Creates a parsed placeholder transaction.

```json
{
  "description": "Sold 2 chargers for ₹500 each",
  "paymentMode": "cash"
}
```

### Inventory

`GET /api/inventory`

Protected. Returns an empty inventory array for now.

### Reports

`GET /api/reports`

Protected. Returns mock report data.

### Assistant

`POST /api/assistant/chat`

Protected. Returns a mock assistant response.

```json
{
  "message": "How much profit did I make?"
}
```

## Notes

- CORS is enabled for `http://localhost:4200`.
- JWT auth uses the `Authorization: Bearer TOKEN` header format.
- Passwords are hashed with `bcryptjs`.
- MongoDB is connected through Mongoose in `src/config/db.js`.
