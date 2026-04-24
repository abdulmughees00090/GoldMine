# ⛏ GoldMine — Live Financial Intelligence Platform

> Real-time Gold, Silver, Crypto, Forex & Stock market data — 100% frontend, GitHub Pages ready.

🌐 **Live Site:** [GoldMine.silverfoxdynamics.com](https://GoldMine.silverfoxdynamics.com)

---

## 🚀 Features

| Feature | Details |
|---|---|
| **Live Prices** | Gold, Silver, Oil, BTC, ETH, 20+ Forex pairs, Top Stocks |
| **TradingView Charts** | Candlestick charts with RSI, MACD, Bollinger Bands |
| **Technical Analysis** | Frontend RSI, MACD, SMA, EMA, Bollinger, Trend, Momentum |
| **Market Forecasts** | AI-style signals from technical indicators |
| **News Feed** | Live financial news with category filters |
| **Currency Converter** | 20+ currencies + Gold + BTC |
| **Fear & Greed Index** | Live crypto sentiment |
| **Market Heatmap** | Color-coded asset performance |
| **Dark/Light Mode** | Auto-saved to localStorage |
| **PWA Ready** | manifest.json, installable |
| **SEO Optimized** | sitemap.xml, robots.txt, Open Graph, Schema |
| **Ad Ready** | Header, sidebar, in-content, sticky mobile placeholders |

---

## 📁 File Structure

```
GoldMine/
├── index.html          # Homepage
├── gold.html           # Gold market page
├── silver.html         # Silver market page
├── crude-oil.html      # Crude oil (WTI + Brent)
├── stocks.html         # Global stocks + indices
├── forex.html          # Forex rates + converter
├── crypto.html         # Crypto + Fear & Greed
├── news.html           # News hub with filters
├── forecast.html       # Technical analysis engine
├── sitemap.xml         # SEO sitemap
├── robots.txt          # SEO robots
├── manifest.json       # PWA manifest
├── CNAME               # Custom domain
├── assets/
│   ├── css/
│   │   └── main.css    # Full design system (dark/light)
│   ├── js/
│   │   └── core.js     # API layer, ticker, utilities
│   └── icons/
│       └── favicon.svg
└── README.md
```

---

## 🔑 API Keys Setup

Open `assets/js/core.js` and replace the placeholder keys:

```javascript
const KEYS = {
  ALPHA_VANTAGE: "YOUR_ALPHA_VANTAGE_KEY",   // alphavantage.co — Free
  TWELVE_DATA:   "YOUR_TWELVE_DATA_KEY",      // twelvedata.com  — Free tier
  FINNHUB:       "YOUR_FINNHUB_KEY",          // finnhub.io      — Free tier
  NEWS_API:      "YOUR_NEWS_API_KEY",          // newsapi.org     — Free tier
  METALS_API:    "YOUR_METALS_API_KEY",        // metals-api.com  — Free tier
  GNEWS:         "YOUR_GNEWS_KEY",             // gnews.io        — Free tier
};
```

### Free API sign-ups:
| API | URL | Free Tier |
|---|---|---|
| Alpha Vantage | https://alphavantage.co | 25 req/day |
| Twelve Data | https://twelvedata.com | 800 req/day |
| Finnhub | https://finnhub.io | 60 req/min |
| NewsAPI | https://newsapi.org | 100 req/day |
| GNews | https://gnews.io | 100 req/day |
| CoinGecko | https://coingecko.com/api | **No key needed** ✅ |
| ExchangeRate | https://open.er-api.com | **No key needed** ✅ |

> **Without API keys**, the site uses realistic mock/fallback data and still looks fully functional.

---

## 🐙 GitHub Pages Deployment

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial GoldMine deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/GoldMine.git
git push -u origin main
```

### Step 2 — Enable GitHub Pages
1. Go to your repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / `root`
4. Click **Save**

Your site will be live at:
`https://YOUR_USERNAME.github.io/GoldMine/`

### Step 3 — Custom Domain
1. In GitHub Pages settings, add custom domain: `GoldMine.silverfoxdynamics.com`
2. At your DNS provider (silverfoxdynamics.com), add:

```
Type: CNAME
Name: GoldMine
Value: YOUR_USERNAME.github.io
```

3. Enable **Enforce HTTPS** ✅

---

## 🎨 Customization

### Colors
Edit CSS variables in `assets/css/main.css`:
```css
:root {
  --gold:       #D4AF37;  /* Change brand gold color */
  --gold-light: #F5D96B;
  --gold-dark:  #9A7D1E;
}
```

### Add New Assets to Ticker
In `assets/js/core.js`, edit the `Ticker.items` array.

### Page-Specific Themes
Each page uses a theme class:
- `theme-gold` → Gold page
- `theme-silver` → Silver page
- `theme-oil` → Oil page
- `theme-stocks` → Stocks page
- `theme-forex` → Forex page
- `theme-crypto` → Crypto page

---

## 📱 Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| `< 600px` | Mobile — single column, sticky mobile ad |
| `< 900px` | Tablet — 2 columns, hidden desktop nav |
| `< 1200px` | Small desktop — adjusted hero |
| `≥ 1200px` | Full desktop — max-width 1400px |

---

## ⚡ Performance

- API responses cached in `sessionStorage` (1–10 min TTL)
- Skeleton loaders while data loads
- Lazy-loaded images
- Chart.js loaded from CDN
- TradingView widgets embedded (no self-hosted JS)
- Fonts loaded from Google Fonts

---

## 📈 Monetization (Ad Placeholders)

Replace placeholder divs in each HTML file:

```html
<!-- Header banner (728×90) -->
<div class="ad-placeholder ad-header">ADVERTISEMENT</div>

<!-- Sidebar (300×250) -->
<div class="ad-placeholder ad-sidebar">AD 300×250</div>

<!-- In-content (728×90) -->
<div class="ad-placeholder ad-in-content">ADVERTISEMENT</div>

<!-- Mobile sticky footer (320×50) -->
<div class="ad-sticky-mobile">...</div>
```

Replace with Google AdSense, Media.net, or any ad network `<script>` tags.

---

## ⚠️ Disclaimer

All data displayed is for **informational purposes only** and does not constitute financial advice. Market data may be delayed. Always conduct your own research before making investment decisions.

---

## 📄 License

MIT License — Free to use, modify and deploy.

Built with ❤️ by [SilverFox Dynamics](https://silverfoxdynamics.com)
