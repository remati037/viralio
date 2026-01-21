# Authentication Flow Documentation

This document provides a comprehensive overview of the authentication system in the Viralio application, including all flows, components, and implementation details.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [Authentication Flows](#authentication-flows)
4. [Components](#components)
5. [Server Actions & Utilities](#server-actions--utilities)
6. [Routes & Pages](#routes--pages)
7. [Middleware & Session Management](#middleware--session-management)
8. [Error Handling](#error-handling)
9. [Security Considerations](#security-considerations)

---

## Architecture Overview

The authentication system is built on **Supabase Auth** and follows a clean, modular architecture:

- **Client Components**: Handle UI and user interactions
- **Server Actions**: Process authentication logic server-side
- **Utilities**: Provide reusable auth functions
- **Middleware**: Manages session refresh and route protection
- **Callback Handler**: Processes OAuth and email verification callbacks

### Key Technologies

- **Supabase Auth**: PKCE-based authentication with email/password
- **Next.js 14+**: App Router with Server Components and Server Actions
- **@supabase/ssr**: Server-side rendering support for Supabase

---

## Directory Structure

```
viralio/
├── lib/
│   └── auth/
│       ├── actions.ts          # Server actions for auth operations
│       ├── utils.ts            # Auth utility functions
│       └── types.ts            # TypeScript types for auth
├── components/
│   └── auth/
│       ├── AuthLayout.tsx      # Shared layout for auth pages
│       ├── LoginForm.tsx       # Login and signup form
│       ├── ForgotPasswordForm.tsx  # Password reset request form
│       ├── SetPasswordForm.tsx     # Password setting form
│       └── HashTokenHandler.tsx    # Handles URL hash tokens
├── app/
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── forgot-password/
│   │   └── page.tsx            # Forgot password page
│   └── auth/
│       ├── callback/
│       │   └── route.ts        # Auth callback handler
│       └── set-password/
│           └── page.tsx         # Set password page
└── middleware.ts               # Session management middleware
```

---

## Authentication Flows

### 1. User Registration (Sign Up)

**Flow:**
1. User fills out registration form (`LoginForm.tsx`)
2. Client calls `signUpAction()` server action
3. Server creates user account via Supabase
4. Supabase sends verification email
5. User clicks email link → redirected to `/auth/callback`
6. Callback exchanges code for session
7. Profile is automatically created via database trigger
8. User redirected to `/planner`

**Key Files:**
- `components/auth/LoginForm.tsx` - Registration form UI
- `lib/auth/actions.ts` - `signUpAction()` function
- `app/auth/callback/route.ts` - Handles email verification

**Code Example:**
```typescript
// User submits registration form
const { error, user } = await signUpAction({
  email: 'user@example.com',
  password: 'securepassword',
  businessName: 'My Business',
  businessCategory: 'marketing'
});
```

### 2. User Login

**Flow:**
1. User enters email and password
2. Client calls `signInAction()` server action
3. Server authenticates via Supabase
4. Session is established (cookies set)
5. User redirected to `/planner`

**Key Files:**
- `components/auth/LoginForm.tsx` - Login form UI
- `lib/auth/actions.ts` - `signInAction()` function

**Code Example:**
```typescript
const { error, session } = await signInAction({
  email: 'user@example.com',
  password: 'securepassword'
});
```

### 3. Password Reset (Forgot Password)

**Flow:**
1. User requests password reset (`ForgotPasswordForm.tsx`)
2. Client calls `requestPasswordResetAction()`
3. Supabase sends reset email with link
4. User clicks link → redirected to `/auth/callback?code=...&type=recovery`
5. Callback exchanges code for session
6. User redirected to `/auth/set-password?type=recovery`
7. User sets new password via `SetPasswordForm.tsx`
8. Password updated via `updatePasswordAction()`
9. User redirected to `/planner`

**Key Files:**
- `components/auth/ForgotPasswordForm.tsx` - Reset request form
- `components/auth/SetPasswordForm.tsx` - Password setting form
- `lib/auth/actions.ts` - `requestPasswordResetAction()` and `updatePasswordAction()`

**Code Example:**
```typescript
// Request reset
const { error } = await requestPasswordResetAction('user@example.com');

// Set new password (after clicking email link)
const { error } = await updatePasswordAction({
  password: 'newpassword',
  confirmPassword: 'newpassword'
});
```

### 4. Email Verification

**Flow:**
1. User signs up (unverified account created)
2. Supabase sends verification email
3. User clicks link → redirected to `/auth/callback?code=...`
4. Callback exchanges code for session
5. User account is verified
6. User redirected to `/planner`

**Key Files:**
- `app/auth/callback/route.ts` - Handles verification callback

### 5. Invitation Flow (Future)

**Flow:**
1. Admin invites user via email
2. User receives invitation link
3. User clicks link → redirected to `/auth/callback?code=...&type=invite`
4. Callback exchanges code for session
5. User redirected to `/auth/set-password?type=invite`
6. User sets initial password
7. User redirected to `/planner`

---

## Components

### AuthLayout

**Purpose:** Shared layout wrapper for all authentication pages

**Location:** `components/auth/AuthLayout.tsx`

**Features:**
- Consistent styling across auth pages
- Includes `HashTokenHandler` for URL hash token processing
- Responsive design with centered card layout

**Usage:**
```tsx
<AuthLayout>
  <LoginForm />
</AuthLayout>
```

### LoginForm

**Purpose:** Handles both user login and registration

**Location:** `components/auth/LoginForm.tsx`

**Features:**
- Toggle between login and signup modes
- Email and password validation
- Business name and category for signup
- Error handling and loading states
- Client-side form validation

**State Management:**
- `email`, `password` - Form inputs
- `businessName`, `businessCategory` - Signup fields
- `isSignUp` - Toggle between login/signup
- `loading` - Loading state
- `error` - Error messages

### ForgotPasswordForm

**Purpose:** Handles password reset email requests

**Location:** `components/auth/ForgotPasswordForm.tsx`

**Features:**
- Email input validation
- Success state with instructions
- Error handling
- Link back to login

**Flow:**
1. User enters email
2. Calls `requestPasswordResetAction()`
3. Shows success message with instructions
4. User checks email for reset link

### SetPasswordForm

**Purpose:** Handles password setting for recovery and invite flows

**Location:** `components/auth/SetPasswordForm.tsx`

**Features:**
- Multiple token handling methods:
  - PKCE code exchange
  - Token hash verification
  - Access/refresh token session
  - URL hash token parsing
- Password validation (min 6 characters)
- Password confirmation matching
- Session verification before password update

**Token Handling:**
The component handles various authentication token formats:
- Query params: `?code=...`, `?token=...`, `?access_token=...`
- URL hash: `#access_token=...&refresh_token=...`
- Legacy token hash: `?token_hash=...`

### HashTokenHandler

**Purpose:** Processes authentication tokens in URL hash fragments

**Location:** `components/auth/HashTokenHandler.tsx`

**Why Needed:**
Supabase sometimes redirects with tokens in the URL hash (fragment) instead of query parameters. This component:
- Detects hash tokens on page load
- Parses and processes them
- Redirects to appropriate pages
- Handles errors from hash parameters

**Handled Scenarios:**
- Recovery/invite flows with hash tokens
- OAuth callbacks with hash tokens
- Error handling from expired tokens
- Automatic session establishment

---

## Server Actions & Utilities

### Server Actions (`lib/auth/actions.ts`)

All server actions are marked with `'use server'` and run on the server.

#### `signUpAction(data: SignUpData)`

Creates a new user account.

**Parameters:**
- `email: string` - User email
- `password: string` - User password
- `businessName: string` - Business or personal name
- `businessCategory?: string` - Optional business category

**Returns:**
```typescript
{ error: string | null, user: User | null }
```

**Process:**
1. Creates user via Supabase Auth
2. Sets email redirect URL for verification
3. Updates profile with business name/category
4. Returns user or error

#### `signInAction(data: SignInData)`

Authenticates an existing user.

**Parameters:**
- `email: string` - User email
- `password: string` - User password

**Returns:**
```typescript
{ error: string | null, session: Session | null }
```

**Process:**
1. Authenticates via Supabase
2. Establishes session (cookies set automatically)
3. Returns session or error

#### `signOutAction()`

Signs out the current user.

**Returns:**
```typescript
{ error: string | null }
```

**Process:**
1. Calls Supabase `signOut()`
2. Clears session cookies
3. Returns error if any

#### `requestPasswordResetAction(email: string)`

Sends password reset email.

**Parameters:**
- `email: string` - User email

**Returns:**
```typescript
{ error: string | null }
```

**Process:**
1. Calls Supabase `resetPasswordForEmail()`
2. Sets redirect URL to `/auth/callback`
3. Returns error if any

#### `updatePasswordAction(data: SetPasswordData)`

Updates user password (for reset or initial setup).

**Parameters:**
- `password: string` - New password
- `confirmPassword: string` - Password confirmation

**Returns:**
```typescript
{ error: string | null }
```

**Process:**
1. Verifies active session exists
2. Updates password via Supabase
3. Refreshes session if needed
4. Returns error if any

### Utilities (`lib/auth/utils.ts`)

#### `getCurrentUser(): Promise<User | null>`

Gets the current authenticated user (server-side).

**Usage:**
```typescript
const user = await getCurrentUser();
if (!user) {
  redirect('/login');
}
```

#### `isAuthenticated(): Promise<boolean>`

Checks if user is authenticated.

**Usage:**
```typescript
if (await isAuthenticated()) {
  // User is logged in
}
```

#### `validatePassword(password: string)`

Validates password strength.

**Returns:**
```typescript
{ valid: boolean, error?: string }
```

**Rules:**
- Minimum 6 characters

#### `validateEmail(email: string)`

Validates email format using regex.

**Returns:** `boolean`

#### `parseAuthError(error: any)`

Parses Supabase errors into user-friendly messages.

**Returns:** `string`

---

## Routes & Pages

### `/login`

**File:** `app/login/page.tsx`

**Purpose:** Login and registration page

**Features:**
- Server-side auth check (redirects if already logged in)
- Uses `AuthLayout` for consistent styling
- Renders `LoginForm` component

**Flow:**
1. Check if user is authenticated
2. If yes, redirect to `/`
3. If no, render login form

### `/forgot-password`

**File:** `app/forgot-password/page.tsx`

**Purpose:** Password reset request page

**Features:**
- Server-side auth check
- Uses `AuthLayout`
- Renders `ForgotPasswordForm`

### `/auth/set-password`

**File:** `app/auth/set-password/page.tsx`

**Purpose:** Password setting page for recovery and invite flows

**Features:**
- Handles PKCE code exchange server-side
- Supports multiple token formats
- Uses `AuthLayout`
- Renders `SetPasswordForm`

**Query Parameters:**
- `code` - PKCE code from email link
- `type` - Flow type (`recovery`, `invite`)
- `token` - Legacy token
- `token_hash` - Token hash
- `access_token` - Access token
- `refresh_token` - Refresh token
- `error` - Error message

**Server-Side Processing:**
1. If `code` present, exchange for session
2. Verify session created
3. Redirect based on flow type
4. Remove code from URL to prevent re-processing

### `/auth/callback`

**File:** `app/auth/callback/route.ts`

**Purpose:** Handles OAuth and email verification callbacks

**Features:**
- PKCE code exchange
- Token-based flow support
- Profile setup for new users
- Error handling and redirects

**Query Parameters:**
- `code` - PKCE code
- `type` - Flow type
- `token` - Legacy token
- `token_hash` - Token hash
- `next` - Redirect URL (default: `/planner`)

**Flow Types:**
- `recovery` - Password reset
- `invite` - User invitation
- `signup` - Email verification
- (none) - OAuth or general callback

**Processing Logic:**
1. **PKCE Code Flow:**
   - Exchange code for session
   - Verify session created
   - If recovery/invite → redirect to `/auth/set-password`
   - If signup → ensure profile setup → redirect to `/planner`
   - If error → redirect with error message

2. **Token Flow (Legacy):**
   - Redirect to `/auth/set-password` with token

3. **No Code/Token:**
   - Redirect to `/login` with error

---

## Middleware & Session Management

### Middleware (`middleware.ts`)

**Purpose:** Manages session refresh and route protection

**File:** `lib/supabase/proxy.ts` - Contains `updateSession()` function

**Features:**
- Automatic token refresh
- Route protection
- Public path handling
- Redirect logic for authenticated/unauthenticated users

**Public Paths:**
- `/login`
- `/auth/callback`
- `/auth/set-password`
- `/forgot-password`
- `/_next` (static files)
- `/api` (API routes)

**Logic:**
1. Create Supabase client with cookie handling
2. Get current user (triggers token refresh if needed)
3. Check if path is public
4. If authenticated on login page → redirect to `/planner`
5. If unauthenticated on protected route → redirect to `/login`
6. Return response with updated cookies

**Important:** The middleware must return the `supabaseResponse` object to preserve cookies.

### Session Management

**Client-Side:**
- Uses `@supabase/ssr` `createBrowserClient()`
- Automatically handles cookies
- Session stored in HTTP-only cookies

**Server-Side:**
- Uses `@supabase/ssr` `createServerClient()`
- Reads cookies from request
- Sets cookies in response
- Middleware refreshes tokens automatically

**Token Refresh:**
- Handled automatically by `@supabase/ssr`
- Middleware calls `getUser()` which triggers refresh if needed
- Cookies updated transparently

---

## Error Handling

### Error Sources

1. **Supabase Auth Errors:**
   - Invalid credentials
   - Expired tokens
   - Network errors
   - Rate limiting

2. **Validation Errors:**
   - Invalid email format
   - Weak password
   - Password mismatch

3. **Session Errors:**
   - Missing session
   - Invalid session
   - Expired session

### Error Processing

**Server Actions:**
- Catch all errors
- Parse via `parseAuthError()`
- Return user-friendly messages

**Components:**
- Display errors in UI
- Show toast notifications
- Handle loading states

**Error Messages:**
- User-friendly (Serbian language)
- Actionable (what user should do)
- Non-technical (no stack traces)

### Common Error Scenarios

1. **Expired Reset Link:**
   - Error: "Link za resetovanje lozinke je istekao"
   - Action: User requests new link

2. **Invalid Credentials:**
   - Error: "Invalid login credentials"
   - Action: User checks email/password

3. **Session Expired:**
   - Error: "Nedostaje sesija. Molimo koristite link iz emaila"
   - Action: User requests new link

4. **Network Error:**
   - Error: "Došlo je do greške. Pokušajte ponovo"
   - Action: User retries

---

## Security Considerations

### Password Security

- **Minimum Length:** 6 characters (configurable)
- **Storage:** Hashed by Supabase (bcrypt)
- **Transmission:** HTTPS only
- **Validation:** Client and server-side

### Session Security

- **HTTP-Only Cookies:** Prevents XSS attacks
- **Secure Cookies:** HTTPS only (production)
- **SameSite:** Strict (prevents CSRF)
- **Token Refresh:** Automatic via middleware

### Email Security

- **Verification Required:** New accounts must verify email
- **Reset Links:** Expire after 1 hour
- **Single Use:** Tokens are single-use
- **HTTPS:** All email links use HTTPS

### Route Protection

- **Middleware:** Protects all routes except public paths
- **Server Components:** Check auth before rendering
- **Client Components:** Verify session before sensitive operations

### Best Practices

1. **Never expose tokens in URLs:**
   - Use PKCE codes (short-lived)
   - Clear tokens from URL after processing

2. **Validate on server:**
   - Never trust client-side validation alone
   - Server actions validate all inputs

3. **Error messages:**
   - Don't reveal if email exists
   - Generic error messages for security

4. **Rate limiting:**
   - Supabase handles rate limiting
   - Consider additional limits for sensitive operations

---

## Troubleshooting

### Common Issues

#### 1. "Session not created" error

**Cause:** Code exchange failed or session expired

**Solution:**
- Check if code is still valid
- Request new email link
- Clear cookies and retry

#### 2. Redirect loop on login

**Cause:** Middleware or page logic issue

**Solution:**
- Check middleware public paths
- Verify redirect logic
- Check cookie settings

#### 3. Hash tokens not processed

**Cause:** `HashTokenHandler` not mounted or error in processing

**Solution:**
- Ensure `HashTokenHandler` is in layout
- Check browser console for errors
- Verify hash format

#### 4. Password reset link expired

**Cause:** Link older than 1 hour

**Solution:**
- Request new reset link
- Check email spam folder
- Verify email address

---

## Future Enhancements

### Planned Features

1. **OAuth Providers:**
   - Google Sign-In
   - GitHub Sign-In
   - Facebook Sign-In

2. **Two-Factor Authentication:**
   - TOTP support
   - SMS verification
   - Email verification codes

3. **Session Management:**
   - Active sessions list
   - Remote logout
   - Session timeout warnings

4. **Account Recovery:**
   - Security questions
   - Backup codes
   - Account recovery email

---

## API Reference

### Server Actions

See `lib/auth/actions.ts` for full API documentation.

### Utilities

See `lib/auth/utils.ts` for utility function documentation.

### Components

See individual component files in `components/auth/` for component props and usage.

---

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [@supabase/ssr Documentation](https://supabase.com/docs/reference/javascript/ssr)

---

**Last Updated:** 2024
**Maintained By:** Development Team
