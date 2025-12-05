# 🌳 Family Tree Application

A full-stack web application for creating and managing family trees with MySQL database, Node.js/Express backend, and Vanilla JavaScript frontend.

## 📋 Features

- **User Authentication** - Secure registration and login with JWT
- **Multiple Family Trees** - Create and manage multiple family trees
- **Person Management** - Add, edit, and delete family members
- **Relationships** - Define parent-child relationships (biological, adopted, step, foster)
- **Marriages** - Track marriage and partnership information
- **Modern UI** - Beautiful dark theme with glassmorphism effects
- **Responsive Design** - Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Database Setup

1. **Import the SQL schema:**

```bash
mysql -u root -p < database/schema.sql
```

Or manually:
- Open MySQL Workbench or phpMyAdmin
- Create a new database named `family_tree_project`
- Import the file `database/schema.sql`

The schema includes:
- All required tables
- Sample data for testing
- Useful views for queries

### Backend Setup

1. **Navigate to backend directory:**

```bash
cd backend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure environment variables:**

The `.env` file is already configured with your database credentials:
- Database: `family_tree_project`
- Host: `localhost:3306`
- Username: `root`
- Password: `%TGBbgt5`

4. **Start the server:**

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**

```bash
cd frontend
```

2. **Serve the frontend:**

You can use any static file server. Here are some options:

**Option 1: Using Python (if installed)**
```bash
# Python 3
python -m http.server 3000

# Python 2
python -m SimpleHTTPServer 3000
```

**Option 2: Using Node.js http-server**
```bash
# Install globally
npm install -g http-server

# Run server
http-server -p 3000
```

**Option 3: Using VS Code Live Server extension**
- Install "Live Server" extension in VS Code
- Right-click on `login.html` and select "Open with Live Server"

The frontend will be available at `http://localhost:3000`

## 📁 Project Structure

```
family_tree/
├── database/
│   └── schema.sql              # Database schema with sample data
├── backend/
│   ├── config/
│   │   └── database.js         # Database connection
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── treeController.js   # Family tree operations
│   │   ├── personController.js # Person management
│   │   ├── relationshipController.js
│   │   └── marriageController.js
│   ├── middleware/
│   │   └── auth.js             # JWT authentication
│   ├── routes/
│   │   ├── auth.js
│   │   ├── trees.js
│   │   ├── persons.js
│   │   ├── relationships.js
│   │   └── marriages.js
│   ├── .env                    # Environment variables
│   ├── server.js               # Main server file
│   └── package.json
├── frontend/
│   ├── css/
│   │   ├── main.css            # Main styles
│   │   └── tree-view.css       # Tree visualization styles
│   ├── js/
│   │   ├── api.js              # API helper functions
│   │   ├── auth.js             # Login functionality
│   │   ├── dashboard.js        # Dashboard logic
│   │   └── tree-view.js        # Tree view logic
│   ├── login.html              # Login page
│   ├── register.html           # Registration page
│   ├── dashboard.html          # User dashboard
│   └── tree-view.html          # Family tree view
└── DATABASE_DESIGN.md          # Detailed database documentation
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Family Trees
- `GET /api/trees` - Get all trees for user
- `POST /api/trees` - Create new tree
- `GET /api/trees/:id` - Get tree by ID
- `PUT /api/trees/:id` - Update tree
- `DELETE /api/trees/:id` - Delete tree

### Persons
- `GET /api/trees/:treeId/persons` - Get all persons in tree
- `POST /api/trees/:treeId/persons` - Add person to tree
- `GET /api/persons/:id` - Get person details
- `PUT /api/persons/:id` - Update person
- `DELETE /api/persons/:id` - Delete person

### Relationships
- `GET /api/trees/:treeId/relationships` - Get all relationships
- `POST /api/relationships` - Create relationship
- `DELETE /api/relationships/:id` - Delete relationship

### Marriages
- `GET /api/trees/:treeId/marriages` - Get all marriages
- `POST /api/marriages` - Create marriage
- `PUT /api/marriages/:id` - Update marriage
- `DELETE /api/marriages/:id` - Delete marriage

## 🧪 Testing the Application

### Default Test Account

The database comes with pre-configured test accounts:

**Account 1:**
- Username: `demo_user`
- Email: `demo@familytree.com`
- Password: `password123`

**Account 2:**
- Username: `john_smith`
- Email: `john@example.com`
- Password: `password123`

### Sample Data

The database includes a complete demo family tree with:
- 8 family members across 3 generations
- Parent-child relationships
- Marriage records
- Various life events

## 🎨 Design Features

- **Dark Theme** - Easy on the eyes with modern dark colors
- **Glassmorphism** - Frosted glass effect on cards and modals
- **Smooth Animations** - Transitions and hover effects
- **Gradient Accents** - Beautiful color gradients
- **Responsive Layout** - Mobile-friendly design
- **Modern Typography** - Inter font family

## 🔒 Security Features

- **Password Hashing** - bcrypt with salt rounds
- **JWT Authentication** - Secure token-based auth
- **Input Validation** - Server-side validation
- **SQL Injection Prevention** - Parameterized queries
- **CORS Protection** - Configured CORS policy

## 📊 Database Schema

The database includes 7 tables:

1. **users** - User accounts
2. **family_trees** - Family tree metadata
3. **persons** - Individual family members
4. **relationships** - Parent-child relationships
5. **marriages** - Marriage/partnership records
6. **photos** - Photo attachments (optional)
7. **events** - Family events (optional)

See `DATABASE_DESIGN.md` for detailed schema documentation.

## 🛠️ Development

### Backend Development

```bash
cd backend
npm run dev  # Starts server with nodemon for auto-reload
```

### Frontend Development

The frontend uses vanilla JavaScript, so just edit the files and refresh your browser.

### Database Changes

If you need to modify the database schema:
1. Edit `database/schema.sql`
2. Drop and recreate the database
3. Re-import the schema

## 📝 Future Enhancements

- [ ] Advanced tree visualization with D3.js or similar
- [ ] Photo upload functionality
- [ ] Export to GEDCOM format
- [ ] Share trees with other users
- [ ] Timeline view of events
- [ ] Search functionality
- [ ] Email notifications
- [ ] Print family tree
- [ ] Mobile app

## 🐛 Troubleshooting

### Database Connection Issues

If you get database connection errors:
1. Check MySQL is running: `sudo systemctl status mysql`
2. Verify credentials in `backend/.env`
3. Ensure database exists: `SHOW DATABASES;`

### CORS Issues

If you get CORS errors:
1. Check `CORS_ORIGIN` in `backend/.env`
2. Update it to match your frontend URL
3. Restart the backend server

### Port Already in Use

If port 5000 is already in use:
1. Change `PORT` in `backend/.env`
2. Update `API_BASE_URL` in `frontend/js/api.js`

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

Created for learning purposes - feel free to use and modify!

## 🙏 Acknowledgments

- Built with Node.js, Express, MySQL, and Vanilla JavaScript
- UI inspired by modern web design trends
- Sample data generated for demonstration purposes

---

**Happy Family Tree Building! 🌳**
