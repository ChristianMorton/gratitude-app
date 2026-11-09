# Reporting a security issue

Please report vulnerabilities privately using GitHub private vulnerability
reporting when enabled, or the support contact shown in the application's
footer. Do not include credentials, real user records or coordinates in public
issues. If credentials are exposed, revoke them before preparing a code fix.

The service-role Supabase key bypasses database access rules. It belongs only in
server-side environment configuration and must never use a `NEXT_PUBLIC_` name.
Public Supabase URL and publishable keys are intended to be visible; database
row-level security must still be configured and tested.
