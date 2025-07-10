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

### Standard Palette:
- `theme.palette.primary.main` (Blue: #0288d1)
- `theme.palette.secondary.main` (Yellow: #FFCC00)
- `theme.palette.background.default` (#fafafa)
- `theme.palette.background.paper` (white: #ffffff)
- `theme.palette.text.primary` (#212121)
- `theme.palette.text.secondary` (#757575)

### Custom Footer Palette:
- `theme.palette.footer.background` (Blue: #0288d1)
- `theme.palette.footer.text` (White: #ffffff)
- `theme.palette.footer.textSecondary` (White with opacity: rgba(255, 255, 255, 0.8))

## Automated Checks

- ESLint rules are configured to catch hardcoded colors
- VS Code will show warnings for hardcoded color patterns
- CI/CD should run lint checks before deployment

---

💡 **Tip**: When in doubt, always reference `client/src/theme.js` for available color values!
