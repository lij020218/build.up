# build.up Auth Notes

## Auth Flows

- Sign up: name, email, password
- Sign in: email, password
- Change password: authenticated user updates password
- Sign out

## Current Decision

- Email verification is disabled for the current phase.
- The active auth scope is:
  - name
  - email
  - password
- Signup should allow immediate product access after account creation.

## Implementation Status

- Shared Supabase auth helpers exist in `packages/shared/src/supabase/auth.ts`
- UI screens for signup/login/password change are still pending
