# Requirements Document

## Introduction

This feature transforms the existing UPI Expense Intelligence finance tracking app into a professional, industry-grade UI. The codebase currently has six App variants (`App.tsx`, `App-Minimal.tsx`, `App-Modern.tsx`, `App-Enhanced.tsx`, `App-Premium.tsx`, `App-Premium-Fixed.tsx`) and four CSS files with inconsistent styling. The goal is to consolidate into a single, polished application with a unified design system, clean component architecture, and a professional visual identity suitable for a production finance product.

The overhaul targets:
- A single canonical `App.tsx` entry point (replacing all variants)
- A unified CSS design token system (replacing all scattered CSS files)
- Consistent, accessible component styling across all 10 components
- A professional sidebar navigation layout with full tab support
- Responsive design for mobile, tablet, and desktop

## Glossary

- **App**: The root React component that composes the full application layout
- **Design_System**: The set of CSS custom properties (tokens), utility classes, and component styles defined in a single `styles.css` file
- **Dashboard**: The primary overview tab showing financial stats, charts, and recent transactions
- **Sidebar**: The persistent left-side navigation panel present on desktop, collapsible on mobile
- **Card**: The reusable surface component used to group related content
- **TransactionTable**: The component rendering a read-only list of recent transactions
- **TransactionTableAdvanced**: The component rendering a filterable, sortable, selectable full transaction list
- **BudgetManager**: The component for creating, editing, and monitoring spending budgets
- **GoalTracker**: The component for managing savings goals with progress tracking
- **RecurringTransactionManager**: The component for managing recurring/automated payments
- **ReportGenerator**: The component for generating financial reports
- **DataExportImport**: The component for importing and exporting transaction data
- **TransactionEditModal**: The modal dialog for creating or editing a single transaction
- **CategoryChart**: The donut chart component showing spending distribution by category
- **StatCard**: A summary metric card displayed in the dashboard stats row
- **ActiveTab**: The currently selected navigation section (dashboard, transactions, budgets, goals, recurring, reports, settings)
- **Design_Token**: A CSS custom property (e.g. `--color-primary`) that encodes a single design decision
- **Tailwind_CDN**: The Tailwind CSS library loaded via CDN script tag in `index.html`

---

## Requirements

### Requirement 1: Unified Design System

**User Story:** As a developer, I want a single source-of-truth CSS design system, so that all components share consistent visual tokens and the codebase is maintainable.

#### Acceptance Criteria

1. THE Design_System SHALL define all color, spacing, typography, shadow, border-radius, and transition values as CSS custom properties in a single `styles.css` file.
2. THE Design_System SHALL replace all four existing CSS files (`styles-advanced.css`, `styles-minimal.css`, `styles-premium.css`, `styles-premium-fixed.css`) as the sole stylesheet import.
3. THE Design_System SHALL provide a light-mode color palette using neutral grays, a single primary accent color (indigo/blue family), semantic success/warning/error colors, and surface/background layering tokens.
4. THE Design_System SHALL define component-level CSS classes (`.card`, `.btn-primary`, `.btn-secondary`, `.badge`, `.input`, `.sidebar`, `.sidebar-item`) that consume the design tokens.
5. WHEN the Tailwind_CDN is present in `index.html`, THE Design_System SHALL remain compatible with Tailwind utility classes used in components without conflict.

---

### Requirement 2: Single Canonical App Entry Point

**User Story:** As a developer, I want a single `App.tsx` that is the definitive application, so that the codebase is not fragmented across six variants.

#### Acceptance Criteria

1. THE App SHALL implement a full sidebar navigation layout with the following tabs: Dashboard, Transactions, Budgets, Goals, Recurring, Reports, Settings.
2. THE App SHALL render the Sidebar as a fixed left panel on screens ≥ 1024px wide.
3. WHEN the viewport width is less than 1024px, THE App SHALL render the Sidebar as an off-canvas drawer toggled by a hamburger button in the header.
4. THE App SHALL persist the selected ActiveTab in component state and render the corresponding tab content in the main content area.
5. THE App SHALL load and save all data (transactions, budgets, goals, recurring transactions) to `localStorage` on mount and on state change respectively.
6. THE App SHALL import only `./styles.css` as its stylesheet (no variant-specific CSS imports).

---

### Requirement 3: Professional Dashboard Tab

**User Story:** As a user, I want a professional dashboard overview, so that I can immediately understand my financial position at a glance.

#### Acceptance Criteria

1. THE Dashboard SHALL display four StatCards in a responsive grid: Total Balance, Monthly Expenses, Monthly Income, and Top Spending Category.
2. WHEN transactions exist, THE Dashboard SHALL render a spending trend chart (bar or area) showing daily expense totals over time.
3. WHEN transactions exist, THE Dashboard SHALL render an income vs. expenses comparison chart (line or bar) grouped by month.
4. THE Dashboard SHALL render the CategoryChart showing expense distribution by category.
5. THE Dashboard SHALL render the ten most recent transactions using the TransactionTable component.
6. WHEN budget alerts are active (spending ≥ 80% of limit), THE Dashboard SHALL display alert banners above the StatCards with distinct warning and critical visual states.
7. THE Dashboard SHALL render a Gemini AI insights panel with a "Generate Insights" button and display returned SpendingInsight cards when available.

---

### Requirement 4: Professional StatCard Component

**User Story:** As a user, I want visually distinct summary metric cards, so that key financial figures are immediately scannable.

#### Acceptance Criteria

1. THE StatCard SHALL display a label, a primary numeric value formatted with Indian locale (₹ prefix, `en-IN` locale), and an optional icon.
2. THE StatCard SHALL use the `.card` CSS class from the Design_System as its base surface.
3. WHEN the StatCard represents expenses, THE StatCard SHALL apply a red/danger accent (left border or icon color).
4. WHEN the StatCard represents income, THE StatCard SHALL apply a green/success accent.
5. WHEN the StatCard represents balance, THE StatCard SHALL apply the primary accent color.

---

### Requirement 5: Consistent Component Styling

**User Story:** As a user, I want all components to look visually cohesive, so that the app feels like a single professional product rather than a patchwork of styles.

#### Acceptance Criteria

1. THE Card component SHALL use the `.card` CSS class and accept `title`, `subtitle`, and `className` props without inline style overrides.
2. THE TransactionTable SHALL use consistent row hover states, category badge colors from `CATEGORY_COLORS`, and right-aligned amount column with credit/debit color coding.
3. THE TransactionTableAdvanced SHALL style its filter controls using the `.input` CSS class and action buttons using `.btn-primary` / `.btn-secondary` classes.
4. THE BudgetManager SHALL render budget progress bars using the Design_System's semantic color tokens (green < 80%, amber 80–99%, red ≥ 100%).
5. THE GoalTracker SHALL render goal progress bars and status badges using the Design_System's semantic color tokens.
6. THE TransactionEditModal SHALL use the Design_System's modal overlay, panel, and form input styles.
7. ALL form inputs across ALL components SHALL use the `.input` CSS class for consistent focus rings, border, and padding.
8. ALL primary action buttons across ALL components SHALL use the `.btn-primary` CSS class.

---

### Requirement 6: Responsive Layout

**User Story:** As a user, I want the app to work well on mobile, tablet, and desktop, so that I can track finances from any device.

#### Acceptance Criteria

1. THE App SHALL render a single-column layout on viewports narrower than 768px.
2. THE Sidebar SHALL be hidden by default on viewports narrower than 1024px and shown as an overlay drawer when the hamburger button is activated.
3. WHEN the Sidebar drawer is open on mobile, THE App SHALL render a semi-transparent backdrop overlay behind the Sidebar.
4. THE Dashboard stats grid SHALL render 1 column on mobile, 2 columns on tablet (≥ 768px), and 4 columns on desktop (≥ 1024px).
5. THE TransactionTableAdvanced filter row SHALL stack vertically on mobile and render in a multi-column grid on tablet and above.
6. ALL touch targets (buttons, nav items) SHALL have a minimum height and width of 44px.

---

### Requirement 7: Professional Header

**User Story:** As a user, I want a clean, professional application header, so that the app has a clear identity and primary actions are always accessible.

#### Acceptance Criteria

1. THE App SHALL render a sticky header at the top of the viewport with the application logo, name ("UPI Expense Intelligence"), and primary action button.
2. THE header SHALL remain visible (sticky/fixed) as the user scrolls the main content area.
3. THE header SHALL display a hamburger menu button on viewports narrower than 1024px to toggle the Sidebar drawer.
4. THE header primary action button SHALL open the import/add transaction modal.
5. THE header SHALL have a bottom border separating it from the content area.

---

### Requirement 8: Accessible Color and Contrast

**User Story:** As a user, I want the UI to be readable and accessible, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Design_System SHALL use a light background (white or near-white) as the default page background.
2. THE Design_System SHALL ensure body text color provides sufficient contrast against the page background.
3. THE Design_System SHALL define focus-visible ring styles on all interactive elements (buttons, inputs, links) using the primary accent color.
4. ALL status badges (category, transaction type, budget status, goal status) SHALL use background + foreground color pairs from the Design_System's semantic palette.
5. WHEN a budget is over its limit, THE BudgetManager SHALL render the progress bar and status text in the Design_System's error/danger color.

---

### Requirement 9: Import and Transaction Management Flow

**User Story:** As a user, I want a polished import and transaction management experience, so that adding and editing financial data feels seamless.

#### Acceptance Criteria

1. WHEN the user clicks the primary header action button, THE App SHALL display the import modal with file upload and paste-text options.
2. THE import modal SHALL display a styled drag-and-drop upload zone with an upload icon, label, and supported format hint.
3. WHEN a file is being processed, THE App SHALL display a loading state on the import button with descriptive text.
4. THE TransactionEditModal SHALL be accessible via the Transactions tab for both creating new transactions and editing existing ones.
5. WHEN the user confirms deletion of a transaction, THE App SHALL remove the transaction from state and persist the updated list to `localStorage`.

---

### Requirement 10: Data Persistence and State Management

**User Story:** As a developer, I want reliable data persistence, so that users do not lose their financial data on page refresh.

#### Acceptance Criteria

1. THE App SHALL read transactions, budgets, goals, and recurring transactions from `localStorage` on initial mount.
2. WHEN transactions state changes, THE App SHALL write the updated transactions array to `localStorage` under the key `upi_transactions`.
3. WHEN budgets state changes, THE App SHALL write the updated budgets array to `localStorage` under the key `upi_budgets`.
4. WHEN goals state changes, THE App SHALL write the updated goals array to `localStorage` under the key `upi_goals`.
5. WHEN recurring transactions state changes, THE App SHALL write the updated array to `localStorage` under the key `upi_recurring`.
6. IF no saved transactions exist in `localStorage`, THE App SHALL initialize state with the `SAMPLE_TRANSACTIONS` constant.
