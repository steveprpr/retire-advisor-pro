# RetireAdvisor Pro

AI-powered federal/civilian retirement planning tool. Enter your retirement parameters through an 8-step wizard and receive a personalized AI-generated retirement report with 10 interactive charts.

**Privacy first:** All financial data stays in your browser session only. No database. No cloud storage. Nothing leaves your device except the anonymized calculation summary sent to generate the AI report.

---

## Features

- **8-step wizard** — personal profile, federal service (FERS/CSRS/military), savings (TSP/401k/Roth), real estate & VA benefits, retirement goals, detailed expense builder, legacy/529 planning, consent
- **48 live calculations** — FERS/CSRS pension, TSP compound growth, Social Security at 3 claiming ages with break-even, federal + state taxes, Monte Carlo portfolio longevity, 529 projections, net worth at life expectancy
- **10 interactive charts** — income waterfall, portfolio growth/drawdown, expense donut, income vs expenses, SS strategy comparison, withdrawal strategy comparison, legacy net worth, 529 projection, COL comparison (expat), FERS options
- **AI-powered report** — streaming narrative via OpenRouter with model fallback chain (Claude → DeepSeek R1 → Gemini Pro)
- **Expat planning** — 11+ countries with COL data, visa info, healthcare costs
- **Access control** — 6-digit access code or Netlify Identity magic link
- **Dark mode** — full Tailwind dark mode support
- **Export PDF** — via browser print dialog (charts render in print)

---

## Quick Start (Local Dev)

### Prerequisites
- Node.js 20+
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) (`npm install -g netlify-cli`)
- An [OpenRouter](https://openrouter.ai) API key

### Setup

```bash
# Clone and install
cd retire-advisor-pro
npm install

# Copy env file and fill in your values
cp .env.example .env
# Edit .env — add OPENROUTER_API_KEY and VITE_ACCESS_CODE_HASH

# Run locally (Vite + Netlify Functions + /api proxy all together)
netlify dev
```

Open [http://localhost:8888](http://localhost:8888).

> **Important:** Use `netlify dev`, not `npm run dev`. The `netlify dev` command starts Vite AND the serverless functions AND proxies `/api/*` requests — all required for the report generator to work.

---

## Deploy to Netlify

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-user/retire-advisor-pro.git
git push -u origin main
```

### 2. Connect to Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Connect your GitHub repo
3. Build settings are pre-configured in `netlify.toml` (build command: `npm run build`, publish: `dist`)

### 3. Set Environment Variables

In Netlify Dashboard → **Site configuration** → **Environment variables**, add:

| Variable | Value | Where |
|----------|-------|-------|
| `OPENROUTER_API_KEY` | Your OpenRouter key | Server only (no VITE_ prefix) |
| `ACCESS_MODE` | `code` or `identity` | Server |
| `ACCESS_CODE` | Your 6-digit code | Server |
| `VITE_ACCESS_CODE_HASH` | SHA-256 hash of code | Client (VITE_ prefix OK) |
| `VITE_ACCESS_MODE` | `code` or `identity` | Client |
| `VITE_SITE_URL` | `https://your-site.netlify.app` | Client |

**Generate the hash:**
```bash
# macOS/Linux
echo -n "123456" | sha256sum

# PowerShell
[System.BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes("123456"))).Replace("-","").ToLower()

# Or use: https://emn178.github.io/online-tools/sha256.html
```

### 4. Deploy

```bash
netlify deploy --prod
```

---

## Access Control Modes

### Mode 1: Access Code (default)

Users enter a 6-digit code to access the app. The raw code is never in the bundle — only its SHA-256 hash (stored as `VITE_ACCESS_CODE_HASH`) is exposed client-side. Verification uses `crypto.subtle.digest` in the browser.

Set `ACCESS_MODE=code` and `VITE_ACCESS_MODE=code`.

### Mode 2: Netlify Identity

Users receive a magic-link invitation email. Requires enabling Netlify Identity in your site dashboard.

1. Netlify Dashboard → **Identity** → **Enable Identity**
2. Set **Registration** to **Invite only**
3. Invite users via **Identity** tab → **Invite users**
4. Set `ACCESS_MODE=identity` and `VITE_ACCESS_MODE=identity`

### Mode 3: No Gate (dev/internal)

Set `VITE_ACCESS_MODE=none` or leave `VITE_ACCESS_CODE_HASH` empty. The access gate is bypassed automatically.

---

## Cost Estimates

Costs depend on usage. Approximate OpenRouter costs per report:

| Model | Input tokens | Output tokens | Cost/report |
|-------|-------------|--------------|-------------|
| Claude Sonnet 4.6 (primary) | ~1,500 | ~2,000 | ~$0.02 |
| DeepSeek R1 (fallback 1) | ~1,500 | ~2,000 | ~$0.004 |
| Gemini Pro 1.5 (fallback 2) | ~1,500 | ~2,000 | ~$0.003 |

Quick insights (Gemini Flash): ~$0.0001 each. Rate limits (enforced client-side): 3 full reports + 20 quick insights per session.

---

## Architecture

```
src/
├── config/
│   ├── defaults.js          # All assumption defaults, IRS limits, FERS/SS tables
│   └── modelRouter.js       # OpenRouter model chain config
├── context/
│   ├── AppContext.jsx        # Three-slice state: form, assumptions, ui
│   └── CalculationsContext.jsx  # Derived read-only context (wraps Dashboard/Report only)
├── data/
│   ├── stateTaxData.js       # 50 states: income tax, COL, SS/pension treatment
│   ├── countryColData.js     # 11+ expat countries: COL, visa, healthcare
│   └── vaBenefitTable.js     # VA disability ratings → monthly benefit (2024)
├── hooks/
│   ├── useCalculations.js    # 48 calculations in ~7 memoized groups
│   └── useReportStream.js    # SSE streaming client + quick insight hook
├── utils/
│   ├── federalCalculations.js  # OPM MRA table, FERS annuity, COLA cap
│   ├── taxCalculations.js      # Federal brackets, SS taxable portion, state tax
│   ├── expenseCalculations.js  # Expense inflation, COL multiplier
│   ├── portfolioProjections.js # TSP growth, Monte Carlo, drawdown, SS
│   └── formatters.js           # formatCurrency, formatPercent, etc.
└── components/
    ├── Wizard/              # 8-step wizard (WizardShell + Step1–8)
    ├── Dashboard/           # Live metric cards + mini charts
    ├── Report/              # ReportView + 10 Recharts charts
    ├── Assumptions/         # Slide-over assumptions panel
    ├── AccessGate/          # CodeGate + IdentityGate
    └── common/              # SliderWithInput, ExpenseField, HelpTooltip, SmartBadge, CountrySearch

netlify/functions/
├── generate-report.js   # SSE streaming, model fallback chain (Netlify Functions v2)
└── quick-insight.js     # Simple Q&A endpoint (Gemini Flash)
```

**Key design decisions:**
- `CalculationsContext` wraps only Dashboard/Report — not the Wizard — to avoid recalculating on every keystroke
- `useCalculations` uses 7+ granular `useMemo` groups, each listing only the specific `form` fields it reads — never spreads the form object
- Report content lives in `UIState` only — so calculation memos never see it and never re-run during streaming
- Monte Carlo uses seeded LCG + Box-Muller: same inputs always produce same result; debounced 400ms

---

## Privacy

- **No PII collected:** No name, SSN, DOB, address, or email fields in the wizard
- **No server storage:** Financial data never leaves the browser. The AI report function receives only ~15 key numbers (not raw inputs)
- **sessionStorage only:** Saves only non-sensitive fields (employment type, state, service years — never salary or balances)
- **API key safety:** `OPENROUTER_API_KEY` is server-side only. Never has a `VITE_` prefix. Never logged.
- **Function logging:** Netlify Functions log only model name + timestamp. Request body is never logged.
- **Access code security:** Raw code stored server-side only. Client receives only its SHA-256 hash.

---

## Disclaimer

RetireAdvisor Pro is for **educational and planning purposes only**. It does not constitute financial, tax, legal, or investment advice. Calculations are estimates based on assumptions that may not match your actual situation. Consult a licensed Certified Financial Planner (CFP), CPA, or attorney before making retirement decisions.

FERS/CSRS rules, tax brackets, Social Security benefit formulas, and VA benefit rates are approximations based on publicly available OPM, IRS, SSA, and VA sources as of 2024–2025. Always verify with the relevant agency.
