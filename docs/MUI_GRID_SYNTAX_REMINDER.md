# Material-UI Grid Syntax - IMPORTANT NOTE

## ⚠️ CRITICAL REMINDER: Modern Grid Syntax Required

This project uses **Material-UI v7+** which requires the **modern Grid2 syntax**.

### ❌ OLD SYNTAX (DO NOT USE)

```jsx
<Grid container spacing={2}>
    <Grid item xs={12} sm={6} md={4}>
        <Component />
    </Grid>
</Grid>
```

### ✅ CORRECT SYNTAX (ALWAYS USE)

```jsx
<Grid container spacing={2}>
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <Component />
    </Grid>
</Grid>
```

## Key Changes

- **Remove** `item` prop entirely
- **Replace** `xs={value}` with `size={{ xs: value }}`
- **Use** object syntax for all breakpoints: `size={{ xs: 12, sm: 6, md: 4 }}`

## Import Statement

```jsx
import { Grid } from "@mui/material";
// NOT: import Grid2 from "@mui/material/Grid2";
```

## Why This Matters

- The old syntax generates console warnings
- It affects performance and development experience
- MUI v7+ has deprecated the old Grid API

## Project History

This issue has occurred multiple times in this project. Please check this file before using Grid components to avoid repeating the same mistake.

### Fixed Files

- ✅ `admin-client/src/components/EmailTemplateManager.jsx` - Fixed all Grid components (December 2024)

### Remaining Files to Fix

- ⚠️ `admin-client/src/pages/AdminTranslations.jsx` - Still uses deprecated Grid syntax

---

**Last Updated:** December 2024
**Status:** Active - Please follow modern syntax
