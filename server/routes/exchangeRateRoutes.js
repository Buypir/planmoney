const express = require('express');
const router = express.Router();

const { getExchangeRates } = require('../controllers/exchangeRateController');

router.get('/', getExchangeRates);

module.exports = router;
