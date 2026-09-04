const express = require('express');
const router = express.Router();

const { getAllGoals, createGoal, addToGoal, deleteGoal } = require('../controllers/goalController');

router.get('/', getAllGoals);
router.post('/', createGoal);
router.put('/:id/add', addToGoal);
router.delete('/:id', deleteGoal);

module.exports = router;
