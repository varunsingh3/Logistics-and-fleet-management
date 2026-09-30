const express = require('express');
const router = express.Router();
const { getDashboardStats, addActivity } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.get('/stats', getDashboardStats);
router.post('/activity', authenticateToken, authorizeRoles('admin', 'manager'), addActivity);

module.exports = router;
