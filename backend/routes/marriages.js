const express = require('express');
const router = express.Router();
const {
    createMarriage,
    updateMarriage,
    deleteMarriage
} = require('../controllers/marriageController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// @route   POST /api/marriages
// @desc    Create new marriage
// @access  Private
router.post('/', createMarriage);

// @route   PUT /api/marriages/:id
// @desc    Update marriage
// @access  Private
router.put('/:id', updateMarriage);

// @route   DELETE /api/marriages/:id
// @desc    Delete marriage
// @access  Private
router.delete('/:id', deleteMarriage);

module.exports = router;
