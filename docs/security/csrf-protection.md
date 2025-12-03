# CSRF Protection

This document describes the CSRF (Cross-Site Request Forgery) protection implementation in Prompt Framework Studio.

## Overview

CSRF protection prevents malicious websites from making unauthorized requests on behalf of authenticated users. This is particularly important for state-changing operations like logout, which could be exploited if not properly protected.

## Implementation

### Dependencies

- **@fastify/csrf-protection**: Fastify plugin that provides CSRF token generation and verification
- **@fastify/session**: Session management (CSRF secrets are stored in the session)

### Components

#### 1. Server Configuration (`src/server.ts`)

The CSRF protection plugin is registered after the session plugin:

```typescript
await server.register(fastifySession, { ... });
await server.register(fastifyCsrf, {
  sessionPlugin: '@fastify/session',
});
```

#### 2. CSRF Plugin (`src/plugins/csrf.ts`)

A custom plugin that provides `viewWithCsrf` decorator to automatically inject CSRF tokens into all view contexts:

```typescript
fastify.decorateReply('viewWithCsrf', async function(page, data) {
  const csrfToken = await this.generateCsrf();
  return this.view(page, { ...data, csrfToken });
});
```

#### 3. Route Protection (`src/routes/auth.ts`)

The logout route is protected using the `onRequest` hook:

```typescript
fastify.post('/logout', {
  onRequest: fastify.csrfProtection,
}, async (request, reply) => {
  await request.session.destroy();
  return reply.redirect('/');
});
```

#### 4. View Integration (`src/views/layout.ejs`)

The logout form includes a hidden input with the CSRF token:

```html
<form action="/auth/logout" method="POST">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
  <button type="submit" class="logout">Logout</button>
</form>
```

## Token Flow

1. **Token Generation**: When a page is rendered, `viewWithCsrf` generates a CSRF token using `reply.generateCsrf()`
2. **Token Storage**: The CSRF secret is stored in the user's session (server-side)
3. **Token Transmission**: The token is embedded in the HTML form as a hidden input
4. **Token Verification**: When the form is submitted, `fastify.csrfProtection` verifies the token matches the secret in the session
5. **Request Processing**: If verification succeeds, the request proceeds; otherwise, a 403 Forbidden error is returned

## Security Considerations

### Token Lifetime

CSRF tokens are tied to the user's session. When the session expires or is destroyed, the tokens become invalid.

### Token Storage

- **Secret**: Stored server-side in the session (SQLite database)
- **Token**: Transmitted to the client in HTML forms
- The secret never leaves the server

### Protection Scope

Currently, CSRF protection is applied to:
- `/auth/logout` - POST endpoint

Other state-changing operations use authentication middleware (`requireAuth`) which provides adequate protection through session validation.

## Testing

Tests for CSRF protection are located in `tests/csrf-logout.test.ts`:

1. **Missing Token Test**: Verifies that requests without a CSRF token are rejected
2. **Invalid Token Test**: Verifies that requests with an invalid token are rejected
3. **Valid Token Test**: Verifies that requests with a valid token succeed

Run tests with:
```bash
npm test -- tests/csrf-logout.test.ts
```

## Future Enhancements

Consider applying CSRF protection to other state-changing operations:
- Form submissions for creating/updating prompts
- Premium subscription actions
- Account settings changes

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [@fastify/csrf-protection Documentation](https://github.com/fastify/csrf-protection)
- [Understanding CSRF](https://github.com/pillarjs/understanding-csrf)
