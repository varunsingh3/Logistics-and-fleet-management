const express = require('express');
const router = express.Router();
const {
  getShipments,
  getShipmentStats,
  getShipmentById,
  trackShipment,
  createShipment,
  updateShipment,
  updateShipmentStatus,
  deleteShipment,
} = require('../controllers/shipmentController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

// Public tracking and overview
router.get('/', getShipments);
router.get('/stats/summary', getShipmentStats);
router.get('/track/:shipmentId', trackShipment);
router.get('/:id', getShipmentById);

// Protected write (admin, manager)
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), createShipment);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'manager'), updateShipment);
router.patch('/:id/status', authenticateToken, authorizeRoles('admin', 'manager'), updateShipmentStatus);

// Protected delete (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteShipment);

module.exports = router;
