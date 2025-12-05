# Family Tree Project - Database Design & Architecture Guide

## Project Overview
A multi-user family tree application where users can create and manage their own family trees with a MySQL database, Node.js/Express backend, and Vanilla JavaScript frontend.

---

## Database Schema

### 1. **users** Table
Stores user account information.

```sql
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_username (username)
);
```

**Columns:**
- `user_id`: Unique identifier for each user
- `username`: Unique username for login
- `email`: User's email address
- `password_hash`: Hashed password (use bcrypt)
- `full_name`: User's full name
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp
- `last_login`: Last login timestamp
- `is_active`: Account status flag

---

### 2. **family_trees** Table
Stores family tree metadata (each user can have multiple trees).

```sql
CREATE TABLE family_trees (
    tree_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    tree_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);
```

**Columns:**
- `tree_id`: Unique identifier for each family tree
- `user_id`: Owner of the family tree
- `tree_name`: Name of the family tree (e.g., "Smith Family")
- `description`: Optional description
- `is_public`: Whether the tree is publicly viewable
- `created_at`: Tree creation timestamp
- `updated_at`: Last update timestamp

---

### 3. **persons** Table
Stores individual family members.

```sql
CREATE TABLE persons (
    person_id INT PRIMARY KEY AUTO_INCREMENT,
    tree_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    last_name VARCHAR(50),
    maiden_name VARCHAR(50),
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    date_of_birth DATE,
    date_of_death DATE,
    is_alive BOOLEAN DEFAULT TRUE,
    birth_place VARCHAR(200),
    death_place VARCHAR(200),
    occupation VARCHAR(100),
    bio TEXT,
    profile_photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tree_id) REFERENCES family_trees(tree_id) ON DELETE CASCADE,
    INDEX idx_tree_id (tree_id),
    INDEX idx_full_name (first_name, last_name)
);
```

**Columns:**
- `person_id`: Unique identifier for each person
- `tree_id`: Which family tree this person belongs to
- `first_name`, `middle_name`, `last_name`: Name components
- `maiden_name`: Maiden name (for married individuals)
- `gender`: Gender of the person
- `date_of_birth`, `date_of_death`: Life dates
- `is_alive`: Living status
- `birth_place`, `death_place`: Location information
- `occupation`: Professional information
- `bio`: Biography/notes
- `profile_photo`: Path to photo file

---

### 4. **relationships** Table
Stores parent-child relationships.

```sql
CREATE TABLE relationships (
    relationship_id INT PRIMARY KEY AUTO_INCREMENT,
    tree_id INT NOT NULL,
    parent_id INT NOT NULL,
    child_id INT NOT NULL,
    relationship_type ENUM('Biological', 'Adopted', 'Step', 'Foster') DEFAULT 'Biological',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tree_id) REFERENCES family_trees(tree_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES persons(person_id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES persons(person_id) ON DELETE CASCADE,
    UNIQUE KEY unique_parent_child (parent_id, child_id),
    INDEX idx_tree_id (tree_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_child_id (child_id),
    CHECK (parent_id != child_id)
);
```

**Columns:**
- `relationship_id`: Unique identifier
- `tree_id`: Which family tree this relationship belongs to
- `parent_id`: Parent person ID
- `child_id`: Child person ID
- `relationship_type`: Type of parent-child relationship
- Constraint: Prevents self-relationships

---

### 5. **marriages** Table
Stores marriage/partnership information.

```sql
CREATE TABLE marriages (
    marriage_id INT PRIMARY KEY AUTO_INCREMENT,
    tree_id INT NOT NULL,
    spouse1_id INT NOT NULL,
    spouse2_id INT NOT NULL,
    marriage_date DATE,
    marriage_place VARCHAR(200),
    divorce_date DATE,
    is_current BOOLEAN DEFAULT TRUE,
    marriage_type ENUM('Marriage', 'Partnership', 'Common-law') DEFAULT 'Marriage',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tree_id) REFERENCES family_trees(tree_id) ON DELETE CASCADE,
    FOREIGN KEY (spouse1_id) REFERENCES persons(person_id) ON DELETE CASCADE,
    FOREIGN KEY (spouse2_id) REFERENCES persons(person_id) ON DELETE CASCADE,
    INDEX idx_tree_id (tree_id),
    INDEX idx_spouse1 (spouse1_id),
    INDEX idx_spouse2 (spouse2_id),
    CHECK (spouse1_id != spouse2_id)
);
```

**Columns:**
- `marriage_id`: Unique identifier
- `tree_id`: Which family tree this marriage belongs to
- `spouse1_id`, `spouse2_id`: The two partners
- `marriage_date`, `marriage_place`: Marriage details
- `divorce_date`: Divorce date if applicable
- `is_current`: Whether marriage is ongoing
- `marriage_type`: Type of union

---

### 6. **photos** Table (Optional Enhancement)
Stores additional photos and documents.

```sql
CREATE TABLE photos (
    photo_id INT PRIMARY KEY AUTO_INCREMENT,
    tree_id INT NOT NULL,
    person_id INT,
    file_path VARCHAR(255) NOT NULL,
    caption TEXT,
    photo_date DATE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tree_id) REFERENCES family_trees(tree_id) ON DELETE CASCADE,
    FOREIGN KEY (person_id) REFERENCES persons(person_id) ON DELETE SET NULL,
    INDEX idx_tree_id (tree_id),
    INDEX idx_person_id (person_id)
);
```

---

### 7. **events** Table (Optional Enhancement)
Stores family events and milestones.

```sql
CREATE TABLE events (
    event_id INT PRIMARY KEY AUTO_INCREMENT,
    tree_id INT NOT NULL,
    person_id INT,
    event_type VARCHAR(50) NOT NULL,
    event_date DATE,
    event_place VARCHAR(200),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tree_id) REFERENCES family_trees(tree_id) ON DELETE CASCADE,
    FOREIGN KEY (person_id) REFERENCES persons(person_id) ON DELETE CASCADE,
    INDEX idx_tree_id (tree_id),
    INDEX idx_person_id (person_id)
);
```

---

## Backend Architecture (Node.js + Express)

### Project Structure
```
family-tree-backend/
├── config/
│   └── database.js          # MySQL connection configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── userController.js    # User management
│   ├── treeController.js    # Family tree operations
│   ├── personController.js  # Person CRUD operations
│   ├── relationshipController.js
│   └── marriageController.js
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   └── validation.js        # Input validation
├── models/
│   ├── User.js
│   ├── FamilyTree.js
│   ├── Person.js
│   ├── Relationship.js
│   └── Marriage.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── trees.js
│   ├── persons.js
│   ├── relationships.js
│   └── marriages.js
├── utils/
│   ├── helpers.js
│   └── validators.js
├── .env                     # Environment variables
├── server.js               # Main server file
└── package.json
```

### Key Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "express-validator": "^7.0.1",
    "multer": "^1.4.5-lts.1"
  }
}
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Family Trees
- `GET /api/trees` - Get all trees for logged-in user
- `POST /api/trees` - Create new family tree
- `GET /api/trees/:id` - Get specific tree
- `PUT /api/trees/:id` - Update tree
- `DELETE /api/trees/:id` - Delete tree

### Persons
- `GET /api/trees/:treeId/persons` - Get all persons in a tree
- `POST /api/trees/:treeId/persons` - Add new person
- `GET /api/persons/:id` - Get specific person
- `PUT /api/persons/:id` - Update person
- `DELETE /api/persons/:id` - Delete person

### Relationships
- `GET /api/trees/:treeId/relationships` - Get all relationships
- `POST /api/relationships` - Create parent-child relationship
- `DELETE /api/relationships/:id` - Delete relationship

### Marriages
- `GET /api/trees/:treeId/marriages` - Get all marriages
- `POST /api/marriages` - Create marriage
- `PUT /api/marriages/:id` - Update marriage
- `DELETE /api/marriages/:id` - Delete marriage

---

## Frontend Architecture (Vanilla JavaScript)

### Project Structure
```
family-tree-frontend/
├── css/
│   ├── main.css
│   ├── tree-view.css
│   └── forms.css
├── js/
│   ├── api.js              # API communication
│   ├── auth.js             # Authentication handling
│   ├── tree-renderer.js    # Tree visualization
│   ├── person-manager.js   # Person CRUD
│   ├── relationship-manager.js
│   └── main.js             # App initialization
├── pages/
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── tree-view.html
│   └── person-details.html
├── assets/
│   └── images/
└── index.html
```

### Key Features to Implement
1. **User Authentication** - Login/Register forms
2. **Dashboard** - List of user's family trees
3. **Tree Visualization** - Interactive family tree display
4. **Person Management** - Add/Edit/Delete family members
5. **Relationship Management** - Connect family members
6. **Search & Filter** - Find specific family members

---

## Visualization Libraries (Recommended)

For rendering the family tree in the frontend:

1. **D3.js** - Powerful but complex
2. **vis.js** - Network visualization
3. **GoJS** - Commercial (has free tier)
4. **Cytoscape.js** - Graph visualization
5. **FamilyTree.js** - Specialized for family trees

---

## Security Considerations

1. **Password Hashing** - Use bcrypt with salt rounds ≥ 10
2. **JWT Tokens** - Store in httpOnly cookies or localStorage
3. **Input Validation** - Validate all user inputs
4. **SQL Injection Prevention** - Use parameterized queries
5. **CORS Configuration** - Restrict to your frontend domain
6. **Rate Limiting** - Prevent brute force attacks
7. **File Upload Security** - Validate file types and sizes

---

## Sample Database Initialization Script

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS family_tree_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE family_tree_db;

-- Run all CREATE TABLE statements from above
-- Then insert sample data for testing

-- Sample user
INSERT INTO users (username, email, password_hash, full_name) 
VALUES ('john_doe', 'john@example.com', '$2a$10$...', 'John Doe');

-- Sample family tree
INSERT INTO family_trees (user_id, tree_name, description) 
VALUES (1, 'Doe Family', 'Our family history');
```

---

## Next Steps

1. **Set up MySQL database** - Create tables using the schema above
2. **Initialize Node.js project** - Install dependencies
3. **Create database connection** - Configure MySQL connection
4. **Build API endpoints** - Start with authentication
5. **Create frontend pages** - Begin with login/register
6. **Implement tree visualization** - Choose and integrate a library
7. **Test thoroughly** - Test all CRUD operations
8. **Deploy** - Choose hosting platform

---

## Additional Features to Consider

- **Export/Import** - GEDCOM format support
- **Sharing** - Share trees with other users
- **Privacy Controls** - Control who can view what
- **Timeline View** - Chronological family events
- **Statistics** - Family demographics and insights
- **Mobile Responsive** - Ensure mobile compatibility
- **Notifications** - Email notifications for updates
- **Search** - Advanced search across trees

---

## Performance Optimization Tips

1. **Indexing** - Add indexes on frequently queried columns
2. **Pagination** - Limit results for large families
3. **Caching** - Cache frequently accessed data
4. **Lazy Loading** - Load tree data progressively
5. **Image Optimization** - Compress and resize photos
6. **Connection Pooling** - Reuse database connections

---

## Useful SQL Queries

### Get all children of a person
```sql
SELECT p.* 
FROM persons p
JOIN relationships r ON p.person_id = r.child_id
WHERE r.parent_id = ? AND r.tree_id = ?;
```

### Get all parents of a person
```sql
SELECT p.* 
FROM persons p
JOIN relationships r ON p.person_id = r.parent_id
WHERE r.child_id = ? AND r.tree_id = ?;
```

### Get spouse(s) of a person
```sql
SELECT p.* 
FROM persons p
JOIN marriages m ON (p.person_id = m.spouse1_id OR p.person_id = m.spouse2_id)
WHERE (m.spouse1_id = ? OR m.spouse2_id = ?) 
  AND p.person_id != ? 
  AND m.tree_id = ?;
```

### Get all descendants (recursive)
```sql
WITH RECURSIVE descendants AS (
    SELECT person_id, first_name, last_name, 1 as generation
    FROM persons
    WHERE person_id = ?
    
    UNION ALL
    
    SELECT p.person_id, p.first_name, p.last_name, d.generation + 1
    FROM persons p
    JOIN relationships r ON p.person_id = r.child_id
    JOIN descendants d ON r.parent_id = d.person_id
)
SELECT * FROM descendants;
```

---

This guide provides a solid foundation for building your family tree application. Start with the core features and gradually add enhancements!
