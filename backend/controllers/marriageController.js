const { pool } = require('../config/database');

// Get all marriages in a tree
const getAllMarriages = async (req, res) => {
    try {
        const { treeId } = req.params;

        const [marriages] = await pool.query(
            `SELECT m.*, 
             CONCAT(p1.first_name, ' ', IFNULL(p1.last_name, '')) AS spouse1_name,
             CONCAT(p2.first_name, ' ', IFNULL(p2.last_name, '')) AS spouse2_name
             FROM marriages m
             JOIN persons p1 ON m.spouse1_id = p1.person_id
             JOIN persons p2 ON m.spouse2_id = p2.person_id
             WHERE m.tree_id = ?`,
            [treeId]
        );

        res.json({
            success: true,
            count: marriages.length,
            data: marriages
        });
    } catch (error) {
        console.error('Get all marriages error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching marriages',
            error: error.message
        });
    }
};

// Create new marriage
const createMarriage = async (req, res) => {
    try {
        const {
            treeId,
            spouse1Id,
            spouse2Id,
            marriageDate,
            marriagePlace,
            divorceDate,
            isCurrent,
            marriageType
        } = req.body;

        if (!treeId || !spouse1Id || !spouse2Id) {
            return res.status(400).json({
                success: false,
                message: 'Tree ID and both spouse IDs are required'
            });
        }

        if (spouse1Id === spouse2Id) {
            return res.status(400).json({
                success: false,
                message: 'Spouses cannot be the same person'
            });
        }

        const [result] = await pool.query(
            `INSERT INTO marriages (tree_id, spouse1_id, spouse2_id, marriage_date, 
             marriage_place, divorce_date, is_current, marriage_type) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                treeId,
                spouse1Id,
                spouse2Id,
                marriageDate || null,
                marriagePlace || null,
                divorceDate || null,
                isCurrent !== undefined ? isCurrent : true,
                marriageType || 'Marriage'
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Marriage created successfully',
            data: {
                marriageId: result.insertId
            }
        });
    } catch (error) {
        console.error('Create marriage error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating marriage',
            error: error.message
        });
    }
};

// Update marriage
const updateMarriage = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            marriageDate,
            marriagePlace,
            divorceDate,
            isCurrent,
            marriageType
        } = req.body;

        const [marriages] = await pool.query(
            'SELECT * FROM marriages WHERE marriage_id = ?',
            [id]
        );

        if (marriages.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Marriage not found'
            });
        }

        await pool.query(
            `UPDATE marriages SET 
             marriage_date = ?, marriage_place = ?, divorce_date = ?, 
             is_current = ?, marriage_type = ?
             WHERE marriage_id = ?`,
            [marriageDate, marriagePlace, divorceDate, isCurrent, marriageType, id]
        );

        res.json({
            success: true,
            message: 'Marriage updated successfully'
        });
    } catch (error) {
        console.error('Update marriage error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating marriage',
            error: error.message
        });
    }
};

// Delete marriage
const deleteMarriage = async (req, res) => {
    try {
        const { id } = req.params;

        const [marriages] = await pool.query(
            'SELECT * FROM marriages WHERE marriage_id = ?',
            [id]
        );

        if (marriages.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Marriage not found'
            });
        }

        await pool.query('DELETE FROM marriages WHERE marriage_id = ?', [id]);

        res.json({
            success: true,
            message: 'Marriage deleted successfully'
        });
    } catch (error) {
        console.error('Delete marriage error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting marriage',
            error: error.message
        });
    }
};

module.exports = {
    getAllMarriages,
    createMarriage,
    updateMarriage,
    deleteMarriage
};
