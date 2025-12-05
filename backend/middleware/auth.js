const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token.'
        });
    }
};

// Middleware to check if user owns the resource
const checkTreeOwnership = async (req, res, next) => {
    try {
        const { pool } = require('../config/database');
        const treeId = req.params.treeId || req.params.id;
        const userId = req.user.userId;

        const [trees] = await pool.query(
            'SELECT * FROM family_trees WHERE tree_id = ? AND user_id = ?',
            [treeId, userId]
        );

        if (trees.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not own this family tree.'
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error checking tree ownership',
            error: error.message
        });
    }
};

module.exports = {
    authenticateToken,
    checkTreeOwnership
};
