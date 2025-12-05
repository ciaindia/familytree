const express = require('express');
const router = express.Router();
const {
    getAllPersons,
    getPersonById,
    createPerson,
    updatePerson,
    deletePerson,
    uploadPhoto,
    deletePhoto
} = require('../controllers/personController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(authenticateToken);

// @route   GET /api/persons/:id
// @desc    Get person by ID
// @access  Private
router.get('/:id', getPersonById);

// @route   PUT /api/persons/:id
// @desc    Update person
// @access  Private
router.put('/:id', updatePerson);

// @route   DELETE /api/persons/:id
// @desc    Delete person
// @access  Private
router.delete('/:id', deletePerson);

// @route   POST /api/persons/:id/photo
// @desc    Upload photo for a person
// @access  Private
router.post('/:id/photo', upload.single('photo'), uploadPhoto);

// @route   DELETE /api/persons/:id/photo
// @desc    Delete photo for a person
// @access  Private
router.delete('/:id/photo', deletePhoto);

module.exports = router;
