# Harness IA - Complete Design Overhaul

**Date:** 2026-09-29  
**Status:** APPROVED  
**Priority:** P0 - All dashboard, login, course pages  
**Owner:** Design + Dev Team

---

## Executive Summary

Complete redesign of Harness IA platform following Hotmart Cursos aesthetic with modern tech blue (#0066FF). Focus on interactive, depth-based animations and maximum quality module card imagery. Three phases: Dashboard (priority 1), Login (priority 2), Course/Lesson pages (priority 3).

---

## Design System

### Color Palette (60-30-10 Rule)

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| **Primary Background** | Dark Black | #0F1117 | Main bg, cards bg |
| **Neutral** | White | #FFFFFF | Text, primary CTAs |
| **Accent Primary** | Tech Blue | #0066FF | Buttons, active states, highlights |
| **Accent Hover** | Blue Dark | #0052CC | Hover states, pressed |
| **Accent Subtle** | Blue Light | #E6F0FF | Light backgrounds, badges |
| **Border** | Gray | #2D2D2D | Dividers, card borders |
| **Text Secondary** | Gray | #A0A0A0 | Descriptions, metadata |

### Typography

- **Logo/Headings:** Inter Bold, 32px-48px
- **Module Titles:** Inter Bold, 20px
- **Descriptions:** Inter Regular, 14px
- **Body Text:** Inter Regular, 16px
- **Code:** Fira Code, 13px

### Spacing & Grid

- Base unit: 8px
- Grid: 24px gutters (desktop), 16px (tablet), 12px (mobile)
- Card padding: 24px
- Section margins: 48px

---

## Phase 1: Dashboard (PRIORITY 1)

### Hero Section

```
┌─────────────────────────────────────┐
│ 🎓 Bem-vindo, [Name]               │
│                                     │
│ Você tem 8/11 módulos completos    │
│ [████████░░] 72% de progresso      │
│                                     │
│ [Continuar Último Módulo] [Ver Tudo]│
└─────────────────────────────────────┘
```

- Dark bg, title in white bold
- Progress bar in blue
- CTAs: blue button + text link

### Module Grid

**Layout:**
- Desktop: 3 columns
- Tablet: 2 columns  
- Mobile: 1 column
- Gap: 24px

**Module Card:**

```
┌──────────────────────┐
│  [Module Image]      │  Height: 180px
│  (high quality)      │  Parallax on hover
├──────────────────────┤
│ Module 1: React      │  Bold, white
│ Modern Frontend      │  Gray, normal
│ 6 lessons • 45 hours │  Blue badges
├──────────────────────┤
│ Progress: 4/6 ✓      │  Gray text
├──────────────────────┤
│   [Continue] →       │  Blue button, full width
└──────────────────────┘
```

### Animation: Depth Map Effect

**Behavior:**
- Mouse hover over card → card rises 8px
- Shadow expands: 0 4px 12px → 0 16px 32px
- Card scales: 1.0 → 1.02
- Image inside: parallax shift -2px on Y axis
- Cursor depth: area under cursor "sinks" 3-5px (3D transform)
- Transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1)

**CSS Concept:**
```css
.module-card {
  transition: all 300ms ease-out;
  transform-style: preserve-3d;
}

.module-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 16px 32px rgba(0, 102, 255, 0.15);
}

/* Depth map on cursor move */
.module-card:has(:hover) {
  background: radial-gradient(
    600px at var(--mouse-x) var(--mouse-y),
    rgba(0, 102, 255, 0.08),
    transparent 80%
  );
}
```

### Module Images (11 Required)

Each module gets a unique, high-quality card image:

1. **Module 1: Engineering Foundations** - Blueprint/architecture aesthetic
2. **Module 2: React & Frontend** - Component blocks, modern UI
3. **Module 3: Node.js & Express** - Server/API visual
4. **Module 4: Databases** - Data/SQL visualization
5. **Module 5: Caching & Real-time** - Speed/lightning theme
6. **Module 6: Testing & QA** - Quality/checkmark theme
7. **Module 7: SOLID & Patterns** - Design patterns visual
8. **Module 8: System Design** - Large-scale architecture
9. **Module 9: DevOps & Containerization** - Containers/deployment
10. **Module 10: Claude AI Integration** - AI/neural theme
11. **Module 11: Capstone Project** - Graduation/trophy theme

**Image Specs:**
- Dimensions: 640x360px (16:9)
- Format: PNG or WebP
- Style: Illustrated, tech-focused, professional
- Color: Must include the blue accent (#0066FF) subtly
- Text overlay: Optional module number/icon
- Quality: Maximum (no compression artifacts)

---

## Phase 2: Login Page (PRIORITY 2)

### Layout

```
┌─────────────────────────────────────┐
│ [Gradient Blue Header]              │
│ Harness IA                          │
│ Learn engineering with an AI tutor  │
│                                     │
│  [Email input - blue border focus]  │
│  [Password input - blue border]     │
│  [Remember me] [Forgot password?]   │
│                                     │
│  [Login Button - Blue, hover scale] │
│  Don't have account? [Sign up]      │
└─────────────────────────────────────┘
```

### Components

**Header:**
- Gradient: #0066FF → #0052CC (top to bottom)
- Logo white, tagline white

**Inputs:**
- Background: #1A1A1A
- Border: #2D2D2D (normal), #0066FF (focus)
- Border radius: 8px
- Padding: 12px 16px
- Focus: shadow 0 0 0 3px rgba(0, 102, 255, 0.1)

**Button:**
- Background: #0066FF
- Hover: scale(1.02), background #0052CC
- Active: scale(0.98)
- Transition: 200ms

**Links:**
- Color: #0066FF
- Hover: #0052CC, underline

### Animations

- Form fade-in: 400ms on load
- Input focus: border color + subtle shadow
- Button hover: scale + color shift
- Error message: slide-in from top, red (#FF4444)

---

## Phase 3: Course & Lesson Pages (PRIORITY 3)

### Layout

```
┌─────────────────────────────────────────┐
│ [Sidebar: Module Index]  [Content]      │
│ Module 1                 Lesson 1.1      │
│  ✓ 1.1 Engineering      Title (Bold)    │
│  → 1.2 Claude Code                      │
│  ○ 1.3 Git              [Content blocks]│
│  ○ 1.4 Dev Setup        - Text          │
│                         - Code block    │
│ [Progress bar]          - Image         │
│                         - Quiz card     │
│                         [Next lesson]   │
└─────────────────────────────────────────┘
```

### Components

**Sidebar:**
- Width: 280px (desktop), collapsible (mobile)
- Active lesson: blue bg + blue text bold
- Completed: checkmark in blue
- Hover: bg #1A1A1A

**Content Area:**
- Max width: 900px
- Line height: 1.8 (readability)
- Code blocks: dark bg (#1A1A1A), syntax highlight
- Images: 100% width, border radius 8px, border #2D2D2D
- Quotes: left border blue (4px), padding 16px

**Quiz/Exercise Cards:**
- Border: 1px #2D2D2D
- Title: bold blue
- Options/inputs: border blue on focus
- Submit button: blue

### Animations

- Sidebar active: smooth color transition
- Content fade-in: 300ms
- Code block: syntax highlight on hover
- Quiz reveal: staggered fade-in of options

---

## Responsive Breakpoints

| Device | Width | Columns | Adjustments |
|--------|-------|---------|-------------|
| Mobile | < 640px | 1 | Full-width cards, no parallax |
| Tablet | 640-1024px | 2 | Sidebar slides under on small tablets |
| Desktop | > 1024px | 3 | Full layout, parallax enabled |

---

## Performance & Quality

- Module images: optimize with WebP + fallback PNG
- Animations: use transform + opacity only (GPU accelerated)
- No glow/blur effects (as specified)
- Test depth-map on 60Hz+ displays
- Mobile: disable parallax, keep scale + shadow only

---

## Implementation Order

1. **Setup design tokens** (colors, spacing, fonts)
2. **Create reusable components** (Button, Card, Input, Badge)
3. **Build Dashboard** with module grid + depth animations
4. **Create module card images** (11 unique designs)
5. **Build Login page** with gradient header
6. **Build Course/Lesson layout** with sidebar
7. **Test responsiveness** across breakpoints
8. **Performance & polish** (animations, hover states)
9. **Accessibility audit** (WCAG AA)
10. **Deploy to production**

---

## Success Criteria

✅ Dashboard loads in < 2 seconds  
✅ All animations 60fps (no jank)  
✅ Depth-map effect works on desktop  
✅ Mobile responsive & functional  
✅ All buttons clickable & interactive  
✅ 11 module images high-quality  
✅ Dark mode consistent across all pages  
✅ WCAG AA accessibility pass  
✅ User can login → access dashboard → view courses  

---

## Notes

- Blue accent (#0066FF) is the hero color - use sparingly for impact
- 60% dark base keeps focus on content
- 30% white provides contrast & readability
- 10% blue creates focal points
- Depth animations create "expensive" feel without glow artifacts
