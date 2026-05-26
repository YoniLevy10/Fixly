export const architectureRules = {
  forbidden: {
    duplicateUtilities: true,
    duplicateComponents: true,
    inlineBusinessLogic: true,
    directDatabaseCallsInsideUI: true,
  },
  ownership: {
    infra: ['shared', 'styles', 'config'],
    marketplace: ['features', 'app'],
  },
  conventions: {
    sharedImportsPrefix: '@/shared',
    configImportsPrefix: '@/config',
    stylesImportsPrefix: '@/styles',
  },
} as const
