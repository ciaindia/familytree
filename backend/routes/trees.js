const express = require('express');
const router = express.Router();
const {
    getAllTrees,
    getTreeById,
    createTree,
    updateTree,
    deleteTree
} = require('../controllers/treeController');
const {
    getAllPersons,
    createPerson
} = require('../controllers/personController');
const {
    getAllRelationships
} = require('../controllers/relationshipController');
const {
    getAllMarriages
} = require('../controllers/marriageController');
const { authenticateToken, checkTreeOwnership } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// @route   GET /api/trees
// @desc    Get all trees for current user
// @access  Private
router.get('/', getAllTrees);

// @route   POST /api/trees
// @desc    Create new tree
// @access  Private
router.post('/', createTree);

// @route   GET /api/trees/:id
// @desc    Get tree by ID
// @access  Private
router.get('/:id', getTreeById);

// @route   PUT /api/trees/:id
// @desc    Update tree
// @access  Private
router.put('/:id', updateTree);

// @route   DELETE /api/trees/:id
// @desc    Delete tree
// @access  Private
router.delete('/:id', deleteTree);

// Person routes under tree
// @route   GET /api/trees/:treeId/persons
// @desc    Get all persons in a tree
// @access  Private
router.get('/:treeId/persons', checkTreeOwnership, getAllPersons);

// @route   POST /api/trees/:treeId/persons
// @desc    Create new person in a tree
// @access  Private
router.post('/:treeId/persons', checkTreeOwnership, createPerson);

// Relationship routes under tree
// @route   GET /api/trees/:treeId/relationships
// @desc    Get all relationships in a tree
// @access  Private
router.get('/:treeId/relationships', checkTreeOwnership, getAllRelationships);

// Marriage routes under tree
// @route   GET /api/trees/:treeId/marriages
// @desc    Get all marriages in a tree
// @access  Private
router.get('/:treeId/marriages', checkTreeOwnership, getAllMarriages);

module.exports = router;
