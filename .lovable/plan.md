

# Plan: Complete Mobile-First UI Overhaul for Play Store Release

This plan covers making every page look and feel like a proper Android mobile application with correct padding, text wrapping, navigation, a splash/loading screen, and offline support.

---

## Scope of Changes

### 1. App Shell & Loading Screen
**File:** `src/App.tsx`, new `src/components/SplashScreen.tsx`
- Add a branded splash screen (GeniusLab logo + spinner) that shows while the app initializes and checks auth state
- This gives users a proper "app launch" feel instead of a blank white screen

### 2. Global Mobile CSS & Safe Area Padding
**File:** `src/index.css`
- Add `env(safe-area-inset-bottom)` padding to account for Android/iOS navigation bars
- Increase bottom padding on all pages from `pb-16` to `pb-20` to clear the bottom nav properly
- Add a global `.mobile-page` utility class with consistent `px-4 pt-16 pb-24` spacing
- Ensure footer has extra bottom padding so content is never hidden behind the bottom nav

### 3. Bottom Navigation Polish
**File:** `src/components/MobileBottomNav.tsx`
- Add `safe-area-inset-bottom` padding so the nav doesn't overlap the Android gesture bar
- Slightly increase nav height and icon/text sizes for better tap targets (48px minimum)

### 4. Navbar Mobile Fix
**File:** `src/components/Navbar.tsx`
- Reduce logo size on mobile to prevent overflow
- Ensure the navbar height is consistent (`h-14`) and content is properly centered

### 5. Page-by-Page Mobile Polish

**Index (`src/pages/Index.tsx`)**:
- Hero section: reduce `min-h-[80vh]` to `min-h-[70vh]` on mobile for less scrolling
- Stats grid: ensure `grid-cols-2` gaps are tight (`gap-3`) on mobile
- CTA buttons: full-width stacking on mobile with proper spacing
- FAQ details: add proper padding

**Exam (`src/pages/Exam.tsx`)**:
- Category cards: ensure proper card padding and text wrapping for long subject names
- Subject list items: stack badges vertically on small screens

**ExamTaking (`src/pages/ExamTaking.tsx`)**:
- Sticky header: reduce padding, use smaller text on mobile
- Question card: ensure proper padding (`p-4`) and readable font size
- Navigation grid: keep `grid-cols-5` on mobile (already done), ensure button sizes are finger-friendly
- Bottom nav clearance with `pb-24`

**ExamResults (`src/pages/ExamResults.tsx`)**:
- Add `pb-24` for bottom nav clearance
- Stats grid on mobile: ensure 2-column layout has proper gaps
- Explanation text: already has `whitespace-pre-line break-words` (fixed in last edit)

**Profile (`src/pages/Profile.tsx`)**:
- Stats grid `grid-cols-2 sm:grid-cols-5`: on mobile show 2 columns with the 5th stat wrapping to next row
- Leaderboard table: wrap in horizontal scroll on mobile
- Already has good mobile layout with `max-w-2xl`

**Payment (`src/pages/Payment.tsx`)**:
- Card padding consistency
- PIN input and button sizing for mobile

**Auth (`src/pages/Auth.tsx`)**:
- Already card-based, ensure proper mobile padding
- Input fields should have larger touch targets

**Services, About, Contact**:
- Hero sections: reduce vertical padding on mobile (`py-12` instead of `py-20`)
- Card grids: ensure single column on small mobile

**Admin (`src/pages/Admin.tsx`)**:
- Tabs already made scrollable in last edit -- verify and ensure all tab content cards have proper mobile padding
- All form inputs, tables, and lists need `min-w-0` and `break-words`

**JambExam (`src/pages/JambExam.tsx`)**:
- Subject tabs: ensure scrollable horizontal layout
- Question display: proper padding and readable text
- Calculator modal: full-screen on mobile

**NotFound (`src/pages/NotFound.tsx`)**:
- Add bottom nav clearance

### 6. Footer Mobile Fix
**File:** `src/components/Footer.tsx`
- Increase bottom padding from `pb-20` to `pb-24` to fully clear the bottom nav
- Ensure grid stacks properly on mobile (already `grid-cols-1 md:grid-cols-4`)

### 7. Offline Support (PWA Basics for Capacitor)
**File:** `index.html`
- Add `<meta name="mobile-web-app-capable" content="yes">` and `<meta name="apple-mobile-web-app-capable" content="yes">` meta tags
- Add Android theme color meta tag
- These are needed for proper Capacitor WebView behavior

**File:** `capacitor.config.ts`
- Ensure the config is production-ready (no server block for production, only for dev)

### 8. Android Manifest Considerations
Since the user is building via Android Studio, we provide guidance on:
- `INTERNET` and `ACCESS_NETWORK_STATE` permissions (for ads and data)
- No additional code changes needed -- Capacitor handles this

---

## Summary

| Area | Files Modified | Impact |
|------|---------------|--------|
| Splash screen | `App.tsx` + new component | App launch feel |
| Global CSS | `index.css` | Safe areas, consistent spacing |
| Bottom nav | `MobileBottomNav.tsx` | Safe area insets |
| All pages | ~12 page files | Proper mobile padding/wrapping |
| Footer | `Footer.tsx` | Bottom nav clearance |
| HTML meta | `index.html` | Android app meta tags |

Total: ~14 files modified, focusing on CSS/layout adjustments across every page to ensure a polished Play Store-ready mobile experience.

