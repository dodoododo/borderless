import { Router } from 'express';
import { CountryController } from '../controllers/country.controller.js';
import { getCountryDiscover } from '../controllers/countryDetail.controller.js';
import { getCountryMiniInfo } from '../controllers/countryMini.controller.js';

const router = Router();

router.get('/:iso', CountryController.getCountryProfile);
router.get('/:iso2/discover', getCountryDiscover);
router.get('/:iso/mini', getCountryMiniInfo);

export default router;