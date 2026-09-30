const express = require('express');
const router = express.Router();
const {
  getWarehouses,
  getWarehouseStats,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} = require('../controllers/warehouseController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

// Read endpoints
router.get('/', getWarehouses);
router.get('/stats/summary', getWarehouseStats);
router.get('/:id', getWarehouseById);

// Protected write (admin, manager)
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), createWarehouse);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'manager'), updateWarehouse);

// Protected delete (admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteWarehouse);

module.exports = router;
