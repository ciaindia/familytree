-- ============================================
-- Family Tree Project - Database Schema
-- ============================================
-- Database: family_tree_project
-- Created: 2025-12-04
-- ============================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS family_tree_project 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE family_tree_project;

-- Drop tables if they exist (for clean import)
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS photos;
DROP TABLE IF EXISTS marriages;
DROP TABLE IF EXISTS relationships;
DROP TABLE IF EXISTS persons;
DROP TABLE IF EXISTS family_trees;
DROP TABLE IF EXISTS users;

-- ============================================
-- Table: users
-- Stores user account information
-- ============================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: family_trees
-- Stores family tree metadata
-- ============================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: persons
-- Stores individual family members
-- ============================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: relationships
-- Stores parent-child relationships
-- ============================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: marriages
-- Stores marriage/partnership information
-- ============================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: photos
-- Stores additional photos and documents
-- ============================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: events
-- Stores family events and milestones
-- ============================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insert Sample Data
-- ============================================

-- Sample user (password: 'password123' - hashed with bcrypt)
INSERT INTO users (username, email, password_hash, full_name) VALUES
('demo_user', 'demo@familytree.com', '$2a$10$rXKZ9qZ9qZ9qZ9qZ9qZ9qOqZ9qZ9qZ9qZ9qZ9qZ9qZ9qZ9qZ9qZ9q', 'Demo User'),
('john_smith', 'john@example.com', '$2a$10$rXKZ9qZ9qZ9qZ9qZ9qZ9qOqZ9qZ9qZ9qZ9qZ9qZ9qZ9qZ9qZ9qZ9q', 'John Smith');

-- Sample family trees
INSERT INTO family_trees (user_id, tree_name, description, is_public) VALUES
(1, 'Demo Family Tree', 'A sample family tree for demonstration', TRUE),
(2, 'Smith Family', 'The Smith family lineage', FALSE);

-- Sample persons for Demo Family Tree
INSERT INTO persons (tree_id, first_name, middle_name, last_name, gender, date_of_birth, date_of_death, is_alive, birth_place, occupation, bio) VALUES
-- Generation 1 (Grandparents)
(1, 'Robert', 'James', 'Johnson', 'Male', '1940-03-15', '2015-08-20', FALSE, 'New York, USA', 'Engineer', 'Patriarch of the Johnson family'),
(1, 'Mary', 'Elizabeth', 'Johnson', 'Female', '1942-07-22', NULL, TRUE, 'Boston, USA', 'Teacher', 'Matriarch of the Johnson family'),

-- Generation 2 (Parents)
(1, 'Michael', 'Robert', 'Johnson', 'Male', '1965-05-10', NULL, TRUE, 'Chicago, USA', 'Doctor', 'Son of Robert and Mary'),
(1, 'Sarah', 'Ann', 'Johnson', 'Female', '1967-11-30', NULL, TRUE, 'Los Angeles, USA', 'Lawyer', 'Married to Michael'),
(1, 'Jennifer', 'Marie', 'Williams', 'Female', '1968-09-15', NULL, TRUE, 'Seattle, USA', 'Nurse', 'Daughter of Robert and Mary'),

-- Generation 3 (Children)
(1, 'David', 'Michael', 'Johnson', 'Male', '1990-02-14', NULL, TRUE, 'San Francisco, USA', 'Software Engineer', 'Son of Michael and Sarah'),
(1, 'Emily', 'Grace', 'Johnson', 'Female', '1992-06-25', NULL, TRUE, 'San Francisco, USA', 'Designer', 'Daughter of Michael and Sarah'),
(1, 'James', 'Robert', 'Williams', 'Male', '1995-12-08', NULL, TRUE, 'Portland, USA', 'Student', 'Son of Jennifer');

-- Sample relationships (parent-child)
INSERT INTO relationships (tree_id, parent_id, child_id, relationship_type) VALUES
-- Robert and Mary's children
(1, 1, 3, 'Biological'),  -- Robert -> Michael
(1, 2, 3, 'Biological'),  -- Mary -> Michael
(1, 1, 5, 'Biological'),  -- Robert -> Jennifer
(1, 2, 5, 'Biological'),  -- Mary -> Jennifer

-- Michael and Sarah's children
(1, 3, 6, 'Biological'),  -- Michael -> David
(1, 4, 6, 'Biological'),  -- Sarah -> David
(1, 3, 7, 'Biological'),  -- Michael -> Emily
(1, 4, 7, 'Biological'),  -- Sarah -> Emily

-- Jennifer's children
(1, 5, 8, 'Biological');  -- Jennifer -> James

-- Sample marriages
INSERT INTO marriages (tree_id, spouse1_id, spouse2_id, marriage_date, marriage_place, is_current, marriage_type) VALUES
(1, 1, 2, '1963-06-15', 'New York, USA', FALSE, 'Marriage'),  -- Robert & Mary (Robert deceased)
(1, 3, 4, '1988-08-20', 'Chicago, USA', TRUE, 'Marriage');    -- Michael & Sarah

-- Sample events
INSERT INTO events (tree_id, person_id, event_type, event_date, event_place, description) VALUES
(1, 1, 'Military Service', '1960-01-01', 'US Army', 'Served in the US Army'),
(1, 6, 'Graduation', '2012-05-15', 'Stanford University', 'Graduated with Computer Science degree'),
(1, 7, 'Graduation', '2014-06-10', 'Rhode Island School of Design', 'Graduated with Design degree');

-- ============================================
-- Useful Views (Optional)
-- ============================================

-- View: Full person details with tree information
CREATE OR REPLACE VIEW v_person_details AS
SELECT 
    p.*,
    ft.tree_name,
    ft.user_id,
    u.username,
    CONCAT(p.first_name, ' ', IFNULL(p.middle_name, ''), ' ', IFNULL(p.last_name, '')) AS full_name,
    TIMESTAMPDIFF(YEAR, p.date_of_birth, IFNULL(p.date_of_death, CURDATE())) AS age
FROM persons p
JOIN family_trees ft ON p.tree_id = ft.tree_id
JOIN users u ON ft.user_id = u.user_id;

-- View: Family relationships with names
CREATE OR REPLACE VIEW v_relationships AS
SELECT 
    r.relationship_id,
    r.tree_id,
    r.relationship_type,
    r.parent_id,
    CONCAT(p1.first_name, ' ', IFNULL(p1.last_name, '')) AS parent_name,
    r.child_id,
    CONCAT(p2.first_name, ' ', IFNULL(p2.last_name, '')) AS child_name
FROM relationships r
JOIN persons p1 ON r.parent_id = p1.person_id
JOIN persons p2 ON r.child_id = p2.person_id;

-- View: Marriage details with spouse names
CREATE OR REPLACE VIEW v_marriages AS
SELECT 
    m.marriage_id,
    m.tree_id,
    m.marriage_date,
    m.marriage_place,
    m.divorce_date,
    m.is_current,
    m.marriage_type,
    m.spouse1_id,
    CONCAT(p1.first_name, ' ', IFNULL(p1.last_name, '')) AS spouse1_name,
    m.spouse2_id,
    CONCAT(p2.first_name, ' ', IFNULL(p2.last_name, '')) AS spouse2_name
FROM marriages m
JOIN persons p1 ON m.spouse1_id = p1.person_id
JOIN persons p2 ON m.spouse2_id = p2.person_id;

-- ============================================
-- Success Message
-- ============================================
SELECT 'Database schema created successfully!' AS Status;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_trees FROM family_trees;
SELECT COUNT(*) AS total_persons FROM persons;
SELECT COUNT(*) AS total_relationships FROM relationships;
SELECT COUNT(*) AS total_marriages FROM marriages;
