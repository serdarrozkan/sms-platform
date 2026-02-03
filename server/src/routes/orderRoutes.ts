import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrder,
  checkOrder,
  finishOrder,
  cancelOrder,
  banOrder,
} from '../controllers/orderController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.get('/:id/check', checkOrder);
router.post('/:id/finish', finishOrder);
router.post('/:id/cancel', cancelOrder);
router.post('/:id/ban', banOrder);

export default router;
