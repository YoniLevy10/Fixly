# Requests Feature Module

Responsibilities:

- request creation
- request assignment
- status updates
- customer tracking
- professional workflow

Suggested structure:

```txt
/features/requests
  /components
  /hooks
  /services
  /actions
  /state
```

Rules:

- No direct DB calls inside components
- No business logic inside routes
- Shared types imported only from /shared
