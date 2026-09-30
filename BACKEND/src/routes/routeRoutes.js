const express = require('express');
const router = express.Router();
const {
  getRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  bookTicket,
} = require('../controllers/routeController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

// Public route search & details
router.get('/', getRoutes);
router.get('/:id', getRouteById);

// Public / Authenticated ticket booking
router.post('/:id/book', optionalAuth, bookTicket);

// Protected route management (admin, manager)
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), createRoute);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'manager'), updateRoute);

// Protected delete (admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteRoute);

module.exports = router;
