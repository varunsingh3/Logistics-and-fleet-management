const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicleStats,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require('../controllers/vehicleController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

// Public or Authenticated read
router.get('/', getVehicles);
router.get('/stats/summary', getVehicleStats);
router.get('/:id', getVehicleById);

// Protected write (admin, manager)
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), createVehicle);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'manager'), updateVehicle);

// Protected delete (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteVehicle);

module.exports = router;
