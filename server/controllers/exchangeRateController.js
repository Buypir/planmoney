// Отримання курсів валют НБУ (з простим кешуванням, бо НБУ оновлює курс ~раз на добу)
let cache = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 година

const fetchRate = async (code) => {
  const res = await fetch(`https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=${code}&json`);
  const data = await res.json();
  return data[0]?.rate;
};

// Курси у вигляді { UAH: 1, USD: 44.5, EUR: 51.7 }. Кидає помилку, якщо НБУ недоступний
// і в кеші ще нічого немає — краще відмовити, ніж порахувати за вигаданим курсом.
const getRates = async () => {
  const now = Date.now();
  if (cache && now - cachedAt < CACHE_TTL_MS) return cache;

  try {
    const [usd, eur] = await Promise.all([fetchRate('USD'), fetchRate('EUR')]);
    cache = { UAH: 1, USD: usd, EUR: eur, updatedAt: new Date().toISOString() };
    cachedAt = now;
    return cache;
  } catch (error) {
    if (cache) return cache;
    throw error;
  }
};

const getExchangeRates = async (req, res) => {
  try {
    res.json(await getRates());
  } catch {
    res.status(502).json({ error: 'Не вдалося отримати курс НБУ' });
  }
};

module.exports = { getExchangeRates, getRates };
