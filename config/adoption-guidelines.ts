export const adoptionGuidelines = {
  rules: [
    'Reuse shared/ui primitives before creating new UI abstractions',
    'Use design tokens instead of hardcoded spacing or colors',
    'Never create a second cn() utility',
    'Never add direct database access inside presentation components',
    'Prefer service-layer composition over inline business logic',
  ],
  migrationOrder: [
    'layout primitives',
    'typography primitives',
    'interaction primitives',
    'shared utility functions',
  ],
} as const
