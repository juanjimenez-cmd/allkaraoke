# SaaS foundation

The first SaaS migration establishes accounts and memberships independently from the karaoke engine. Supabase Auth owns `auth.users`; application data belongs in the `app` schema.

Every private resource added later must contain `account_id`. The API must authenticate the request, start a transaction, and run `select set_config('app.current_user_id', $1, true)` before it queries application tables. Row-level security is a second check; the Worker remains responsible for validating the session and selecting the account scope.

The migration creates personal and organization accounts, three account roles, lifecycle status, indexes and an append-only audit table. It deliberately does not include subscriptions, songs, rooms or media: those need their own migrations after the authentication path is live.

The database must run this migration only in a Supabase project whose Auth schema is available. Use a staging project first, then verify:

1. A member of account A cannot select an account or membership belonging only to account B.
2. A member cannot update a membership.
3. An owner or administrator can update account metadata and manage memberships.
4. Queries with no `app.current_user_id` cannot return application rows.

The current shared admin password remains temporary compatibility code. It must be removed only after the authenticated administration routes have replaced every caller.
