const express = require('express');
const router = express.Router();
const {
    createRelationship,
    deleteRelationship
} = require('../controllers/relationshipController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// @route   POST /api/relationships
// @desc    Create new relationship
// @access  Private
router.post('/', createRelationship);

// @route   DELETE /api/relationships/:id
// @desc    Delete relationship
// @access  Private
router.delete('/:id', deleteRelationship);

module.exports = router;
