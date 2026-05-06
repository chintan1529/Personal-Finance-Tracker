# UPI Expense Intelligence

An elegant, privacy-first personal finance tracker focused on UPI transactions. This project helps you understand spending, manage budgets, track goals, and generate insightful reports — all with a lightweight, fast UI.

**Highlights**

- Clean, responsive React + Vite UI with modular components for transactions, budgets, recurring payments, goals, and reports.
- Import/export and reporting tools for quick data portability.
- Designed for local-first usage; no external analytics/telemetry.

**Tech Stack**

- Framework: React + TypeScript
- Bundler: Vite
- UI: Tailored components in components/
- Services: services/geminiService.ts (integration points)

**Quick Start**

1. Install dependencies

```bash
npm install
```

2. (Optional) Set environment variables

If you have integrations that require an API key (e.g., Gemini), set them in a local environment file:

```bash
# create .env.local and add keys
GEMINI_API_KEY=your_api_key_here
```

3. Run development server

```bash
npm run dev
```

4. Build for production

```bash
npm run build
```

5. Preview production build

```bash
npm run preview
```

**Core Features**

- Transaction management: add, edit, categorize, and search transactions.
- Recurring transactions manager for subscriptions and bills.
- Budgeting and goal tracking with visual charts.
- Export/Import your data for backups or migration.
- Report generation for monthly/quarterly reviews.

**Project Structure (selected)**

- `App*.tsx` — app entry variants and UI demos
- `components/` — UI components: `TransactionTable.tsx`, `BudgetManager.tsx`, `GoalTracker.tsx`, `ReportGenerator.tsx`, etc.
- `services/` — backend/service layer helpers like `geminiService.ts`.

**Configuration & Notes**

- Update constants in `constants.ts` for app-specific tweaks.
- Types are extended in `types-extended.ts` for domain models.

**Testing**

- A UI test exists at `tests/professional-ui-overhaul.test.ts`. Run tests once configured for your preferred runner.

**Contributing**

Contributions are welcome. Please open issues for bugs or feature requests and submit pull requests for improvements.

**License**

This project is provided as-is; add your preferred license in `LICENSE`.

**Contact**

For questions or help, open an issue in the repository.

