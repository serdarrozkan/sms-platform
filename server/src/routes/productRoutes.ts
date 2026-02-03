import { Router } from 'express';
import { getProducts, getProductPrices } from '../controllers/productController';

const router = Router();

router.get('/', getProducts);
router.get('/:code/prices', getProductPrices);

export default router;
