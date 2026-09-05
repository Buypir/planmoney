// Отримання курсів валют НБУ (з простим кешуванням, бо НБУ оновлює курс ~раз на добу)
let cache = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 година

const fetchRate = async (code) => {
  const res = await fetch(`https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=${code}&json`);
  const data = await res.json();
  return data[0]?.rate;
};

const getExchangeRates = async (req, res) => {
  const now = Date.now();
  if (cache && now - cachedAt < CACHE_TTL_MS) {
    return res.json(cache);
  }

  try {
    const [usd, eur] = await Promise.all([fetchRate('USD'), fetchRate('EUR')]);
    cache = { UAH: 1, USD: usd, EUR: eur, updatedAt: new Date().toISOString() };
    cachedAt = now;
    res.json(cache);
  } catch {
    if (cache) return res.json(cache);
    res.status(502).json({ error: 'Не вдалося отримати курс НБУ' });
  }
};

module.exports = { getExchangeRates };
