# SMS Container Server - Improved Version

## Overview
A professional SMS Container Server with email/password authentication, improved validation, and clean web interface.

**NO DOCKER NEEDED** - Simple setup with Node.js + MongoDB

---

## 🎯 Key Features

- ✅ Email & Password Authentication (stored in .env)
- ✅ Clean two-page web interface (login + dashboard)
- ✅ Improved API validation and error handling
- ✅ Professional, minimal design
- ✅ Fully responsive
- ✅ Single admin user (no database auth needed)

---

## 📁 Project Structure

```
sms-container-server/
├── server/
│   ├── index.js           # Main server
│   ├── routes.js          # API routes
│   ├── db.js              # MongoDB connection
│   └── models/
│       └── Message.js     # Message schema
├── web/
│   ├── index.html         # Redirect
│   ├── login.html         # ← LOGIN PAGE HERE
│   ├── login.css          # Login styles
│   ├── login.js           # Login logic
│   ├── dashboard.html     # Dashboard
│   ├── dashboard.css      # Dashboard styles
│   └── dashboard.js       # Dashboard logic
├── .env.example           # Template
├── package.json           # Dependencies
└── README.md             # This file
```

**Login page location:** `web/login.html`

---

## 🚀 Quick Setup

### 1. Install Prerequisites

**Node.js** (v16+): https://nodejs.org/

**MongoDB:**
- Mac: `brew install mongodb-community`
- Ubuntu: `sudo apt install mongodb`
- Windows: https://www.mongodb.com/try/download/community

### 2. Start MongoDB

```bash
# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or manually
mongod --dbpath ~/data/db
```

### 3. Setup Project

```bash
cd sms-container-server
npm install
cp .env.example .env
```

### 4. Configure .env

Edit `.env`:
```env
MONGO_URI=mongodb://localhost:27017/sms_db
PORT=4000
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=YourPassword123
```

### 5. Start Server

```bash
npm start
```

### 6. Access

Open: `http://localhost:4000`

Login page: `http://localhost:4000/login.html`

---

## 🔐 Authentication

### How It Works

1. Open `http://localhost:4000`
2. Redirects to `login.html` (the login page)
3. Enter email & password from `.env`
4. Server checks credentials
5. Success → Dashboard
6. Fail → Error message

### Credentials Location

All credentials are in `.env` file:
```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecurePassword123
```

---

## 📡 API Endpoints

### POST /login
```json
Request:
{
  "email": "admin@example.com",
  "password": "SecurePassword123"
}

Success (200):
{
  "ok": true,
  "message": "Login successful",
  "user": { "email": "admin@example.com" }
}

Error (401):
{
  "ok": false,
  "error": "invalid_credentials",
  "message": "Invalid email or password"
}
```

### POST /upload-messages
```json
Request:
{
  "messages": [
    {
      "phone": "+1234567890",
      "name": "John Doe",
      "body": "Hello!",
      "direction": "received",
      "timestamp": "2025-01-30T12:00:00Z"
    }
  ]
}

Response (200):
{
  "ok": true,
  "message": "Messages uploaded successfully",
  "count": 1
}
```

### GET /threads
```json
Response:
[
  {
    "phone": "+1234567890",
    "name": "John Doe",
    "last": "2025-01-30T12:00:00Z",
    "lastBody": "Hello!"
  }
]
```

### GET /messages/:phone
```json
Response:
[
  {
    "phone": "+1234567890",
    "name": "John Doe",
    "body": "Hello!",
    "direction": "received",
    "timestamp": "2025-01-30T12:00:00Z"
  }
]
```

### GET /health
```json
Response:
{
  "ok": true,
  "status": "healthy",
  "timestamp": "2025-01-30T12:34:56.789Z"
}
```

---

## 🧪 Testing

### Test Login
```bash
curl -X POST http://localhost:4000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"SecurePassword123"}'
```

### Upload Message
```bash
curl -X POST http://localhost:4000/upload-messages \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "phone": "+1234567890",
      "name": "Test",
      "body": "Test message",
      "direction": "received",
      "timestamp": "2025-01-30T12:00:00Z"
    }]
  }'
```

### Get Threads
```bash
curl http://localhost:4000/threads
```

---

## 📱 Flutter Integration

```dart
Future<bool> login(String email, String password) async {
  final response = await http.post(
    Uri.parse('$baseUrl/login'),
    headers: {'Content-Type': 'application/json'},
    body: json.encode({
      'email': email,
      'password': password,
    }),
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return data['ok'] == true;
  }
  return false;
}
```

---

## 🚢 Deployment (Without Docker)

### Render / Railway / Heroku

1. Create account
2. Create web service
3. Connect GitHub
4. Set build: `npm install`
5. Set start: `npm start`
6. Add environment variables:
   - `MONGO_URI` (use MongoDB Atlas)
   - `PORT`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
7. Deploy

### MongoDB Atlas (Free)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Use as `MONGO_URI`

---

## 🐛 Troubleshooting

**Can't find login page?**
→ It's at `web/login.html`
→ Visit `http://localhost:4000/login.html`

**Can't login?**
→ Check `.env` file has correct credentials
→ Password is case-sensitive
→ Email is case-insensitive

**MongoDB error?**
→ Check MongoDB is running
→ Test with: `mongo` in terminal
→ Check `MONGO_URI` in `.env`

**Port in use?**
→ Change `PORT` in `.env` to 5000

---

## 📂 Where Are the Files?

**Login Page:**
- `web/login.html` ← Main login page
- `web/login.css` ← Styles
- `web/login.js` ← Logic

**Dashboard:**
- `web/dashboard.html`
- `web/dashboard.css`
- `web/dashboard.js`

**Server:**
- `server/routes.js` ← API with email/password auth
- `server/index.js` ← Main server
- `server/db.js` ← MongoDB

---

## 🎨 Web Interface

### Login Page
- Professional design
- Email & password fields
- Validation
- Error messages
- Gradient background

### Dashboard
- Header with user email
- Threads list
- Message conversations
- Refresh button
- Sign out
- Responsive

---

## 🔒 Security

**Current:**
✅ Environment variables  
✅ Email validation  
✅ Request validation  
✅ Session management  
✅ XSS protection  

**For Production:**
⚠️ Add HTTPS  
⚠️ Add bcrypt password hashing  
⚠️ Add rate limiting  

---

## 📝 Environment Variables

```env
# Required
MONGO_URI=mongodb://localhost:27017/sms_db
PORT=4000
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=YourPassword123
```

---

## ❓ Common Questions

**Q: Where is the login page?**  
A: `web/login.html`

**Q: Do I need Docker?**  
A: No! Just Node.js + MongoDB

**Q: How do I change the password?**  
A: Edit `.env` file, restart server

**Q: Can I add more users?**  
A: Currently single user only. Extend `routes.js` for multi-user

**Q: Is this production-ready?**  
A: Add bcrypt hashing first for production

---

**Version:** 2.0  
**No Docker Required**  
**Simple Node.js + MongoDB Setup**