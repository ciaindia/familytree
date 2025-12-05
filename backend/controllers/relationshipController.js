const { pool } = require('../config/database');

// Get all relationships in a tree
const getAllRelationships = async (req, res) => {
    try {
        const { treeId } = req.params;

        const [relationships] = await pool.query(
            `SELECT r.*, 
             CONCAT(p1.first_name, ' ', IFNULL(p1.last_name, '')) AS parent_name,
             CONCAT(p2.first_name, ' ', IFNULL(p2.last_name, '')) AS child_name
             FROM relationships r
             JOIN persons p1 ON r.parent_id = p1.person_id
             JOIN persons p2 ON r.child_id = p2.person_id
             WHERE r.tree_id = ?`,
            [treeId]
        );

        res.json({
            success: true,
            count: relationships.length,
            data: relationships
        });
    } catch (error) {
        console.error('Get all relationships error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching relationships',
            error: error.message
        });
    }
};

// Create new relationship
const createRelationship = async (req, res) => {
    try {
        const { treeId, parentId, childId, relationshipType } = req.body;

        if (!treeId || !parentId || !childId) {
            return res.status(400).json({
                success: false,
                message: 'Tree ID, parent ID, and child ID are required'
            });
        }

        if (parentId === childId) {
            return res.status(400).json({
                success: false,
                message: 'Parent and child cannot be the same person'
            });
        }

        // Check if relationship already exists
        const [existing] = await pool.query(
            'SELECT * FROM relationships WHERE tree_id = ? AND parent_id = ? AND child_id = ?',
            [treeId, parentId, childId]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This relationship already exists'
            });
        }

        const [result] = await pool.query(
            'INSERT INTO relationships (tree_id, parent_id, child_id, relationship_type) VALUES (?, ?, ?, ?)',
            [treeId, parentId, childId, relationshipType || 'Biological']
        );

        res.status(201).json({
            success: true,
            message: 'Relationship created successfully',
            data: {
                relationshipId: result.insertId
            }
        });
    } catch (error) {
        console.error('Create relationship error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating relationship',
            error: error.message
        });
    }
};

// Delete relationship
const deleteRelationship = async (req, res) => {
    try {
        const { id } = req.params;

        const [relationships] = await pool.query(
            'SELECT * FROM relationships WHERE relationship_id = ?',
            [id]
        );

        if (relationships.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Relationship not found'
            });
        }

        await pool.query('DELETE FROM relationships WHERE relationship_id = ?', [id]);

        res.json({
            success: true,
            message: 'Relationship deleted successfully'
        });
    } catch (error) {
        console.error('Delete relationship error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting relationship',
            error: error.message
        });
    }
};

module.exports = {
    getAllRelationships,
    createRelationship,
    deleteRelationship
};
