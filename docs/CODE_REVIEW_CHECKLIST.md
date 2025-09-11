# Code Review Checklist for Be Out Project

## Theme Consistency ✅

### Before merging any PR, ensure:

1. **No Hardcoded Colors**
   - [ ] All color values use `theme.palette.*` references
   - [ ] No hardcoded color strings like `"white"`, `"black"`, `"#000"`, `"grey.900"`, etc.
   - [ ] Use `useTheme()` hook when accessing theme values in components
   - [ ] Import: `import { useTheme } from "@mui/material/styles";`

2. **Common Theme References**
   - [ ] Background colors: `theme.palette.background.paper`, `theme.palette.background.default`
   - [ ] Text colors: `theme.palette.text.primary`, `theme.palette.text.secondary`
   - [ ] Primary colors: `theme.palette.primary.main`, `theme.palette.primary.dark`, `theme.palette.primary.light`
   - [ ] Secondary colors: `theme.palette.secondary.main`, etc.
   - [ ] Footer colors: `theme.palette.footer.background`, `theme.palette.footer.text`, `theme.palette.footer.textSecondary`

3. **ESLint Compliance**
   - [ ] No ESLint warnings about hardcoded colors
   - [ ] Run `npm run lint` before committing
   - [ ] Fix any color-related ESLint errors

## Component Standards ✅

4. **MUI Best Practices**
   - [ ] Use `sx` prop for styling instead of inline styles
   - [ ] Prefer theme spacing: `theme.spacing(1)`, `theme.spacing(2)`, etc.
   - [ ] Use theme typography: `theme.typography.h1`, etc. (or MUI Typography variants)

5. **Responsive Design**
   - [ ] Test on mobile, tablet, and desktop
   - [ ] Use breakpoint-based styling when needed
   - [ ] Ensure text is readable on all backgrounds

6. **Status Color Consistency**
   - [ ] Use semantic colors for status pills/chips: `"success"`, `"error"`, `"warning"`, `"info"`, `"default"`
   - [ ] Green (success) for: published, approved, confirmed, active states
   - [ ] Red (error) for: rejected, cancelled, failed, suspended states
   - [ ] Orange (warning) for: revision requested, flagged, needs attention
   - [ ] Blue (info) for: under review, candidate, processing states
   - [ ] Grey (default) for: draft, neutral, inactive states
   - [ ] Avoid custom colors for status indicators - use MUI semantic variants

7. **Publication Logic Consistency**
   - [ ] Separate organizer intent (`organizer_wants_published`) from admin approval (`moderation_status`)
   - [ ] Event visible on frontend only when BOTH organizer wants published AND admin approved
   - [ ] Use clear two-control system: organizer toggle + admin moderation
   - [ ] Avoid confusing mixed states where publication depends on single complex logic

## How to Fix Hardcoded Colors

### ❌ Wrong:
```jsx
<Box sx={{ backgroundColor: "white", color: "black" }}>
<AppBar sx={{ backgroundColor: "grey.900" }}>
<Typography sx={{ color: "#ffffff" }}>
```

### ✅ Correct:
```jsx
const theme = useTheme();

<Box sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }}>
<AppBar sx={{ backgroundColor: theme.palette.footer.background }}>
<Typography sx={{ color: theme.palette.footer.text }}>
```

## Available Theme Colors

### Brand Palette:
- `theme.palette.primary.main` (Orange: #FF5917)
- `theme.palette.primary.dark` (Dark Orange: #E64100)
- `theme.palette.primary.light` (Light Orange: #FF8A50)
- `theme.palette.secondary.main` (Sombre: #140F0B)
- `theme.palette.background.default` (Crème: #FFECE1)
- `theme.palette.background.paper` (White: #FFFFFF)
- `theme.palette.text.primary` (Sombre: #140F0B)
- `theme.palette.text.secondary` (#5D4037)

### Custom Palette:
- `theme.palette.footer.background` (Sombre: #140F0B)
- `theme.palette.footer.text` (Crème: #FFECE1)
- `theme.palette.footer.textSecondary` (Crème with opacity: rgba(255, 236, 225, 0.8))
- `theme.palette.brand.creme` (#FFECE1)
- `theme.palette.brand.orange` (#FF5917)
- `theme.palette.brand.sombre` (#140F0B)

### Semantic Status Colors:
- `"success"` (Green) - Published, approved, confirmed states
- `"error"` (Red) - Rejected, cancelled, failed states
- `"warning"` (Orange) - Revision requested, pending review
- `"info"` (Blue) - Under review, candidate, processing states
- `"default"` (Grey) - Draft, neutral states

## Automated Checks

- ESLint rules are configured to catch hardcoded colors
- VS Code will show warnings for hardcoded color patterns
- CI/CD should run lint checks before deployment

---

💡 **Tip**: When in doubt, always reference `client/src/theme.js` for available color values!
