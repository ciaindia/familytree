const { pool } = require('../config/database');

// Get all trees for current user
const getAllTrees = async (req, res) => {
    try {
        const [trees] = await pool.query(
            'SELECT * FROM family_trees WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.userId]
        );

        res.json({
            success: true,
            count: trees.length,
            data: trees
        });
    } catch (error) {
        console.error('Get all trees error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching family trees',
            error: error.message
        });
    }
};

// Get single tree by ID
const getTreeById = async (req, res) => {
    try {
        const { id } = req.params;

        const [trees] = await pool.query(
            'SELECT * FROM family_trees WHERE tree_id = ? AND user_id = ?',
            [id, req.user.userId]
        );

        if (trees.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Family tree not found'
            });
        }

        res.json({
            success: true,
            data: trees[0]
        });
    } catch (error) {
        console.error('Get tree by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching family tree',
            error: error.message
        });
    }
};

// Create new tree
const createTree = async (req, res) => {
    try {
        const { treeName, description, isPublic } = req.body;

        if (!treeName) {
            return res.status(400).json({
                success: false,
                message: 'Tree name is required'
            });
        }

        const [result] = await pool.query(
            'INSERT INTO family_trees (user_id, tree_name, description, is_public) VALUES (?, ?, ?, ?)',
            [req.user.userId, treeName, description || null, isPublic || false]
        );

        res.status(201).json({
            success: true,
            message: 'Family tree created successfully',
            data: {
                treeId: result.insertId,
                treeName,
                description,
                isPublic: isPublic || false
            }
        });
    } catch (error) {
        console.error('Create tree error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating family tree',
            error: error.message
        });
    }
};

// Update tree
const updateTree = async (req, res) => {
    try {
        const { id } = req.params;
        const { treeName, description, isPublic } = req.body;

        // Check if tree exists and belongs to user
        const [trees] = await pool.query(
            'SELECT * FROM family_trees WHERE tree_id = ? AND user_id = ?',
            [id, req.user.userId]
        );

        if (trees.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Family tree not found'
            });
        }

        await pool.query(
            'UPDATE family_trees SET tree_name = ?, description = ?, is_public = ? WHERE tree_id = ?',
            [treeName, description, isPublic, id]
        );

        res.json({
            success: true,
            message: 'Family tree updated successfully'
        });
    } catch (error) {
        console.error('Update tree error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating family tree',
            error: error.message
        });
    }
};

// Delete tree
const deleteTree = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if tree exists and belongs to user
        const [trees] = await pool.query(
            'SELECT * FROM family_trees WHERE tree_id = ? AND user_id = ?',
            [id, req.user.userId]
        );

        if (trees.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Family tree not found'
            });
        }

        await pool.query('DELETE FROM family_trees WHERE tree_id = ?', [id]);

        res.json({
            success: true,
            message: 'Family tree deleted successfully'
        });
    } catch (error) {
        console.error('Delete tree error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting family tree',
            error: error.message
        });
    }
};

module.exports = {
    getAllTrees,
    getTreeById,
    createTree,
    updateTree,
    deleteTree
};
