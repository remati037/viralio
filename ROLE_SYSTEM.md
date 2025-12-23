# Role-Based Access Control System

This document explains the role and tier system implemented in ViralVault.

## Overview

The app uses a two-level access control system:
- **Tier**: `free`, `pro`, or `admin` (determines subscription status)
- **Role**: `user` or `admin` (determines permissions)

## Tier System

### Tiers Available:
- **Free**: Default tier for new users (no subscription)
- **Pro**: Paid subscription tier ($29/month)
- **Admin**: Special tier set only via database (not available through subscription)

### How Tiers Work:
- Users subscribe through Stripe → Get **Pro** tier
- Admin tier can only be set manually in the database
- Tier determines what features are available

## Role System

### Roles Available:
- **User**: Default role for all users
- **Admin**: Automatically assigned when tier is set to `admin`

### How Roles Work:
- **Automatic Assignment**: When a user's tier is set to `admin`, their role is automatically set to `admin` via database trigger
- **Default**: All other users have `user` role
- Role determines what actions users can perform (e.g., access admin dashboard)

## Database Trigger

A database trigger automatically updates the role when tier changes:
- `tier = 'admin'` → `role = 'admin'`
- `tier = 'pro'` or `tier = 'free'` → `role = 'user'`

## Using the Role Hook

### Import the Hook

```typescript
import { useUserRole } from '@/lib/hooks/useUserRole'
```

### Basic Usage

```typescript
function MyComponent({ userId }: { userId: string }) {
  const { roleInfo, loading, hasRole, hasTier, isUserAvailable } = useUserRole(userId)

  if (loading) return <div>Loading...</div>
  if (!roleInfo) return <div>No user data</div>

  // Check if user has admin role
  if (hasRole('admin')) {
    return <AdminPanel />
  }

  // Check if user has pro tier
  if (hasTier('pro')) {
    return <ProFeatures />
  }

  return <FreeFeatures />
}
```

### Available Methods

#### `hasRole(role: UserRole): boolean`
Check if user has a specific role.

```typescript
if (hasRole('admin')) {
  // Show admin features
}
```

#### `hasTier(tier: UserTier): boolean`
Check if user has a specific tier.

```typescript
if (hasTier('pro')) {
  // Show pro features
}
```

#### `isUserAvailable(role: UserRole): boolean`
Alias for `hasRole()` - useful for future role-based checks.

```typescript
if (isUserAvailable('admin')) {
  // Show admin-only content
}
```

### Role Info Object

The `roleInfo` object contains:
- `role`: Current user role (`'admin'` | `'user'`)
- `tier`: Current user tier (`'free'` | `'pro'` | `'admin'`)
- `isAdmin`: Boolean - true if user is admin
- `isPro`: Boolean - true if user has pro tier
- `isFree`: Boolean - true if user has free tier

## Examples

### Example 1: Show Admin Dashboard

```typescript
const { hasRole } = useUserRole(userId)

{hasRole('admin') && <AdminDashboard />}
```

### Example 2: Conditional Feature Access

```typescript
const { hasTier } = useUserRole(userId)

{hasTier('pro') ? (
  <UnlimitedFeatures />
) : (
  <LimitedFeatures />
)}
```

### Example 3: Role-Based Component Rendering

```typescript
const { roleInfo, isUserAvailable } = useUserRole(userId)

{isUserAvailable('admin') && (
  <button onClick={handleAdminAction}>
    Admin Only Action
  </button>
)}
```

## Setting Admin Tier

To set a user as admin, update their tier in the database:

```sql
UPDATE profiles 
SET tier = 'admin' 
WHERE id = 'user-uuid-here';
```

The role will be automatically set to `admin` by the database trigger.

## Subscription Cancellation

Users can cancel their subscription from the Profile Settings page:
1. Go to Profile Settings → Payment tab
2. Click "Otkazi Pretplatu" (Cancel Subscription)
3. Confirm cancellation in the modal
4. Subscription remains active until the expiration date
5. After expiration, user tier reverts to `free`

## Migration

Run the migration to update the database schema:

```bash
# Apply migration 011_update_tier_system_role_based.sql
```

This migration:
- Removes `starter` tier
- Adds `admin` tier
- Creates trigger to auto-update role based on tier
- Updates existing data (starter → pro)

