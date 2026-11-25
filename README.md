# 🏛️ JanSamadhan — CPGRAMS Portal
### Centralised Public Grievance Redressal and Monitoring System
**Built with MERN Stack | JWT Auth | Google OAuth | Email Notifications**

---

## 📋 Project Overview

JanSamadhan is a full-stack CPGRAMS (Centralised Public Grievance Redressal and Monitoring System) built with the MERN stack. It serves as India's digital platform for citizens to file, track, and resolve grievances with government departments, along with an online government delivery service module.

---

## 🔐 System Roles

| Role | Description | Access |
|------|-------------|--------|
| **Admin (Super User)** | Monitors everything, manages users, assigns officers, generates reports | Full system access |
| **Officer (Public Officer)** | Receives email assignments, resolves complaints in their department | Department-scoped |
| **User (Citizen)** | Files complaints, tracks status, requests government deliveries | Own data only |

---

## 🛠️ Tech Stack

- **Frontend**: React.js, React Router v6, Recharts, Framer Motion, React Hot Toast
- **Backend**: Node.js, Express.js, REST API
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (Access + Refresh tokens), Google OAuth 2.0, Apple Sign-in (UI)
- **Email**: Nodemailer (SMTP)
- **Security**: bcryptjs, helmet, express-rate-limit, CORS
- **File Uploads**: Multer + Cloudinary

---

## 📁 Project Structure

```
jansamadhan/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── complaint.controller.js
│   │   ├── delivery.controller.js
│   │   ├── department.controller.js
│   │   ├── notification.controller.js
│   │   ├── report.controller.js
│   │   ├── settings.controller.js
│   │   └── user.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Complaint.js
│   │   ├── Delivery.js
│   │   ├── Department.js
│   │   ├── Notification.js
│   │   └── Settings.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── complaint.routes.js
│   │   ├── delivery.routes.js
│   │   ├── department.routes.js
│   │   ├── notification.routes.js
│   │   ├── report.routes.js
│   │   ├── settings.routes.js
│   │   └── user.routes.js
│   ├── utils/
│   │   └── email.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/layout/
    │   │   └── SharedLayout.js      # Sidebar + Navbar
    │   ├── context/
    │   │   └── AuthContext.js       # Auth state management
    │   ├── pages/
    │   │   ├── admin/               # Admin pages
    │   │   ├── officer/             # Officer pages  
    │   │   ├── user/                # User/Citizen pages
    │   │   ├── LoginPage.js         # JioHotstar-style login
    │   │   ├── RegisterPage.js
    │   │   ├── LandingPage.js
    │   │   └── ...
    │   ├── utils/
    │   │   └── api.js              # Axios with JWT interceptors
    │   ├── App.js                   # Routes + Protected routes
    │   └── index.css               # Dark theme styles
    └── package.json
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Gmail account (for emails)
- Google Cloud Console project (for OAuth)

### Step 1: Clone and Setup Backend

```bash
cd jansamadhan/backend
npm install
cp .env.example .env
```

**Edit `.env` with your credentials:**
```env
MONGO_URI=mongodb://localhost:27017/jansamadhan
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret

# Gmail SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_gmail_app_password

# Google OAuth (from console.cloud.google.com)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

CLIENT_URL=http://localhost:3000
```

### Step 2: Setup Frontend

```bash
cd jansamadhan/frontend
npm install
```

Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### Step 3: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Visit: **http://localhost:3000**

---

## 🔑 Initial Setup (After First Launch)

1. **Register as first user** → Manually update role to 'admin' in MongoDB:
   ```javascript
   db.users.updateOne({email: "your@email.com"}, {$set: {role: "admin"}})
   ```

2. **Seed departments** → Login as admin → Go to Departments → Click "Seed Defaults"

3. **Initialize settings** → Settings page → Click "Reset to Defaults"

4. **Create officers** → Admin → Users → Edit any user → Change role to "Officer" + assign department

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/google` | Google OAuth login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/forgot-password` | Send reset email |
| PUT | `/api/auth/reset-password/:token` | Reset password |
| PUT | `/api/auth/change-password` | Change password |
| POST | `/api/auth/refresh-token` | Refresh JWT |

### Complaints
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/complaints` | User | File new complaint |
| GET | `/api/complaints` | All | Get complaints (role-filtered) |
| GET | `/api/complaints/stats` | All | Complaint statistics |
| GET | `/api/complaints/track/:number` | Public | Track by complaint number |
| GET | `/api/complaints/:id` | All | Get complaint detail |
| PUT | `/api/complaints/:id/status` | Officer/Admin | Update status |
| PUT | `/api/complaints/:id/assign` | Admin | Assign to officer |
| PUT | `/api/complaints/:id/escalate` | Admin | Escalate complaint |
| POST | `/api/complaints/:id/feedback` | User | Submit feedback |
| POST | `/api/complaints/:id/comment` | Officer/Admin | Add comment |
| DELETE | `/api/complaints/:id` | Admin | Delete complaint |

### Delivery
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/delivery` | User | Create delivery request |
| GET | `/api/delivery` | All | Get deliveries |
| GET | `/api/delivery/track/:orderNumber` | Public | Track delivery |
| PUT | `/api/delivery/:id/status` | Officer/Admin | Update delivery status |
| POST | `/api/delivery/:id/rate` | User | Rate delivery |

### Users (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | All users with pagination |
| PUT | `/api/users/profile` | Update own profile |
| PUT | `/api/users/:id` | Update user (Admin) |
| DELETE | `/api/users/:id` | Delete user (Admin) |
| GET | `/api/users/stats` | User statistics |

### Reports (Admin)
| GET | `/api/reports/summary` | Overall summary |
| GET | `/api/reports/departments` | Dept-wise report |
| GET | `/api/reports/officers` | Officer performance |

---

## 🎨 Key Features

### Login Page (JioHotstar-Inspired)
- Dark gradient background with animated orbs
- Google OAuth button (functional)
- Apple Sign-in button (UI ready)
- Email/Password authentication
- Demo credentials for testing
- Password visibility toggle
- Form validation

### Admin Dashboard
- Real-time statistics with Recharts
- Area charts, Pie charts, Bar charts
- Complaint trend analysis
- Department-wise breakdown
- Officer performance metrics
- One-click complaint assignment
- Status management

### Complaint System
- Multi-step complaint filing wizard
- Auto-generated complaint number (JS/YEAR/MONTH/XXXXXX)
- Timeline tracking with all actions
- Priority levels (Low/Medium/High/Urgent)
- Email notifications on every status change
- Anonymous complaint option
- Feedback after resolution

### Delivery System (Online Government Services)
- 9 service types: Documents, Certificates, Ration, Medicines, Seeds/Fertilizers, Pension, Scholarship, Equipment, Other
- Door-to-door delivery tracking
- Multi-step status tracking pipeline
- Agent assignment
- Delivery rating system

### Email Notifications (Automated)
- Complaint registration confirmation
- Status update notifications
- Officer assignment emails
- Password reset emails
- Welcome emails with verification

---

## 🔒 Security Features

- JWT access tokens (7 days) + refresh tokens (30 days)
- bcryptjs password hashing (12 salt rounds)
- Role-based access control middleware
- Rate limiting (100 req/15min global, 10 req/15min auth)
- Helmet.js security headers
- CORS configuration
- Request sanitization

---

## 🌐 Complaint Status Flow

```
Filed → Assigned → In Progress → Resolved → Closed (after feedback)
                                           → Reopened (if dissatisfied)
              ↓
           Rejected (with reason)
```

---

## 📊 Delivery Status Flow

```
Requested → Processing → Approved → Dispatched → Out for Delivery → Delivered
     ↓                                                                    ↓
 Cancelled                                                             Failed
```

---

## 🧪 Demo Credentials

After setup, seed these users manually:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@jansamadhan.gov.in | Admin@123 |
| Officer | officer@jansamadhan.gov.in | Officer@123 |
| Citizen | citizen@example.com | User@123 |

---

## 📦 Deployment

### Backend (Railway/Render/AWS)
1. Set all environment variables
2. `npm start`

### Frontend (Netlify/Vercel)
1. Set `REACT_APP_API_URL` to production backend URL
2. `npm run build`
3. Deploy `/build` folder

---

## 📄 License
This project is created for the PEP Class project. All rights reserved.

---

**Made with ❤️ for Digital India 🇮🇳**
