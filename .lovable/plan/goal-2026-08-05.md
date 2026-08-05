## Goal

Add a working "Forgot password" flow to the OSP Deal Builder so users can reset their own password from the sign-in screen.

## What gets added

**1. Forgot-password step on `/login`**
- A "Forgot password?" link under the password field.
- Clicking it swaps the sign-in form for a small "Reset your password" panel: one email field + "Send reset link" button, plus a "Back to sign in" link.
- On submit, a reset email is sent and the panel shows a confirmation ("Check your inbox — the link expires in 1 hour"). The same confirmation shows whether or not the email exists, so no account information leaks.

**2. New public `/reset-password` page**
- Reached from the emailed link. Not behind the auth guard.
- Detects the recovery session from the link. If the link is missing, expired, or already used, it shows an explanatory message and a button back to `/login` to request a new one.
- Otherwise: new password + confirm password fields, minimum 8 characters, mismatch and weak-password errors shown inline.
- On success: toast confirmation, then redirect into the app at `/`.

**3. Password change from Settings**
- A "Change password" card on the existing Settings page for signed-in users (current session is already authenticated, so it just takes new + confirm password). Prevents the "log out then get locked out" loop in future.

## Your immediate problem

The flow above is self-service, so once it's live you can reset from the sign-in screen yourself. If you're locked out before then, I can also send a one-time recovery link straight to your work email as part of this change.

## Technical notes

- `resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })` for the request; `updateUser({ password })` on the reset page.
- `/reset-password` is registered outside the `RequireAuth` wrapper in `src/App.tsx`, alongside `/login`.
- Recovery detection uses the auth state listener (`PASSWORD_RECOVERY` / session presence) rather than parsing the URL hash manually, so it works with both hash and code-based links.
- No database or schema changes; no new tables, roles, or policies.
- Auth emails currently send via the default provider templates. If you want the reset email branded with S+N / TechM styling and sent from your own domain, that's a separate follow-up requiring a sender domain — say the word and I'll fold it in.
