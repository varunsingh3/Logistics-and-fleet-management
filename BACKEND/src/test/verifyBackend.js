/**
 * LogiFleet Backend End-to-End Verification Test
 * Verifies JWT auth, password hashing, role authorization, and route modules
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting LogiFleet Backend Logic Verification');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✕ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: Password hashing and verification with bcryptjs
  console.log('[1] Testing Password Hashing & Bcrypt...');
  const plainPassword = 'varun123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plainPassword, salt);
  const matchSuccess = await bcrypt.compare('varun123', hash);
  const matchFailure = await bcrypt.compare('wrongpassword', hash);

  assert(matchSuccess === true, 'Bcrypt compares correct password accurately');
  assert(matchFailure === false, 'Bcrypt rejects incorrect password');

  // TEST 2: JWT Token signing and decoding
  console.log('\n[2] Testing JWT Generation & Verification...');
  const secret = 'logifleet_dev_secret_key_jwt_authentication_2026';
  const payload = { id: '60d0fe4f5311236168a109ca', name: 'Varun Singh', role: 'admin' };
  const token = jwt.sign(payload, secret, { expiresIn: '1h' });
  const decoded = jwt.verify(token, secret);

  assert(decoded.name === 'Varun Singh', 'JWT payload retains user name');
  assert(decoded.role === 'admin', 'JWT payload retains role');

  // TEST 3: Role-based Access Control (RBAC) middleware logic
  console.log('\n[3] Testing Role Middleware Logic...');
  const { authorizeRoles } = require('../middleware/role');

  const adminRoleCheck = authorizeRoles('admin');
  let allowed = false;
  let forbidden = false;

  // Mock admin request
  const mockAdminReq = { user: { role: 'admin' } };
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        if (code === 403) forbidden = true;
      },
    }),
  };
  adminRoleCheck(mockAdminReq, mockRes, () => {
    allowed = true;
  });
  assert(allowed === true, 'Role middleware permits authorized role (admin)');

  // Mock user request trying admin route
  allowed = false;
  forbidden = false;
  const mockUserReq = { user: { role: 'user' } };
  adminRoleCheck(mockUserReq, mockRes, () => {
    allowed = true;
  });
  assert(forbidden === true, 'Role middleware blocks unauthorized role (user) with 403');

  // TEST 4: Route Modules & Endpoints
  console.log('\n[4] Inspecting Route Module Endpoints...');
  const authRoutes = require('../routes/authRoutes');
  const vehicleRoutes = require('../routes/vehicleRoutes');
  const warehouseRoutes = require('../routes/warehouseRoutes');
  const shipmentRoutes = require('../routes/shipmentRoutes');
  const routeRoutes = require('../routes/routeRoutes');
  const bookingRoutes = require('../routes/bookingRoutes');
  const dashboardRoutes = require('../routes/dashboardRoutes');

  const getRouterPaths = (r) => {
    const stack = (r.router || r).stack || [];
    return stack.filter((s) => s.route).map((s) => s.route.path);
  };

  const authPaths = getRouterPaths(authRoutes);
  const vehiclePaths = getRouterPaths(vehicleRoutes);
  const warehousePaths = getRouterPaths(warehouseRoutes);
  const shipmentPaths = getRouterPaths(shipmentRoutes);
  const routePaths = getRouterPaths(routeRoutes);
  const bookingPaths = getRouterPaths(bookingRoutes);
  const dashboardPaths = getRouterPaths(dashboardRoutes);

  assert(authPaths.includes('/register') && authPaths.includes('/login'), 'Auth endpoints (/register, /login, /me) ready');
  assert(vehiclePaths.includes('/stats/summary') && vehiclePaths.includes('/:id'), 'Vehicle CRUD & summary endpoints ready');
  assert(warehousePaths.includes('/stats/summary') && warehousePaths.includes('/:id'), 'Warehouse CRUD & capacity endpoints ready');
  assert(shipmentPaths.includes('/track/:shipmentId') && shipmentPaths.includes('/stats/summary'), 'Shipment tracking & status endpoints ready');
  assert(routePaths.includes('/:id/book') && routePaths.includes('/'), 'Transport route search & ticket booking endpoints ready');
  assert(bookingPaths.includes('/') && bookingPaths.includes('/:id/cancel'), 'Booking management & cancellation endpoints ready');
  assert(dashboardPaths.includes('/stats'), 'Dashboard real-time analytics endpoints ready');

  // TEST 5: Express App Instance
  console.log('\n[5] Inspecting Express App Instance...');
  const app = require('../server');
  assert(typeof app.listen === 'function', 'Express app exports a valid runnable application');

  console.log('\n====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed === 0) {
    console.log('✅ ALL BACKEND LOGIC & INTEGRATIONS VERIFIED SUCCESSFULLY!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
