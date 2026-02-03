import { Router } from 'express';
import { getCountries } from '../controllers/countryController';

const router = Router();

router.get('/', getCountries);

export default router;
