# 📄 Invoice Generator

A full-stack invoice management web app inspired by [Refrens](https://refrens.com).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, React Router v6, Axios |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| PDF | @react-pdf/renderer |

## Project Structure

```
InvoiceGenerator/
├── client/    # React + Vite frontend
├── server/    # Express + Node backend
└── package.json
```

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd InvoiceGenerator
```

### 2. Configure Environment Variables

**Backend:**
```bash
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and JWT secret
```

**Frontend:**
```bash
cp client/.env.example client/.env
```

### 3. Install Dependencies

```bash
npm run install-all
```

### 4. Run the App

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user |
| GET/POST | /api/invoices | List / Create invoices |
| GET/PUT/DELETE | /api/invoices/:id | Get / Update / Delete invoice |
| GET/POST | /api/clients | List / Create clients |
| GET/PUT/DELETE | /api/clients/:id | Get / Update / Delete client |
| GET/POST | /api/products | List / Create products |
| GET/PUT/DELETE | /api/products/:id | Get / Update / Delete product |
