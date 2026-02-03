import { Router } from 'express';
import {
  getBalance,
  getTransactions,
  createDepositRequest,
  getDepositRequests,
} from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/balance', getBalance);
router.get('/transactions', getTransactions);
router.post('/deposit-request', createDepositRequest);
router.get('/deposit-requests', getDepositRequests);

export default router;
