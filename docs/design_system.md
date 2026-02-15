# Design System: Obsidian Silver

**Obsidian Silver** is the visual soul of Fintrack. It is a high-fidelity design system engineered to evoke the precision of high-frequency trading terminals—combining deep, matte obsidian surfaces with sharp, metallic silver strokes.

---

## 💎 I. Foundations (The Token Layer)

### 1. The Palette (Layered Dark)

We use a **Semantic HSL** strategy. Every color has a specific purpose, preventing "magic number" hex codes in the codebase.

| Token        | Role         | HSL            | Hex       | Usage                      |
| :----------- | :----------- | :------------- | :-------- | :------------------------- |
| **Obsidian** | `Background` | `220 20% 4%`   | `#05070A` | App background (The Void). |
| **Ghost**    | `Surface`    | `220 15% 8%`   | `#0B0D11` | Cards, Modals, Lists.      |
| **Silver**   | `Border`     | `0 0% 89%`     | `#E2E2E2` | Borders, Icons, Dividers.  |
| **Muted**    | `Secondary`  | `220 10% 40%`  | `#5C6470` | Subtitles, Captions.       |
| **Glow**     | `Primary`    | `210 100% 50%` | `#007AFF` | CTAs, Selected States.     |
| **Mint**     | `Success`    | `150 100% 45%` | `#00E676` | Income, Positive Trends.   |
| **Crimson**  | `Danger`     | `340 85% 60%`  | `#FF3B6F` | Expense, Debt, Alerts.     |
| **Amber**    | `Warning`    | `35 90% 60%`   | `#FFB03B` | Pending Actions.           |

### 2. Typography (The "Manrope-Inter" Duo)

We pair **Inter** (Web) and **Manrope** (Mobile) for maximum legibility on digital screens.

| Level | Weight | Size (Rem/Pxl) | Tracking | Usage |
| :---- | :----- | :------------- | :------- | :---- |

**Obsidian Silver** is the visual operating system of Fintrack. It is engineered to feel less like a "website" and more like a high-frequency trading terminal crafted from physical materials. It combines the weight of matte obsidian with the precision of machined silver.

---

## 💎 I. Primitives (The Atoms)

### 1. Color Palette (Semantic HSL)

We rely on a **Semantic Layering** strategy. We do not use "Blue" or "Red"; we use "Glow" and "Accents."

| Token        | Role         | HSL            | Hex       | Usage                              |
| :----------- | :----------- | :------------- | :-------- | :--------------------------------- |
| **Obsidian** | `Bg-Base`    | `220 20% 4%`   | `#05070A` | The absolute void. App background. |
| **Ghost**    | `Bg-Surface` | `220 15% 8%`   | `#0B0D11` | Cards, Modals, Sidebars.           |
| **Silver**   | `Border`     | `0 0% 89%`     | `#E2E2E2` | Borders, Icons, 1px Dividers.      |
| **Muted**    | `Text-Sec`   | `220 10% 40%`  | `#5C6470` | Labels, Captions, Inactive Icons.  |
| **Glow**     | `Primary`    | `210 100% 50%` | `#007AFF` | Primary Buttons, Active States.    |
| **Mint**     | `Success`    | `150 100% 45%` | `#00E676` | Income flows, positive deltas.     |
| **Crimson**  | `Danger`     | `340 85% 60%`  | `#FF3B6F` | Expenses, Debts, Errors.           |
| **Amber**    | `Warning`    | `35 90% 60%`   | `#FFB03B` | Pending states, alerts.            |

### 2. Typography (The "Manrope-Inter" Stack)

**Web**: _Inter_ (Variable). **Mobile**: _Manrope_ (Geometric).

| Role        | Weight         | Size (Web/Mob)  | Line Height | Tracking  | Usage             |
| :---------- | :------------- | :-------------- | :---------- | :-------- | :---------------- |
| **Display** | Bold (700)     | `40px` / `32px` | `110%`      | `-0.02em` | Main Balance.     |
| **Title 1** | SemiBold (600) | `24px` / `24px` | `120%`      | `-0.01em` | Page Headers.     |
| **Title 2** | Medium (500)   | `20px` / `20px` | `130%`      | `-0.01em` | Card Headers.     |
| **Body**    | Regular (400)  | `16px` / `16px` | `150%`      | `0`       | Standard flow.    |
| **Caption** | Medium (500)   | `14px` / `13px` | `140%`      | `0.01em`  | Metadata.         |
| **Mono**    | Regular (400)  | `13px` / `13px` | `140%`      | `0`       | Wallet Keys, IDs. |

### 3. Spacing (The 4px Grid)

We use a strict **4pt Grid** system. All margins, paddings, and sizes must be multiples of 4.

| Token        | Value  | Rem       | Usage                        |
| :----------- | :----- | :-------- | :--------------------------- |
| **Space-1**  | `4px`  | `0.25rem` | Tight icons, dense grouping. |
| **Space-2**  | `8px`  | `0.5rem`  | Component internal padding.  |
| **Space-3**  | `12px` | `0.75rem` | Stack spacing (tight).       |
| **Space-4**  | `16px` | `1rem`    | Standard card padding.       |
| **Space-6**  | `24px` | `1.5rem`  | Section gaps.                |
| **Space-8**  | `32px` | `2rem`    | Layout columns.              |
| **Space-12** | `48px` | `3rem`    | Major page sections.         |

### 4. Radii (Corner Physics)

Fintrack is modern but not "bubbly." We use tighter radii to maintain a serious financial tone.

| Token           | Value   | Usage                            |
| :-------------- | :------ | :------------------------------- |
| **Radius-SM**   | `4px`   | Checkboxes, Tags, Tiny Elements. |
| **Radius-MD**   | `8px`   | Buttons, Inputs, Inner Cards.    |
| **Radius-LG**   | `16px`  | Main Cards, Modals, Sheets.      |
| **Radius-Full** | `999px` | Avatars, Pills.                  |

---

## 🔮 II. Surface Physics (The Material)

The "Obsidian Silver" aesthetic is defined by how light interacts with surfaces. We do not use flat colors; we use physics.

### 1. The Silver Surface (Glass Card)

Used for 80% of the UI (Transaction lists, Settings, Details).

- **Fill**: `HSLA(220, 15%, 8%, 0.6)` (Ghost with opacity)
- **Blur**: `backdrop-filter: blur(12px)`
- **Border**: `1px solid HSLA(0, 0%, 100%, 0.1)` (Subtle rim)
- **Highlight**: `box-shadow: inset 0 1px 0 0 HSLA(0, 0%, 100%, 0.05)` (Top lip catch)

### 2. The Elevation System (Shadows)

We use shadows to create Z-axis hierarchy in the dark.

| Level   | Shadow Value                  | Usage                  |
| :------ | :---------------------------- | :--------------------- |
| **Z-0** | None                          | Background.            |
| **Z-1** | `0 4px 12px rgba(0,0,0,0.4)`  | Standard Cards.        |
| **Z-2** | `0 8px 24px rgba(0,0,0,0.6)`  | Dropdowns, Popovers.   |
| **Z-3** | `0 24px 48px rgba(0,0,0,0.8)` | Modals, Bottom Sheets. |

---

## 🧩 III. Components (The Molecules)

### 1. Iconography

- **Set**: [Lucide Icons](https://lucide.dev) (Web) / Cupertion + Material (Mobile).
- **Style**: Stroked (Outline).
- **Stroke Width**: `1.5px` (Consistent delicate weight).
- **Size**: Standard is `20px` inside a `32px` touch target.

### 2. Buttons (The "Trigger")

- **Height**: `40px` (Space-10).
- **Padding**: `0 16px` (Space-4).
- **Primary**: Glow Background + White Text + Shadow Z-1.
- **Secondary**: Ghost Background + Silver Border + Silver Text.

### 3. Inputs (The "Vault")

- **Background**: Ghost (Solid).
- **Border**: `1px solid Silver-15%`.
- **Focus**: Border turns to `Glow` + `0 0 0 2px Glow-20%` (Ring).

---

## 📐 IV. Layout & Grid

### 1. Breakpoints

| Device      | Scale | Width (px)   |
| :---------- | :---- | :----------- |
| **Mobile**  | `xs`  | `< 480`      |
| **Tablet**  | `md`  | `480 - 1024` |
| **Desktop** | `xl`  | `> 1024`     |

### 2. The Grid

- **Mobile**: 4 Columns, 16px Margin, 16px Gutter.
- **Desktop**: 12 Columns, Max-width 1200px, 32px Gutter.

---

## ⚡ V. Motion (The Kinetic Feel)

Financial data should feel "live" but stable.

| Token        | Time    | Ease                         | Usage                   |
| :----------- | :------ | :--------------------------- | :---------------------- |
| **Fast**     | `150ms` | `ease-out`                   | Hover states, Toggles.  |
| **Standard** | `300ms` | `ease-in-out`                | Modal open, Page slide. |
| **Slow**     | `500ms` | `cubic-bezier(0.2, 0, 0, 1)` | Complex layout shifts.  |

---

## 💻 VI. Platform Enforcement

### Web (`globals.css`)

```css
:root {
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-4: 1rem;

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* Colors */
  --obsidian: hsl(220, 20%, 4%);
  --silver: hsl(0, 0%, 89%);
}
```

### Mobile (`theme/dimens.dart`)

```dart
class AppDimens {
  static const double space1 = 4.0;
  static const double space2 = 8.0;
  static const double space4 = 16.0;

  static const double radiusSm = 4.0;
  static const double radiusMd = 8.0;
  static const double radiusLg = 16.0;
}
```
