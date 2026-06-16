import express from 'express';
import auth from '../../middlewares/auth';
import { FAQControllers } from './faq.controller';

const router = express.Router();

router.post('/', auth('admin'), FAQControllers.createFAQ);

router.get('/', FAQControllers.getAllFAQ);

router.get('/admin', auth('admin'), FAQControllers.getAllFAQForAdmin);

router.get('/:id', FAQControllers.getFAQById);

router.patch('/:id', auth('admin'), FAQControllers.updateFAQ);

router.put('/update-status/:id', auth('admin'), FAQControllers.updateFAQStatus);

export const FAQRoutes = router;
