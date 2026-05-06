# Tasks: Professional UI Overhaul

## Task List

- [x] 1. Create unified design system (styles.css)
  - [x] 1.1 Delete all four existing CSS files (styles-advanced.css, styles-minimal.css, styles-premium.css, styles-premium-fixed.css)
  - [x] 1.2 Create styles.css with all CSS custom property tokens (colors, spacing, typography, shadows, border-radius, transitions)
  - [x] 1.3 Add component-level CSS classes: .card, .card--accent-primary, .card--accent-success, .card--accent-danger
  - [x] 1.4 Add .btn-primary and .btn-secondary classes with min-height/min-width 44px touch targets
  - [x] 1.5 Add .input class with focus ring using primary accent color
  - [x] 1.6 Add .badge, .badge--success, .badge--warning, .badge--danger, .badge--neutral classes
  - [x] 1.7 Add .sidebar and .sidebar-item classes (including .active state)
  - [x] 1.8 Add .modal-overlay and .modal-panel classes
  - [x] 1.9 Add responsive utility classes and media query breakpoints (768px, 1024px)

- [x] 2. Rewrite App.tsx as single canonical entry point
  - [x] 2.1 Replace App.tsx content with full sidebar navigation layout (Dashboard, Transactions, Budgets, Goals, Recurring, Reports, Settings tabs)
  - [x] 2.2 Implement sticky header with logo, "UPI Expense Intelligence" title, hamburger button (mobile), and "Add Transaction" primary action button
  - [x] 2.3 Implement Sidebar as fixed left panel on desktop (>=1024px) and off-canvas drawer on mobile with backdrop overlay
  - [x] 2.4 Implement activeTab state management and render correct tab content in main area
  - [x] 2.5 Migrate all localStorage persistence logic (transactions, budgets, goals, recurringTransactions) from App-Premium-Fixed.tsx
  - [x] 2.6 Migrate transaction management handlers (add, edit, delete, import) from App-Premium-Fixed.tsx
  - [x] 2.7 Migrate budget alert computation and alert banner rendering from App.tsx
  - [x] 2.8 Migrate Gemini AI insights panel and handleGenerateAdvice from App.tsx
  - [x] 2.9 Change stylesheet import to ./styles.css only (remove any variant-specific CSS imports)

- [x] 3. Implement professional Dashboard tab
  - [x] 3.1 Create StatCard inline component with label, formatted value (₹ + en-IN locale), icon, accent variant, and optional trend text
  - [x] 3.2 Render four StatCards in responsive grid (1 col mobile / 2 col tablet / 4 col desktop): Total Balance, Monthly Expenses, Monthly Income, Top Spending Category
  - [x] 3.3 Apply accent variants: primary for balance, danger for expenses, success for income, neutral for top category
  - [x] 3.4 Render spending trend AreaChart (recharts) showing daily expense totals when transactions exist
  - [x] 3.5 Render income vs. expenses LineChart (recharts) grouped by month when transactions exist
  - [x] 3.6 Render CategoryChart component for expense distribution
  - [x] 3.7 Render ten most recent transactions using TransactionTable component
  - [x] 3.8 Render budget alert banners above StatCards when spending >= 80% of limit (warning) or >= 100% (critical)
  - [x] 3.9 Render Gemini AI insights panel with "Generate Insights" button and SpendingInsight cards

- [x] 4. Update Card component
  - [x] 4.1 Replace inline Tailwind classes in Card.tsx with .card CSS class from design system
  - [x] 4.2 Verify title, subtitle, and className props still work correctly

- [x] 5. Update TransactionTable component
  - [x] 5.1 Apply consistent row hover state using design system tokens
  - [x] 5.2 Ensure category badges use CATEGORY_COLORS with .badge CSS class
  - [x] 5.3 Verify amount column is right-aligned with credit (green) / debit (slate/dark) color coding

- [x] 6. Update TransactionTableAdvanced component
  - [x] 6.1 Apply .input CSS class to all filter inputs (search, category select, type select, date inputs, amount inputs)
  - [x] 6.2 Apply .btn-primary to Export CSV and Delete Selected buttons
  - [x] 6.3 Apply .btn-secondary to Cancel/secondary action buttons

- [x] 7. Update BudgetManager component
  - [x] 7.1 Apply .input CSS class to all form inputs in BudgetForm
  - [x] 7.2 Apply .btn-primary / .btn-secondary to form action buttons
  - [x] 7.3 Verify progress bar uses bg-green-500 (<80%), bg-amber-500 (80-99%), bg-red-500 (>=100%) classes
  - [x] 7.4 Apply .badge classes to status indicators

- [x] 8. Update GoalTracker component
  - [x] 8.1 Apply .input CSS class to all form inputs in GoalForm
  - [x] 8.2 Apply .btn-primary / .btn-secondary to form action buttons
  - [x] 8.3 Verify progress bar uses design system semantic color tokens
  - [x] 8.4 Apply .badge classes to status badges (Completed, Overdue, Due Soon, On Track)

- [x] 9. Update RecurringTransactionManager component
  - [x] 9.1 Apply .input CSS class to all form inputs in RecurringTransactionForm
  - [x] 9.2 Apply .btn-primary / .btn-secondary to form action buttons

- [x] 10. Update ReportGenerator component
  - [x] 10.1 Apply .input CSS class to date range inputs
  - [x] 10.2 Apply .btn-primary to Generate Report button and report type/format selector active states

- [x] 11. Update DataExportImport component
  - [x] 11.1 Apply .input CSS class to date range inputs
  - [x] 11.2 Apply .btn-primary / .btn-secondary to Export Data and other action buttons

- [x] 12. Update TransactionEditModal component
  - [x] 12.1 Apply .modal-overlay and .modal-panel CSS classes to modal structure
  - [x] 12.2 Apply .input CSS class to all form inputs (date, description, amount, category select)
  - [x] 12.3 Apply .btn-primary / .btn-secondary to form action buttons

- [ ] 13. Write property-based tests
  - [ ] 13.1 Install fast-check as a dev dependency
  - [ ] 13.2 Write Property 1 test: localStorage round-trip for transactions (Feature: professional-ui-overhaul, Property 1)
  - [ ] 13.3 Write Property 2 test: localStorage round-trip for budgets (Feature: professional-ui-overhaul, Property 2)
  - [ ] 13.4 Write Property 3 test: localStorage round-trip for goals (Feature: professional-ui-overhaul, Property 3)
  - [ ] 13.5 Write Property 4 test: localStorage round-trip for recurring transactions (Feature: professional-ui-overhaul, Property 4)
  - [ ] 13.6 Write Property 5 test: budget alert threshold invariant (Feature: professional-ui-overhaul, Property 5)
  - [ ] 13.7 Write Property 6 test: StatCard Indian locale formatting (Feature: professional-ui-overhaul, Property 6)
  - [ ] 13.8 Write Property 7 test: transaction deletion removes from state (Feature: professional-ui-overhaul, Property 7)
  - [ ] 13.9 Write Property 9 test: budget progress bar color invariant (Feature: professional-ui-overhaul, Property 9)
  - [ ] 13.10 Configure each property test to run minimum 100 iterations
