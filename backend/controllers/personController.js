const { pool } = require('../config/database');

// Get all persons in a tree
const getAllPersons = async (req, res) => {
    try {
        const { treeId } = req.params;

        const [persons] = await pool.query(
            'SELECT * FROM persons WHERE tree_id = ? ORDER BY date_of_birth',
            [treeId]
        );

        res.json({
            success: true,
            count: persons.length,
            data: persons
        });
    } catch (error) {
        console.error('Get all persons error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching persons',
            error: error.message
        });
    }
};

// Get single person by ID
const getPersonById = async (req, res) => {
    try {
        const { id } = req.params;

        const [persons] = await pool.query(
            'SELECT * FROM persons WHERE person_id = ?',
            [id]
        );

        if (persons.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Person not found'
            });
        }

        // Get parents
        const [parents] = await pool.query(
            `SELECT p.*, r.relationship_type 
             FROM persons p 
             JOIN relationships r ON p.person_id = r.parent_id 
             WHERE r.child_id = ?`,
            [id]
        );

        // Get children
        const [children] = await pool.query(
            `SELECT p.*, r.relationship_type 
             FROM persons p 
             JOIN relationships r ON p.person_id = r.child_id 
             WHERE r.parent_id = ?`,
            [id]
        );

        // Get spouse(s)
        const [spouses] = await pool.query(
            `SELECT p.*, m.marriage_date, m.marriage_place, m.is_current 
             FROM persons p 
             JOIN marriages m ON (p.person_id = m.spouse1_id OR p.person_id = m.spouse2_id) 
             WHERE (m.spouse1_id = ? OR m.spouse2_id = ?) AND p.person_id != ?`,
            [id, id, id]
        );

        res.json({
            success: true,
            data: {
                ...persons[0],
                parents,
                children,
                spouses
            }
        });
    } catch (error) {
        console.error('Get person by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching person',
            error: error.message
        });
    }
};

// Create new person
const createPerson = async (req, res) => {
    try {
        const { treeId } = req.params;
        const {
            firstName,
            middleName,
            lastName,
            maidenName,
            gender,
            dateOfBirth,
            dateOfDeath,
            isAlive,
            birthPlace,
            deathPlace,
            occupation,
            bio,
            profilePhoto
        } = req.body;

        if (!firstName || !gender) {
            return res.status(400).json({
                success: false,
                message: 'First name and gender are required'
            });
        }

        const [result] = await pool.query(
            `INSERT INTO persons (tree_id, first_name, middle_name, last_name, maiden_name, 
             gender, date_of_birth, date_of_death, is_alive, birth_place, death_place, 
             occupation, bio, profile_photo) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                treeId,
                firstName,
                middleName || null,
                lastName || null,
                maidenName || null,
                gender,
                dateOfBirth || null,
                dateOfDeath || null,
                isAlive !== undefined ? isAlive : true,
                birthPlace || null,
                deathPlace || null,
                occupation || null,
                bio || null,
                profilePhoto || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Person created successfully',
            data: {
                personId: result.insertId
            }
        });
    } catch (error) {
        console.error('Create person error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating person',
            error: error.message
        });
    }
};

// Update person
const updatePerson = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            firstName,
            middleName,
            lastName,
            maidenName,
            gender,
            dateOfBirth,
            dateOfDeath,
            isAlive,
            birthPlace,
            deathPlace,
            occupation,
            bio,
            profilePhoto
        } = req.body;

        const [persons] = await pool.query(
            'SELECT * FROM persons WHERE person_id = ?',
            [id]
        );

        if (persons.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Person not found'
            });
        }

        await pool.query(
            `UPDATE persons SET 
             first_name = ?, middle_name = ?, last_name = ?, maiden_name = ?,
             gender = ?, date_of_birth = ?, date_of_death = ?, is_alive = ?,
             birth_place = ?, death_place = ?, occupation = ?, bio = ?, profile_photo = ?
             WHERE person_id = ?`,
            [
                firstName,
                middleName || null,
                lastName || null,
                maidenName || null,
                gender,
                (dateOfBirth && dateOfBirth !== '') ? dateOfBirth : null,
                (dateOfDeath && dateOfDeath !== '') ? dateOfDeath : null,
                isAlive,
                birthPlace || null,
                deathPlace || null,
                occupation || null,
                bio || null,
                profilePhoto || null,
                id
            ]
        );

        res.json({
            success: true,
            message: 'Person updated successfully'
        });
    } catch (error) {
        console.error('Update person error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating person',
            error: error.message
        });
    }
};

// Delete person
const deletePerson = async (req, res) => {
    try {
        const { id } = req.params;

        const [persons] = await pool.query(
            'SELECT * FROM persons WHERE person_id = ?',
            [id]
        );

        if (persons.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Person not found'
            });
        }

        await pool.query('DELETE FROM persons WHERE person_id = ?', [id]);

        res.json({
            success: true,
            message: 'Person deleted successfully'
        });
    } catch (error) {
        console.error('Delete person error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting person',
            error: error.message
        });
    }
};

// Upload photo for a person
const uploadPhoto = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const [persons] = await pool.query(
            'SELECT * FROM persons WHERE person_id = ?',
            [id]
        );

        if (persons.length === 0) {
            // Delete uploaded file if person not found
            const fs = require('fs');
            fs.unlinkSync(req.file.path);

            return res.status(404).json({
                success: false,
                message: 'Person not found'
            });
        }

        // Delete old photo if exists
        const oldPhoto = persons[0].profile_photo;
        if (oldPhoto) {
            const fs = require('fs');
            const path = require('path');
            const oldPhotoPath = path.join(__dirname, '../uploads/photos', path.basename(oldPhoto));
            if (fs.existsSync(oldPhotoPath)) {
                fs.unlinkSync(oldPhotoPath);
            }
        }

        // Update person with new photo path
        const photoPath = `/uploads/photos/${req.file.filename}`;
        await pool.query(
            'UPDATE persons SET profile_photo = ? WHERE person_id = ?',
            [photoPath, id]
        );

        res.json({
            success: true,
            message: 'Photo uploaded successfully',
            data: {
                photoPath
            }
        });
    } catch (error) {
        console.error('Upload photo error:', error);

        // Clean up uploaded file on error
        if (req.file) {
            const fs = require('fs');
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Error uploading photo',
            error: error.message
        });
    }
};

// Delete photo for a person
const deletePhoto = async (req, res) => {
    try {
        const { id } = req.params;

        const [persons] = await pool.query(
            'SELECT * FROM persons WHERE person_id = ?',
            [id]
        );

        if (persons.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Person not found'
            });
        }

        const photoPath = persons[0].profile_photo;
        if (!photoPath) {
            return res.status(400).json({
                success: false,
                message: 'Person has no photo to delete'
            });
        }

        // Delete photo file
        const fs = require('fs');
        const path = require('path');
        const fullPath = path.join(__dirname, '../uploads/photos', path.basename(photoPath));
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        // Update database
        await pool.query(
            'UPDATE persons SET profile_photo = NULL WHERE person_id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Photo deleted successfully'
        });
    } catch (error) {
        console.error('Delete photo error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting photo',
            error: error.message
        });
    }
};

module.exports = {
    getAllPersons,
    getPersonById,
    createPerson,
    updatePerson,
    deletePerson,
    uploadPhoto,
    deletePhoto
};
