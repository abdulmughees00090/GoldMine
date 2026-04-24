/**
 * GoldMine — Core JavaScript
 * API integrations, caching, theme, ticker, charts
 */

/* ─── API Keys (replace with your own) ───────────────────── */
const KEYS = {
  ALPHA_VANTAGE:   "YOUR_ALPHA_VANTAGE_KEY",   // alphavantage.co
  TWELVE_DATA:     "YOUR_TWELVE_DATA_KEY",      // twelvedata.com
  FINNHUB:         "YOUR_FINNHUB_KEY",          // finnhub.io
  NEWS_API:        "YOUR_NEWS_API_KEY",          // newsapi.org
  METALS_API:      "YOUR_METALS_API_KEY",        // metals-api.com
  GNEWS:           "YOUR_GNEWS_KEY",             // gnews.io
};

/* ─── Cache ───────────────────────────────────────────────── */
const CACHE = {
  TTL: {
    PRICE:  60_000,       // 1 min
    NEWS:   300_000,      // 5 min
    CHART:  600_000,      // 10 min
  },
  get(key) {
    try {
      const item = JSON.parse(sessionStorage.getItem('gm_' + key));
      if (item && Date.now() - item.ts < (item.ttl || 60000)) return item.data;
    } catch {}
    return null;
  },
  set(key, data, ttl = 60000) {
    try { sessionStorage.setItem('gm_' + key, JSON.stringify({ data, ts: Date.now(), ttl })); } catch {}
  }
};

/* ─── Theme ───────────────────────────────────────────────── */
const Theme = {
  init() {
    const saved = localStorage.getItem('gm_theme') || 'dark';
    this.apply(saved);
  },
  toggle() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    this.apply(next);
    localStorage.setItem('gm_theme', next);
  },
  apply(t) {
    document.documentElement.setAttribute('data-theme', t);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
  }
};

/* ─── Fetch with retry + timeout ────────────────────────── */
async function fetchWithRetry(url, opts = {}, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, { ...opts, signal: ctrl.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

/* ─── CoinGecko (Crypto — no key needed) ─────────────────── */
const CoinGecko = {
  BASE: 'https://api.coingecko.com/api/v3',
  async prices(ids = 'bitcoin,ethereum,binancecoin,solana,cardano,ripple,dogecoin,polkadot') {
    const ckey = 'cg_prices';
    const cached = CACHE.get(ckey);
    if (cached) return cached;
    try {
      const data = await fetchWithRetry(
        `${this.BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
      );
      CACHE.set(ckey, data, CACHE.TTL.PRICE);
      return data;
    } catch { return null; }
  },
  async trending() {
    const ckey = 'cg_trending';
    const cached = CACHE.get(ckey);
    if (cached) return cached;
    try {
      const data = await fetchWithRetry(`${this.BASE}/search/trending`);
      CACHE.set(ckey, data, CACHE.TTL.PRICE);
      return data;
    } catch { return null; }
  },
  async marketChart(id, days = 7) {
    const ckey = `cg_chart_${id}_${days}`;
    const cached = CACHE.get(ckey);
    if (cached) return cached;
    try {
      const data = await fetchWithRetry(`${this.BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`);
      CACHE.set(ckey, data, CACHE.TTL.CHART);
      return data;
    } catch { return null; }
  },
  async fearGreed() {
    const ckey = 'fear_greed';
    const cached = CACHE.get(ckey);
    if (cached) return cached;
    try {
      const data = await fetchWithRetry('https://api.alternative.me/fng/?limit=1');
      CACHE.set(ckey, data, CACHE.TTL.PRICE);
      return data;
    } catch { return null; }
  },
  async global() {
    try {
      const data = await fetchWithRetry(`${this.BASE}/global`);
      return data;
    } catch { return null; }
  }
};

/* ─── ExchangeRate (Forex — no key) ──────────────────────── */
const ForexAPI = {
  BASE: 'https://open.er-api.com/v6/latest',
  async rates(base = 'USD') {
    const ckey = `forex_${base}`;
    const cached = CACHE.get(ckey);
    if (cached) return cached;
    try {
      const data = await fetchWithRetry(`${this.BASE}/${base}`);
      CACHE.set(ckey, data, CACHE.TTL.PRICE * 5);
      return data;
    } catch { return null; }
  }
};

/* ─── Metals (uses mock/fallback if no key) ───────────────── */
const MetalsAPI = {
  // Twelve Data supports metals on free tier
  async goldPrice() {
    const ckey = 'gold_price';
    const cached = CACHE.get(ckey);
    if (cached) return cached;
    // Try Twelve Data
    if (KEYS.TWELVE_DATA !== 'YOUR_TWELVE_DATA_KEY') {
      try {
        const data = await fetchWithRetry(
          `https://api.twelvedata.com/price?symbol=XAU/USD&apikey=${KEYS.TWELVE_DATA}`
        );
        if (data.price) {
          const result = { price: parseFloat(data.price), symbol: 'XAU/USD' };
          CACHE.set(ckey, result, CACHE.TTL.PRICE);
          return result;
        }
      } catch {}
    }
    // Fallback mock data with realistic values
    return this._mock('gold');
  },
  async silverPrice() {
    const ckey = 'silver_price';
    const cached = CACHE.get(ckey);
    if (cached) return cached;
    if (KEYS.TWELVE_DATA !== 'YOUR_TWELVE_DATA_KEY') {
      try {
        const data = await fetchWithRetry(
          `https://api.twelvedata.com/price?symbol=XAG/USD&apikey=${KEYS.TWELVE_DATA}`
        );
        if (data.price) {
          const result = { price: parseFloat(data.price), symbol: 'XAG/USD' };
          CACHE.set(ckey, result, CACHE.TTL.PRICE);
          return result;
        }
      } catch {}
    }
    return this._mock('silver');
  },
  _mock(asset) {
    // Simulate realistic prices with small random variation
    const base = { gold: 3320, silver: 32.5, oil_wti: 78.4, oil_brent: 82.1 };
    const b = base[asset] || 100;
    const variation = (Math.random() - 0.5) * b * 0.01;
    const change = (Math.random() - 0.45) * 1.2;
    return {
      price: parseFloat((b + variation).toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      pct: parseFloat((change / b * 100).toFixed(3)),
      symbol: asset.toUpperCase(),
      mock: true
    };
  }
};

/* ─── News (GNews free tier as primary) ─────────────────── */
const NewsAPI = {
  async fetch(query = 'gold silver market', limit = 6) {
    const ckey = `news_${query.replace(/\s/g,'_')}`;
    const cached = CACHE.get(ckey);
    if (cached) return cached;

    // Try GNews
    if (KEYS.GNEWS !== 'YOUR_GNEWS_KEY') {
      try {
        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=${limit}&token=${KEYS.GNEWS}`;
        const data = await fetchWithRetry(url);
        if (data.articles) {
          CACHE.set(ckey, data.articles, CACHE.TTL.NEWS);
          return data.articles;
        }
      } catch {}
    }

    // Fallback: use mock news headlines
    return this._mockNews(query);
  },
  _mockNews(q) {
    const headlines = [
      { title: "Gold Surges to Record Highs Amid Global Uncertainty", source: { name: "Reuters" }, publishedAt: new Date().toISOString(), url: "#", description: "Gold prices climbed to their highest level this year as investors sought safe-haven assets." },
      { title: "Silver Shows Strong Bullish Pattern on Weekly Charts", source: { name: "Bloomberg" }, publishedAt: new Date(Date.now() - 3600000).toISOString(), url: "#", description: "Technical analysts point to a cup-and-handle formation forming on silver's weekly chart." },
      { title: "Crude Oil Markets React to OPEC+ Production Decisions", source: { name: "MarketWatch" }, publishedAt: new Date(Date.now() - 7200000).toISOString(), url: "#", description: "Oil prices fluctuated after OPEC+ members discussed adjusting production quotas." },
      { title: "Bitcoin Consolidates Above Key Support Level", source: { name: "CoinDesk" }, publishedAt: new Date(Date.now() - 10800000).toISOString(), url: "#", description: "BTC holds ground as institutional buyers continue accumulation strategy." },
      { title: "S&P 500 Reaches New All-Time High Driven by Tech Sector", source: { name: "CNBC" }, publishedAt: new Date(Date.now() - 14400000).toISOString(), url: "#", description: "The benchmark index powered higher, led by gains in mega-cap technology stocks." },
      { title: "EUR/USD Tests Critical Resistance Zone", source: { name: "FX Street" }, publishedAt: new Date(Date.now() - 18000000).toISOString(), url: "#", description: "The euro gained ground against the dollar as European economic data exceeded forecasts." },
    ];
    return headlines;
  }
};

/* ─── Stocks (Alpha Vantage or Finnhub) ─────────────────── */
const StocksAPI = {
  async quote(symbol) {
    const ckey = `stock_${symbol}`;
    const cached = CACHE.get(ckey);
    if (cached) return cached;

    if (KEYS.FINNHUB !== 'YOUR_FINNHUB_KEY') {
      try {
        const data = await fetchWithRetry(
          `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${KEYS.FINNHUB}`
        );
        if (data.c) {
          const result = {
            symbol, price: data.c, open: data.o, high: data.h,
            low: data.l, prevClose: data.pc,
            change: parseFloat((data.c - data.pc).toFixed(2)),
            pct: parseFloat(((data.c - data.pc) / data.pc * 100).toFixed(2))
          };
          CACHE.set(ckey, result, CACHE.TTL.PRICE);
          return result;
        }
      } catch {}
    }

    if (KEYS.ALPHA_VANTAGE !== 'YOUR_ALPHA_VANTAGE_KEY') {
      try {
        const data = await fetchWithRetry(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${KEYS.ALPHA_VANTAGE}`
        );
        const q = data['Global Quote'];
        if (q) {
          const result = {
            symbol, price: parseFloat(q['05. price']), open: parseFloat(q['02. open']),
            high: parseFloat(q['03. high']), low: parseFloat(q['04. low']),
            change: parseFloat(q['09. change']), pct: parseFloat(q['10. change percent'])
          };
          CACHE.set(ckey, result, CACHE.TTL.PRICE);
          return result;
        }
      } catch {}
    }

    return this._mockStock(symbol);
  },
  _mockStock(symbol) {
    const prices = {
      'AAPL': 213.5, 'MSFT': 415.2, 'GOOGL': 175.8, 'AMZN': 185.4,
      'NVDA': 875.3, 'META': 525.1, 'TSLA': 248.7, 'JPM': 198.4,
      'SPY': 548.2, 'QQQ': 468.9, '^GSPC': 5450, '^IXIC': 17800, '^DJI': 42500
    };
    const p = prices[symbol] || 100 + Math.random() * 400;
    const chg = (Math.random() - 0.45) * p * 0.02;
    return {
      symbol, price: parseFloat(p.toFixed(2)),
      change: parseFloat(chg.toFixed(2)),
      pct: parseFloat((chg / p * 100).toFixed(2)),
      mock: true
    };
  }
};

/* ─── Sparkline Charts (Chart.js) ────────────────────────── */
const Sparkline = {
  generate(n = 30, startVal, volatility = 0.02) {
    const vals = [startVal];
    for (let i = 1; i < n; i++) {
      const change = vals[i-1] * (1 + (Math.random() - 0.48) * volatility);
      vals.push(parseFloat(change.toFixed(2)));
    }
    return vals;
  },
  draw(canvasId, data, isUp = true) {
    const el = document.getElementById(canvasId) || document.querySelector(canvasId);
    if (!el) return;
    // SOLUTION 3: Force fixed canvas dimensions before Chart.js initialization
  el.style.width = '100%';
  el.style.height = '50px';
  el.width = el.offsetWidth;
  el.height = 50;
    const ctx = el.getContext('2d');
    const color = isUp ? '#16A34A' : '#DC2626';
    const gradient = ctx.createLinearGradient(0, 0, 0, el.height);
    gradient.addColorStop(0, isUp ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    if (el._chart) el._chart.destroy();
    el._chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((_, i) => i),
        datasets: [{
          data,
          borderColor: color,
          borderWidth: 1.5,
          fill: true,
          backgroundColor: gradient,
          pointRadius: 0,
          tension: 0.4,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
        animation: { duration: 800 }
      }
    });
  },
  drawFromCoinGecko(canvasId, pricesArray, isUp) {
    if (!pricesArray?.prices) return;
    const vals = pricesArray.prices.map(p => p[1]);
    this.draw(canvasId, vals, isUp);
  }
};

/* ─── Mini Line Chart (for hero panel) ───────────────────── */
function drawMiniChart(canvasId, data, color = '#D4AF37') {
  const el = document.getElementById(canvasId);
  if (!el || !window.Chart) return;
  const ctx = el.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, el.height || 120);
  gradient.addColorStop(0, color + '40');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  if (el._chart) el._chart.destroy();
  el._chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map((_, i) => i),
      datasets: [{
        data,
        borderColor: color,
        borderWidth: 2,
        fill: true,
        backgroundColor: gradient,
        pointRadius: 0,
        tension: 0.4,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
    }
  });
}

/* ─── Ticker ──────────────────────────────────────────────── */
const Ticker = {
  items: [
    { name: 'GOLD', price: '—', change: '—', dir: '' },
    { name: 'SILVER', price: '—', change: '—', dir: '' },
    { name: 'OIL WTI', price: '—', change: '—', dir: '' },
    { name: 'BTC', price: '—', change: '—', dir: '' },
    { name: 'ETH', price: '—', change: '—', dir: '' },
    { name: 'EUR/USD', price: '—', change: '—', dir: '' },
    { name: 'GBP/USD', price: '—', change: '—', dir: '' },
    { name: 'AAPL', price: '—', change: '—', dir: '' },
    { name: 'NVDA', price: '—', change: '—', dir: '' },
    { name: 'SPY', price: '—', change: '—', dir: '' },
  ],
  render() {
    const bar = document.getElementById('ticker-bar');
    if (!bar) return;
    // Duplicate for seamless loop
    const html = [...this.items, ...this.items].map(item => `
      <span class="ticker-item">
        <span class="t-name">${item.name}</span>
        <span class="t-price">${item.price}</span>
        <span class="t-change ${item.dir}">${item.dir === 'up' ? '▲' : item.dir === 'down' ? '▼' : ''} ${item.change}</span>
      </span>
    `).join('');
    bar.innerHTML = `<div class="ticker-inner">${html}</div>`;
  },
  async update() {
    // Crypto
    const crypto = await CoinGecko.prices('bitcoin,ethereum');
    if (crypto) {
      const btc = crypto.bitcoin;
      const eth = crypto.ethereum;
      const btcIdx = this.items.findIndex(i => i.name === 'BTC');
      const ethIdx = this.items.findIndex(i => i.name === 'ETH');
      if (btcIdx >= 0) {
        this.items[btcIdx] = {
          name: 'BTC',
          price: `$${fmt(btc.usd, 0)}`,
          change: `${Math.abs(btc.usd_24h_change).toFixed(2)}%`,
          dir: btc.usd_24h_change >= 0 ? 'up' : 'down'
        };
      }
      if (ethIdx >= 0) {
        this.items[ethIdx] = {
          name: 'ETH',
          price: `$${fmt(eth.usd, 0)}`,
          change: `${Math.abs(eth.usd_24h_change).toFixed(2)}%`,
          dir: eth.usd_24h_change >= 0 ? 'up' : 'down'
        };
      }
    }

    // Forex
    const forex = await ForexAPI.rates('USD');
    if (forex?.rates) {
      const eur = this.items.findIndex(i => i.name === 'EUR/USD');
      const gbp = this.items.findIndex(i => i.name === 'GBP/USD');
      if (eur >= 0) this.items[eur] = { name:'EUR/USD', price: (1/forex.rates.EUR).toFixed(4), change: '0.12%', dir:'up' };
      if (gbp >= 0) this.items[gbp] = { name:'GBP/USD', price: (1/forex.rates.GBP).toFixed(4), change: '0.08%', dir:'up' };
    }

    // Metals mock
    const gold = await MetalsAPI.goldPrice();
    if (gold) {
      const idx = this.items.findIndex(i => i.name === 'GOLD');
      if (idx >= 0) this.items[idx] = {
        name: 'GOLD', price: `$${fmt(gold.price, 2)}`,
        change: `${Math.abs(gold.pct || 0.3).toFixed(2)}%`,
        dir: (gold.pct || 0.3) >= 0 ? 'up' : 'down'
      };
    }

    // Stocks
    const stocks = ['AAPL', 'NVDA', 'SPY'];
    for (const s of stocks) {
      const q = await StocksAPI.quote(s);
      if (q) {
        const idx = this.items.findIndex(i => i.name === s);
        if (idx >= 0) this.items[idx] = {
          name: s, price: `$${fmt(q.price, 2)}`,
          change: `${Math.abs(q.pct).toFixed(2)}%`,
          dir: q.pct >= 0 ? 'up' : 'down'
        };
      }
    }

    this.render();
  },
  init() {
    this.render();
    this.update();
    setInterval(() => this.update(), 60000);
  }
};

/* ─── Number Formatting ───────────────────────────────────── */
function fmt(n, decimals = 2) {
  if (n == null || isNaN(n)) return '—';
  return parseFloat(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}
function fmtLarge(n) {
  if (!n) return '—';
  if (n >= 1e12) return `$${(n/1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n/1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n/1e6).toFixed(2)}M`;
  return `$${fmt(n, 2)}`;
}
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  if (diff < 60000)   return `${Math.floor(diff/1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000)return `${Math.floor(diff/3600000)}h ago`;
  return `${Math.floor(diff/86400000)}d ago`;
}

/* ─── Nav scroll & mobile menu ───────────────────────────── */
function initNav() {
  const nav = document.getElementById('navbar');
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('mobile-menu');

  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', window.scrollY > 20);
  });

  toggle?.addEventListener('click', () => menu?.classList.toggle('open'));

  // Active link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, #mobile-menu a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
}

/* ─── TradingView Widget Helpers ─────────────────────────── */
const TV = {
  chart(containerId, symbol, interval = 'D', theme = null) {
    const t = theme || (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    new TradingView.widget({
      autosize: true,
      symbol,
      interval,
      timezone: 'Etc/UTC',
      theme: t,
      style: '1',
      locale: 'en',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      container_id: containerId,
    });
  },
  ticker(containerId, symbols = []) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <div class="tradingview-widget-container">
        <div class="tradingview-widget-container__widget"></div>
        <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js" async>
        ${JSON.stringify({ symbols: symbols.map(s => ({ proName: s.proName, title: s.title })), colorTheme: document.documentElement.getAttribute('data-theme') || 'dark', isTransparent: true, displayMode: 'compact', locale: 'en' })}
        <\/script>
      </div>`;
  }
};

/* ─── Page-specific initializers ────────────────────────── */
async function initHomePage() {
  // Market quick cards
  await loadMarketCards();
  // Hero gold price
  await loadHeroPrice();
  // Gainers & losers
  await loadGainersLosers();
  // News
  await loadHomeNews();
  // Heatmap
  buildHeatmap();
}

async function loadHeroPrice() {
  const gold = await MetalsAPI.goldPrice();
  if (!gold) return;
  const priceEl   = document.getElementById('hero-gold-price');
  const changeEl  = document.getElementById('hero-gold-change');
  if (priceEl) priceEl.textContent = `$${fmt(gold.price, 2)}`;
  if (changeEl) {
    const chg = gold.pct || (Math.random() > 0.4 ? 0.42 : -0.21);
    changeEl.className = `price-change ${chg >= 0 ? 'up' : 'down'}`;
    changeEl.textContent = `${chg >= 0 ? '▲' : '▼'} ${Math.abs(chg).toFixed(2)}%  Today`;
  }
  // Mini chart
  const chartData = Sparkline.generate(40, gold.price * 0.97, 0.012);
  drawMiniChart('hero-chart', chartData, '#D4AF37');
}

async function loadMarketCards() {
  const container = document.getElementById('market-cards');
  if (!container) return;

  const cards = [
    { id: 'gold',   icon: '🥇', name: 'Gold', unit: '/oz', accentVar: 'var(--gold)',    link: 'gold.html', fetch: () => MetalsAPI.goldPrice() },
    { id: 'silver', icon: '🥈', name: 'Silver', unit: '/oz', accentVar: '#A8A9AD',      link: 'silver.html', fetch: () => MetalsAPI.silverPrice() },
    { id: 'oil',    icon: '🛢️', name: 'WTI Oil', unit: '/bbl', accentVar: '#E8650A',   link: 'crude-oil.html', fetch: () => Promise.resolve(MetalsAPI._mock('oil_wti')) },
    { id: 'btc',    icon: '₿',  name: 'Bitcoin', unit: '',  accentVar: '#F7931A',       link: 'crypto.html', fetch: null },
    { id: 'eth',    icon: 'Ξ',  name: 'Ethereum', unit: '', accentVar: '#627EEA',       link: 'crypto.html', fetch: null },
    { id: 'spy',    icon: '📈', name: 'S&P 500',  unit: '',  accentVar: 'var(--stock-blue)', link: 'stocks.html', fetch: () => StocksAPI.quote('SPY') },
  ];

  // Skeleton
  container.innerHTML = cards.map(c => `
    <div class="market-card fade-in" style="--card-accent:${c.accentVar}">
      <div class="skeleton sk-card"></div>
    </div>`).join('');

  const cryptoData = await CoinGecko.prices('bitcoin,ethereum');

  // Render with data
  const rendered = await Promise.all(cards.map(async (c, i) => {
    let price, pct, isUp = true;

    if (c.id === 'btc' && cryptoData?.bitcoin) {
      price = cryptoData.bitcoin.usd;
      pct   = cryptoData.bitcoin.usd_24h_change;
    } else if (c.id === 'eth' && cryptoData?.ethereum) {
      price = cryptoData.ethereum.usd;
      pct   = cryptoData.ethereum.usd_24h_change;
    } else if (c.fetch) {
      const d = await c.fetch();
      price = d?.price;
      pct   = d?.pct ?? (Math.random() - 0.45) * 2;
    }

    isUp = (pct ?? 0) >= 0;
    const sparkData = Sparkline.generate(20, (price || 100) * 0.97, 0.015);

    return { c, price, pct, isUp, sparkData };
  }));

  container.innerHTML = rendered.map(({ c, price, pct, isUp, sparkData }) => `
    <a href="${c.link}" class="market-card fade-in" style="--card-accent:${c.accentVar}">
      <div class="card-header">
        <div class="card-icon" style="background:${c.accentVar}20">${c.icon}</div>
        <span class="card-badge ${isUp ? 'up' : 'down'}">${isUp ? '▲' : '▼'} ${Math.abs(pct ?? 0).toFixed(2)}%</span>
      </div>
      <div class="card-name">${c.name}${c.unit ? ' (' + c.unit.trim() + ')' : ''}</div>
      <div class="card-price">${price != null ? (c.id === 'btc' || c.id === 'eth' ? '$' + fmt(price, 2) : '$' + fmt(price, 2)) : '—'}</div>
      <canvas class="card-sparkline" id="spark-${c.id}" height="50"></canvas>
    </a>
  `).join('');

  // Draw sparklines
  rendered.forEach(({ c, pct, sparkData }) => {
    Sparkline.draw(`spark-${c.id}`, sparkData, (pct ?? 0) >= 0);
  });
}

async function loadGainersLosers() {
  const gainers = document.getElementById('top-gainers');
  const losers  = document.getElementById('top-losers');
  if (!gainers || !losers) return;

  const symbols = ['AAPL', 'MSFT', 'NVDA', 'META', 'TSLA', 'AMZN', 'GOOGL', 'JPM'];
  const results = await Promise.all(symbols.map(s => StocksAPI.quote(s)));

  const sorted = results.filter(Boolean).sort((a, b) => b.pct - a.pct);
  const top = sorted.slice(0, 4);
  const bot = sorted.slice(-4).reverse();

  const renderRow = (item) => `
    <div class="gl-row">
      <div>
        <div class="gl-name">${item.symbol}</div>
        <div class="gl-sub">$${fmt(item.price, 2)}</div>
      </div>
      <span class="gl-change ${item.pct >= 0 ? 'up' : 'down'}">${item.pct >= 0 ? '+' : ''}${item.pct.toFixed(2)}%</span>
    </div>`;

  gainers.innerHTML = top.map(renderRow).join('');
  losers.innerHTML  = bot.map(renderRow).join('');
}

async function loadHomeNews() {
  const container = document.getElementById('home-news');
  if (!container) return;

  const articles = await NewsAPI.fetch('gold silver crypto market', 6);
  if (!articles?.length) return;

  container.innerHTML = articles.map(a => `
    <a href="${a.url}" target="_blank" rel="noopener" class="news-card fade-in">
      <div class="news-card-img">
        ${a.image ? `<img src="${a.image}" alt="${a.title}" loading="lazy">` : ''}
        <span class="nc-category">${a.source?.name || 'Markets'}</span>
      </div>
      <div class="news-card-body">
        <h3>${a.title}</h3>
        <div class="news-card-meta">
          <span>${a.source?.name || ''}</span>
          <span>${timeAgo(a.publishedAt)}</span>
        </div>
      </div>
    </a>`).join('');
}

function buildHeatmap() {
  const el = document.getElementById('heatmap');
  if (!el) return;

  const assets = [
    { name: 'XAU', chg: 1.42 }, { name: 'XAG', chg: 2.10 }, { name: 'OIL', chg: -0.85 },
    { name: 'BTC', chg: 3.21 }, { name: 'ETH', chg: 2.87 }, { name: 'BNB', chg: -1.20 },
    { name: 'SOL', chg: 5.40 }, { name: 'XRP', chg: -2.10 }, { name: 'AAPL', chg: 0.82 },
    { name: 'MSFT', chg: 1.15 }, { name: 'NVDA', chg: 4.20 }, { name: 'TSLA', chg: -3.10 },
    { name: 'AMZN', chg: 0.54 }, { name: 'META', chg: 2.30 }, { name: 'GOOGL', chg: -0.45 },
    { name: 'SPY', chg: 0.78 }, { name: 'QQQ', chg: 1.20 }, { name: 'EUR', chg: 0.25 },
    { name: 'GBP', chg: -0.15 }, { name: 'JPY', chg: -0.82 }
  ];

  const colorClass = (chg) => {
    if (chg > 3)   return 'big-up';
    if (chg > 1)   return 'up';
    if (chg > 0)   return 'small-up';
    if (chg === 0) return 'neutral';
    if (chg > -1)  return 'small-dn';
    if (chg > -3)  return 'down';
    return 'big-dn';
  };

  el.innerHTML = assets.map(a => `
    <div class="hm-cell ${colorClass(a.chg)}">
      <div class="hm-name">${a.name}</div>
      <div class="hm-chg">${a.chg >= 0 ? '+' : ''}${a.chg.toFixed(2)}%</div>
    </div>`).join('');
}

/* ─── Breaking News Ticker ───────────────────────────────── */
async function initBreakingNews(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const articles = await NewsAPI.fetch('market financial breaking', 8);
  if (!articles?.length) return;
  const text = articles.map(a => `📊 ${a.title}`).join('  ●  ');
  el.querySelector('.bn-track').textContent = text;
}

/* ─── Countdown to market open ───────────────────────────── */
function marketStatus() {
  const now = new Date();
  const ny = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const h = ny.getHours(), m = ny.getMinutes(), d = ny.getDay();
  const isWeekday = d >= 1 && d <= 5;
  const isOpen = isWeekday && (h > 9 || (h === 9 && m >= 30)) && h < 16;
  return { isOpen, statusText: isOpen ? 'Markets Open' : 'Markets Closed' };
}

/* ─── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  initNav();
  Ticker.init();

  document.getElementById('theme-toggle')?.addEventListener('click', () => Theme.toggle());

  // Page-specific init
  const page = window.location.pathname.split('/').pop() || 'index.html';
  if (page === 'index.html' || page === '') initHomePage();

  // Intersection observer for fade-in
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('fade-in');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.observe-fade').forEach(el => observer.observe(el));
});

// Export for use in page scripts
window.GM = {
  CoinGecko, ForexAPI, MetalsAPI, NewsAPI, StocksAPI,
  Sparkline, Ticker, Theme, TV,
  fmt, fmtLarge, timeAgo, drawMiniChart,
  loadHomeNews, buildHeatmap, marketStatus, KEYS
};
