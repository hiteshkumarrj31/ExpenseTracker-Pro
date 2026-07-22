# ExpenseTracker Pro

A clean, offline-first personal finance tracker built with **HTML5, CSS3 and vanilla JavaScript** — no frameworks, no backend, no sign-up. All data lives in the browser's `localStorage`.

Built as a portfolio / internship project following the [ExpenseTracker Pro Blueprint v1.0].

## ✨ Features

- **Dashboard** — balance, monthly income/expense, savings, 6-month trend chart, category breakdown, recent transactions
- **Transactions** — add, edit, delete; search by note/category/amount; filter by type/category/period; sort by date/amount/category
- **Analytics** — bar, line and doughnut charts; highest/lowest/average expense, top category, daily average spend
- **Reports** — today/week/month/year or custom date range, printable layout, CSV export
- **Categories** — default income & expense categories, plus custom categories with your own name, color and icon
- **Settings** — Light / Dark / Auto theme, INR / USD / EUR currency, JSON backup & restore, full data reset
- Responsive down to mobile, keyboard-focus visible, respects `prefers-reduced-motion`

## 🗂 Project Structure

```
ExpenseTracker-Pro/
├── index.html            # Landing page
├── pages/                # Dashboard, Transactions, Analytics, Reports, Categories, Settings, About
├── css/                  # variables, style, page-specific styles, responsive, animation
├── js/                   # storage (data layer), helper, validation, theme, and one module per page
└── data/                 # sample data / default categories reference
```

## 🚀 Running Locally

No build step needed. Either:

1. Open `index.html` directly in a browser, **or**
2. Serve the folder with any static server, e.g.:
   ```bash
   npx serve .
   # or
   python3 -m http.server 8080
   ```
   then visit `http://localhost:8080`.

## 🔒 Data & Privacy

Every transaction, category and setting is stored in your browser's `localStorage` under the `etp_*` keys. Nothing is sent to a server. Use **Settings → Backup Data** to export a JSON snapshot, and **Restore from Backup** to bring it back (on this or another device/browser).

## 🛠 Tech Stack

- HTML5 / CSS3 / JavaScript (ES6)
- Bootstrap 5.3 + Bootstrap Icons
- Chart.js for charts
- Google Fonts (Poppins)

## 🔭 Future Scope

- Login & cloud sync (Firebase)
- Monthly budget planner with alerts
- Recurring transactions
- Financial goals with progress bars
- OCR receipt scanning
- Native mobile app

## 📄 License

MIT — free to use for learning
