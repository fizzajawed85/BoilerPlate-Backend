# 🛡️ MERN Authentication Boilerplate - Evolution & Documentation

This folder contains the history of modifications and design decisions made to transform the basic boilerplate into a premium, production-ready solution.

## 📜 Project Evolution History

### 1. UI/UX Global Overhaul
- **Indigo Theme**: Transitioned from generic colors to a sophisticated "Deep Midnight Slate" background with "Vibrant Indigo" accents.
- **Horizontal Rectangular Layout**: Redesigned all authentication pages (`Login`, `Register`, `ForgotPassword`, `VerifyOtp`, `ResetPassword`) into a 2-column responsive layout.
    - **Left Column**: Branding icons and descriptive trust-building text.
    - **Right Column**: Compact, scroll-free authentication forms.
- **Consistent Dashboard**: Aligned the `Home` page with the same 2-column layout for a seamless user journey.

### 2. Component Refinements
- **Button System**: Optimized to a "Deep Midnight" style with soft indigo borders and high-contrast white text for better readability and eye-comfort.
- **Input System**: Standardized height to `h-12` to match buttons and enhanced text contrast for accessibility.
- **Single-Digit OTP Grid**: Replaced single input field with a professional 6-box OTP entry system featuring:
    - Auto-advance focus.
    - Backspace navigation.
    - Numeric-only validation.
    - Paste support for 6-digit codes.

### 3. Backend & Security
- **Generic Branding**: Removed all hardcoded project names (e.g., "add future project name") from email templates, user models, and support labels.
- **Robust Emailing**: Configured `sendEmail` utility with generic "Support" branding.
- **Connectivity Fixes**: Resolved MongoDB SRV/DNS issues by optimizing connection strings for reliable database access.

### 4. Integration Features
- **Social Logins**: Integrated élégant social authentication buttons for Google, Facebook, LinkedIn, and GitHub using `react-icons`.

---

## 🛠️ Next Implementation Steps
- [ ] Backend logic for social authentication callbacks.
- [ ] Role-based access control (RBAC) integration.
- [ ] User profile image upload (Multer/Cloudinary).

---

## 🌐 Social Login Integration Guide (Free & Standard)

Social logins are **100% Free** for standard authentication. Follow these steps to enable them in the future:

### 1. Google Login (Standard)
- **Status**: Free
- **Process**:
    1. Go to [Google Cloud Console](https://console.cloud.google.com/).
    2. Create a new Project and configure the **OAuth Consent Screen**.
    3. Under **Credentials**, create an **OAuth 2.0 Client ID** (Web application).
    4. Add `http://localhost:5173` to Authorized JavaScript Origins.
    5. In Frontend: Install `@react-oauth/google` and wrap the app in `GoogleOAuthProvider`.
    6. In Backend: Use `google-auth-library` to verify the ID Token in `socialLogin` controller.

### 2. GitHub Login (Standard)
- **Status**: Free
- **Process**:
    1. Go to GitHub **Settings > Developer Settings > OAuth Apps**.
    2. Register a new application.
    3. Use your `CLIENT_ID` and `CLIENT_SECRET` in the backend.
    4. Handle the callback to exchange the `code` for an `access_token`.

### 3. General Implementation Pattern
- Always store the `socialId` and `socialProvider` in the Mongoose `User` model to prevent duplicate accounts.
- Password field remains empty for social-only users.

---
*Last Updated: February 13, 2026*
