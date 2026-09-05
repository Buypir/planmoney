const express = require('express');
const router = express.Router();

const {
  getAllRecurrings,
  createRecurring,
  setRecurringActive,
  deleteRecurring,
} = require('../controllers/recurringController');

router.get('/', getAllRecurrings);
router.post('/', createRecurring);
router.put('/:id/active', setRecurringActive);
router.delete('/:id', deleteRecurring);

module.exports = router;
