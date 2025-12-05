# 🚀 Quick Setup Guide

Follow these steps to get your Family Tree application running:

## Step 1: Import Database

Open your terminal and run:

```bash
mysql -u root -p%TGBbgt5 < database/schema.sql
```

Or use MySQL Workbench/phpMyAdmin:
1. Open MySQL Workbench
2. Connect to your MySQL server (localhost:3306)
3. File → Run SQL Script
4. Select `database/schema.sql`
5. Click "Run"

## Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

## Step 3: Start Backend Server

```bash
npm run dev
```

You should see:
```
✅ Database connected successfully
🚀 Server running on port 5000
📍 API URL: http://localhost:5000
```

## Step 4: Start Frontend Server

Open a new terminal window:

```bash
cd frontend
python3 -m http.server 3000
```

Or if you have Node.js http-server:
```bash
npx http-server -p 3000
```

## Step 5: Open in Browser

Open your browser and go to:
```
http://localhost:3000
```

## Step 6: Login with Demo Account

Use these credentials to test:
- **Username:** demo_user
- **Password:** password123

Or create a new account by clicking "Register here"

---

## ✅ Verification Checklist

- [ ] MySQL is running
- [ ] Database `family_tree_project` exists
- [ ] Backend server is running on port 5000
- [ ] Frontend server is running on port 3000
- [ ] You can access http://localhost:3000
- [ ] You can login with demo credentials

---

## 🐛 Common Issues

### "Database connection failed"
- Check if MySQL is running: `sudo systemctl status mysql`
- Verify password in `backend/.env` matches your MySQL root password

### "Port 5000 already in use"
- Change PORT in `backend/.env` to another port (e.g., 5001)
- Update API_BASE_URL in `frontend/js/api.js` to match

### "CORS error"
- Make sure backend server is running
- Check CORS_ORIGIN in `backend/.env` matches your frontend URL

---

## 🎉 You're Ready!

Once everything is running, you can:
1. Create new family trees
2. Add family members
3. Define relationships
4. Track marriages
5. View your family tree

Enjoy building your family tree! 🌳
