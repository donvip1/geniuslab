# GeniusLab Educational Consult — Full Project Structure

## 🌐 Overview

GeniusLab is an educational platform offering Computer-Based Test (CBT) practice for Nigerian students across multiple exam categories (JAMB, WAEC, NECO, NABTEB, University CBT). It includes a public-facing website, student dashboard, payment/subscription system, and a full admin dashboard.

---

## 📁 Project File Structure

```
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   ├── sitemap.xml
│   └── google04f5b414c43bba73.html   # Google verification
│
├── src/
│   ├── assets/                        # Static images (logos, profiles, reviews)
│   │   ├── gec-logo-new.png
│   │   ├── fuoye-logo.jpeg
│   │   ├── waec-logo.png, neco-logo.png, nabteb-logo.png, jamb-logo.webp
│   │   ├── review-*.jpg               # Student review photos
│   │   ├── *-profile.jpg              # Team expert profile photos
│   │   └── tutorial-class-*.jpg       # Tutorial class images
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui components (40+ files)
│   │   ├── admin/                     # Admin dashboard modules (see below)
│   │   ├── Navbar.tsx                 # Main navigation bar
│   │   ├── MobileBottomNav.tsx        # Mobile bottom tab navigation
│   │   ├── Footer.tsx                 # Site footer
│   │   ├── SubscriptionGate.tsx       # Access control wrapper (VIP/subscription check)
│   │   ├── AdvertisementPopup.tsx     # Ad popups
│   │   ├── ExamCompletionPopup.tsx    # Post-exam results popup
│   │   ├── ExamLockedScreen.tsx       # Locked exam display
│   │   ├── FounderWelcomePopup.tsx    # Welcome message from founder
│   │   ├── GoogleAdSense.tsx          # AdSense integration
│   │   ├── PinEntryScreen.tsx         # PIN activation screen
│   │   ├── ScientificCalculator.tsx   # In-exam calculator
│   │   ├── SemesterToggle.tsx         # Semester filter toggle
│   │   ├── SEOHead.tsx                # Dynamic SEO meta tags
│   │   ├── TestimonialsCarousel.tsx   # Student testimonials slider
│   │   ├── UniversitySelector.tsx     # University picker dropdown
│   │   ├── UserRestrictedScreen.tsx   # Restricted user display
│   │   ├── YearSelector.tsx           # Year filter selector
│   │   ├── ExpandableText.tsx         # Read more/less text
│   │   ├── NavLink.tsx                # Navigation link component
│   │   └── PageTracker.tsx            # Page view analytics tracker
│   │
│   ├── pages/
│   │   ├── Index.tsx                  # Landing / Home page
│   │   ├── About.tsx                  # About GeniusLab
│   │   ├── Services.tsx               # Services offered
│   │   ├── Contact.tsx                # Contact page
│   │   ├── Auth.tsx                   # Login / Sign Up
│   │   ├── ResetPassword.tsx          # Password reset
│   │   ├── Profile.tsx                # User profile & stats
│   │   ├── Exam.tsx                   # Exam category selection
│   │   ├── ExamTaking.tsx             # Active exam interface
│   │   ├── ExamResults.tsx            # Exam results & review
│   │   ├── JambExam.tsx               # JAMB-specific exam page
│   │   ├── JambStudyMaterial.tsx       # JAMB study materials
│   │   ├── ApiExam.tsx                # API-sourced exam questions
│   │   ├── Payment.tsx                # Payment & subscription page (Paystack + PIN)
│   │   ├── Admin.tsx                  # Admin dashboard (protected)
│   │   └── NotFound.tsx               # 404 page
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx             # Mobile device detection
│   │   ├── use-toast.ts               # Toast notification hook
│   │   └── usePageTracking.ts         # Page view tracking hook
│   │
│   ├── integrations/supabase/
│   │   ├── client.ts                  # Supabase client (auto-generated)
│   │   └── types.ts                   # Database types (auto-generated)
│   │
│   ├── lib/
│   │   ├── utils.ts                   # Utility functions (cn, etc.)
│   │   └── questionValidator.ts       # Question data validation
│   │
│   ├── App.tsx                        # Root app with routing
│   ├── App.css                        # Global app styles
│   ├── index.css                      # Tailwind + design tokens
│   ├── main.tsx                       # Entry point
│   └── vite-env.d.ts                  # Vite type declarations
│
├── supabase/
│   ├── config.toml                    # Supabase project config
│   └── functions/                     # Edge Functions (backend)
│       ├── paystack-initialize/       # Initialize Paystack payment
│       ├── paystack-webhook/          # Paystack webhook handler
│       ├── verify-paystack-payment/   # Direct Paystack payment verification
│       ├── verify-veezee-pin/         # VeeZee PIN verification
│       ├── jamb-questions/            # Fetch JAMB questions from API
│       ├── sync-questions/            # Sync questions to database
│       ├── bulk-fetch-questions/      # Bulk question fetching
│       ├── process-bulk-questions/    # Process bulk question imports
│       ├── extract-past-questions/    # Extract questions from documents
│       ├── process-document/          # Document processing (OCR/parse)
│       └── submit-exam/              # Submit and grade exam
│
├── capacitor.config.ts               # Capacitor mobile app config
├── tailwind.config.ts                # Tailwind CSS configuration
├── vite.config.ts                    # Vite build configuration
├── tsconfig.json                     # TypeScript config
└── package.json                      # Dependencies & scripts
```

---

## 🗄️ Database Schema (Lovable Cloud)

| Table | Purpose |
|---|---|
| `profiles` | User profile info (name, email, username) |
| `user_roles` | Role-based access (admin, student) |
| `user_restrictions` | Banned/restricted users |
| `exam_categories` | Exam types (JAMB, WAEC, NECO, NABTEB, University CBT) |
| `subjects` | Subjects within categories (with level, semester, department) |
| `questions` | Question bank (question, options A-D, correct answer, explanation) |
| `questions_public` | Public view of questions (excludes correct answers) |
| `cached_api_questions` | Cached questions from external APIs |
| `exam_attempts` | Student exam history (score, answers, time) |
| `exam_settings` | Global exam config (duration, lock status, PIN requirement) |
| `subscription_plans` | Active subscriptions (user, category, expiry) |
| `payment_transactions` | Payment records (Paystack references) |
| `access_pins` | Activation PINs (for manual payment) |
| `pin_batches` | PIN batch management |
| `pin_generator_settings` | PIN generator password |
| `user_trials` | Trial usage tracking |
| `advertisements` | Ad content management |
| `ad_clicks` | Ad click tracking |
| `success_stories` | Student testimonials |
| `team_experts` | Team member profiles |
| `nigerian_universities` | University directory |
| `document_uploads` | Uploaded documents for question extraction |
| `page_views` | Analytics page view tracking |
| `admin_credentials` | Admin login credentials |

### Database Functions
- `has_role(user_id, role)` — Check user role (security definer)
- `get_leaderboard()` — Student rankings
- `get_user_rank(user_id)` — Individual rank
- `increment_ad_click(ad_id)` — Track ad clicks
- `set_pin_generator_password()` / `verify_pin_generator_password()` — PIN security

---

## 🛡️ Admin Dashboard Modules

| Module | File | Features |
|---|---|---|
| **Analytics** | `AnalyticsDashboard.tsx` | Page views, user stats, traffic overview |
| **User Management** | `UserManagement.tsx` | View users, restrict/ban, manage roles |
| **Exam Mode** | `ExamModeManagement.tsx` | Lock/unlock exams, set duration, schedule exams |
| **Access PINs** | `AccessPinManagement.tsx` | Generate PINs, view usage, manage batches |
| **Question Upload** | `PastQuestionUpload.tsx` | Upload past questions (manual + document) |
| **Q-Bank Sync** | `QuestionBankSync.tsx` | Sync questions from external APIs |
| **Trial Management** | `TrialManagement.tsx` | Configure trial limits, duration |
| **Success Stories** | `SuccessStoryManagement.tsx` | Manage student testimonials |
| **Team Experts** | `TeamExpertManagement.tsx` | Manage team member profiles |

---

## 🔀 Routing Map

| Route | Page | Access |
|---|---|---|
| `/` | Home / Landing | Public |
| `/about` | About Us | Public |
| `/services` | Services | Public |
| `/contact` | Contact | Public |
| `/auth` | Login / Sign Up | Public |
| `/reset-password` | Password Reset | Public |
| `/profile` | User Profile | Authenticated |
| `/exam` | Exam Categories | Authenticated |
| `/exam/take/:subjectSlug` | Active Exam | Authenticated + Subscribed |
| `/exam-results/:subjectSlug` | Exam Results | Authenticated |
| `/jamb-exam` | JAMB Exams | Authenticated |
| `/jamb-study` | JAMB Study Materials | Authenticated |
| `/api-exam` | API-sourced Exams | Authenticated |
| `/payment` | Payment & Subscription | Authenticated |
| `/admin` | Admin Dashboard | Admin role only |

---

## 💳 Payment & Access Flow

1. **Paystack (Online)**: User selects category → Paystack checkout → Auto-redirect → `verify-paystack-payment` edge function confirms → Subscription activated instantly
2. **PIN (Manual)**: User pays offline → Admin generates PIN → User enters PIN → `verify-veezee-pin` validates → Subscription activated
3. **VIP Bypass**: Whitelisted emails in `SubscriptionGate.tsx` get instant access without payment
4. **Trial**: Configurable free trial with daily question limits

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Lovable Cloud (Supabase) — PostgreSQL, Edge Functions (Deno)
- **Payments**: Paystack API
- **Mobile**: Capacitor (Android/iOS wrapper)
- **State**: TanStack React Query
- **Routing**: React Router v6
