import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import {
  getDashboard,
  getUsers,
  getUser,
  updateUser,
  addUserBalance,
  getAllOrders,
  getDeposits,
  updateDeposit,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminCountries,
  createCountry,
  updateCountry,
  deleteCountry,
  getSettings,
  updateSettings,
  getFivesimBalance,
  getLogs,
  getRevenueReport,
} from '../controllers/adminController';

const router = Router();

// All admin routes require auth + admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard
router.get('/dashboard', getDashboard);

// Users
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.patch('/users/:id', updateUser);
router.post('/users/:id/balance', addUserBalance);

// Orders
router.get('/orders', getAllOrders);

// Deposits
router.get('/deposits', getDeposits);
router.patch('/deposits/:id', updateDeposit);

// Products
router.get('/products', getAdminProducts);
router.post('/products', createProduct);
router.patch('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Countries
router.get('/countries', getAdminCountries);
router.post('/countries', createCountry);
router.patch('/countries/:id', updateCountry);
router.delete('/countries/:id', deleteCountry);

// Settings
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);

// 5sim
router.get('/fivesim/balance', getFivesimBalance);

// Logs
router.get('/logs', getLogs);

// Reports
router.get('/reports/revenue', getRevenueReport);

export default router;
