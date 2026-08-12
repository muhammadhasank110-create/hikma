# HIKMA role provisioning

HIKMA already supports the `learner`, `guardian`, `teacher`, and `admin` roles in `drizzle/schema.ts`. Accounts authenticate through the configured identity provider; the platform owner is promoted to `admin` automatically when their provider identifier matches `OWNER_OPEN_ID`.

## Secure administrator and teacher setup

| Role | Safe provisioning path | Scope |
|---|---|---|
| **Administrator** | Sign in once through the configured identity provider, then assign `role = 'admin'` through the database administration interface or an audited server-side role-management action. | Product administration and protected management routes. |
| **Teacher** | Sign in once through the configured identity provider, then assign `role = 'teacher'` through the same controlled workflow. | Teacher-specific navigation and learning-management routes. |

Do **not** create predictable credentials such as `admin/admin` or store raw passwords in source code. Such credentials would expose unrestricted access to anyone who discovers the deployment. If password login is required in future, add a dedicated authentication flow with rate limiting, password hashing, forced password change, secure reset, and an invite-only administrator bootstrap procedure.
