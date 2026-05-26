# App Shell Architecture

Purpose:

Persistent mobile-first application container.

---

# Responsibilities

- safe areas
- max width
- background
- bottom navigation
- loading overlays
- route transitions

---

# Rules

- Entire app optimized for one-hand mobile usage
- Fixed bottom navigation
- Prevent horizontal scrolling
- Stable vertical rhythm

---

# Layout Hierarchy

```txt
<AppShell>
  <TopArea />
  <PageContent />
  <BottomNavigation />
</AppShell>
```

---

# UX Goal

Feel native.

NOT like a website.
