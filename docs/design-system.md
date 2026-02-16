# FinTrack - Design System

**Inspired by:** [MatDash Template](https://matdash-nextjs-main.vercel.app/)  
**Live Reference:** https://matdash-nextjs-main.vercel.app/  
**Purpose:** Modern, glossy dark mode financial dashboard with premium feel  
**Platforms:** Web (Next.js) + Mobile (Flutter)  
**Design Style:** Dark Mode + Glassmorphism + Vibrant Colors + Smooth Animations

---

## ✨ Glossy Design Philosophy

**Core Principles:**

- **Glassmorphism:** Semi-transparent backgrounds with blur effects
- **Depth:** Layered shadows and highlights for 3D feel
- **Gradients:** Subtle color transitions for vibrancy
- **Reflections:** Light reflective surfaces on cards and buttons
- **Premium Feel:** High-polish, modern dark aesthetic

---

## 🎨 Dark Mode Color Palette

### **Primary Colors**

- **Primary:** `#7C7AFF` - Vibrant Indigo (buttons, accents)
- **Primary Light:** `#9694FF` - Hover states
- **Primary Dark:** `#5D5BDD` - Active states

### **Semantic Colors**

- **Success:** `#00D9A5` - Teal (positive trends)
- **Error:** `#FF6B6B` - Coral (over budget)
- **Warning:** `#FFB020` - Amber (pending)
- **Info:** `#579DFF` - Blue (informational)

### **Dark Backgrounds**

- **Background:** `#0F0F14` - Deep dark
- **Elevated:** `#18181D` - Raised surfaces
- **Surface:** `#1C1C23` - Cards, panels
- **Surface Hover:** `#25252D` - Hover state

### **Borders & Dividers**

- **Border:** `#2C2C35` - Subtle borders
- **Border Light:** `#3A3A45` - Lighter borders
- **Divider:** `#25252D` - Divider lines

### **Text Colors**

- **Primary:** `#FFFFFF` - Headings
- **Secondary:** `#B4B4C0` - Body text
- **Tertiary:** `#8B8B98` - Captions
- **Disabled:** `#5A5A68` - Disabled/placeholders

---

## ✍️ Typography

**Font Family:** Manrope, Inter, -apple-system  
**Download:** [Google Fonts - Manrope](https://fonts.google.com/specimen/Manrope)

### **Type Scale**

- **H1:** 32px / Bold (700) / -0.5px spacing
- **H2:** 24px / Bold (700) / -0.3px
- **H3:** 20px / Semibold (600) / -0.2px
- **H4:** 18px / Semibold (600)
- **Body Large:** 16px / Medium (500)
- **Body:** 14px / Regular (400)
- **Body Small:** 13px / Regular (400)
- **Caption:** 12px / Regular (400)
- **Overline:** 11px / Semibold (600) / 0.5px (uppercase)

---

## 📦 Component Styles

### **Cards (Dark Mode)**

- Background: Linear gradient `#1C1C23` → `#18181D`
- Border: 1px solid `rgba(255, 255, 255, 0.05)`
- Border Radius: 16px
- Shadow: Deep shadow + subtle inner highlight
- Padding: 24px

**Variants:**

- **Stat Card:** Gradient background with colored accent
- **Chart Card:** Header + content with subtle divider
- **Glassmorphism Hero:** Semi-transparent dark with backdrop blur

---

### **Buttons (Dark Mode)**

- Background: Gradient `#7C7AFF` → `#635BDD`
- Border Radius: 10px
- Padding: 12px 24px
- Shadow: Glow effect `rgba(124, 122, 255, 0.5)`
- Hover: Enhanced glow + slight lift

**Types:**

- **Primary:** Gradient background + glow
- **Secondary (Ghost):** Transparent + border + blur
- **Hover:** translateY(-2px) + increased glow

---

### **Input Fields (Dark Mode)**

- Background: Semi-transparent dark `rgba(28, 28, 35, 0.6)`
- Border: `rgba(255, 255, 255, 0.1)`
- Backdrop Filter: blur(10px)
- Focus: Primary color border + enhanced background

---

### **Navigation (Sidebar - Dark)**

- Background: Gradient `#18181D` → `#0F0F14`
- Width: 270px
- Border: Right border `rgba(255, 255, 255, 0.05)`
- Menu Items: Rounded, subtle hover
- Active: Gradient background + glow shadow

---

## ✨ Glossy Effects

### **Glassmorphism Cards**

- Background: Semi-transparent gradient
- Backdrop blur: 20px
- Border: Subtle white border
- Shadow: Deep + outer glow
- Usage: Hero cards, modals

### **Glossy Buttons**

- Gradient background
- Inner highlight (top edge)
- Outer glow
- Shine animation on hover

### **Gradient Overlays**

**Variations:**

- Primary: `#7C7AFF` → `#635BDD`
- Success: `#00D9A5` → `#00BF8F`
- Error: `#FF6B6B` → `#FF5252`
- Warning: `#FFB020` → `#FF9500`

### **Animations**

- Transition: `0.3s cubic-bezier(0.4, 0, 0.2, 1)`
- Hover: translateY(-2px) + enhanced shadow
- Active: translateY(0) + reduced shadow

---

## 📐 Spacing System

**4px Grid:**

- Space 1: 4px
- Space 2: 8px
- Space 3: 12px
- Space 4: 16px
- Space 5: 20px
- Space 6: 24px
- Space 8: 32px
- Space 10: 40px
- Space 12: 48px
- Space 16: 64px

**Usage:**

- Card padding: 24px
- Section gaps: 20px
- Element spacing: 16px
- Small gaps: 12px

---

## 📊 Chart Styles

### **Line Charts**

- Smooth curves (no sharp angles)
- Gradient fill beneath lines (20% opacity)
- 2-3px line thickness
- Colors: Primary, Error, Success

### **Bar Charts**

- Rounded tops (4px radius)
- Subtle gradient fill
- 12px spacing between bars

### **Donut/Pie Charts**

- Thick stroke (20-30px width)
- Sequential color palette
- Large bold center numbers

---

## 🎯 FinTrack Design Patterns

### **Dashboard Layout**

```
┌─────────────────────────────────────────┐
│  Glassmorphism Welcome Card (Hero)      │
│  • User greeting                         │
│  • Current balance (large)               │
│  • Monthly budget (secondary)            │
└─────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬─────────┐
│ Income   │ Expenses │ Budget   │ Savings │
│ $X,XXX   │ $X,XXX   │ XX%      │ $X,XXX  │
│ ↑ +12%   │ ↓ -5%    │ On track │ ↑ +8%   │
└──────────┴──────────┴──────────┴─────────┘

┌─────────────────────┬──────────────────────┐
│ Spending by         │ Recent Transactions  │
│ Category (Chart)    │ (List)               │
└─────────────────────┴──────────────────────┘
```

### **Transaction List Item**

- Icon (category) + Title + Amount
- Subtitle: Category + Date
- Right-aligned amount with color coding

### **Stat Card Pattern**

- Colored icon (rounded background)
- Label (secondary text)
- Large value (bold, primary)
- Trend indicator (+12% ↑)
- Optional: "View Details" link

---

## 📱 Mobile Adaptations (Flutter)

**Bottom Navigation:**

- Background: Dark surface
- Selected: Primary color
- Unselected: Secondary text color
- Elevation: 8

**Card on Mobile:**

- Padding: 16px (vs 24px web)
- Border Radius: 12 px (vs 16px web)
- Same shadows and effects

---

## 🖼️ Design References

### **MatDash Dashboard Examples**

![MatDash Dashboard 1 - Hero Card and Charts](file:///Users/admin/.gemini/antigravity/brain/8fe6d6ac-455a-4c76-9d15-025bb47b58d1/matdash_dashboard1_top_1770734253297.png)
_Reference: Glassmorphism hero card, smooth line charts, stat cards_

![MatDash Dashboard 3 - Metric Cards](file:///Users/admin/.gemini/antigravity/brain/8fe6d6ac-455a-4c76-9d15-025bb47b58d1/matdash_dashboard3_top_1770734490287.png)
_Reference: Colored icon stat cards, clean spacing, rounded corners_

---

## 🎨 Tailwind Config (Dark Mode)

See `stripe-integration-guide.md` for code implementation details.

**Key Customizations:**

- Dark mode colors (background, surface, text)
- Primary color variants
- Semantic colors (success, error, warning)
- Custom shadows (card, glossy, glossy-hover)
- Gradient utilities (primary, success, error, warning)
- Backdrop blur utilities
- Border radius tokens (card, button, glossy)

---

## 🎨 Flutter Theme (Dark Mode)

See `stripe-integration-guide.md` for code implementation details.

**Key Customizations:**

- Dark color scheme
- Primary/secondary colors
- Card theme with borders
- Text theme with proper colors
- Elevated button styling
- Custom shadows and elevations

---

## ✅ Implementation Checklist

**Week 1, Day 2:**

- [ ] Install Manrope font (web + mobile)
- [ ] Set up Tailwind config with dark mode colors
- [ ] Create Flutter Dark ThemeData
- [ ] Test color consistency across platforms
- [ ] Build sample glossy card component

**Week 2:**

- [ ] Create reusable dark card components
- [ ] Build dark navigation (sidebar + bottom nav)
- [ ] Implement glossy stat card pattern
- [ ] Test glassmorphism effects
- [ ] Verify responsive spacing

---

**Reference this design system when building FinTrack!** 🚀🌙
