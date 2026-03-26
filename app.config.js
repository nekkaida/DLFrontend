/**
 * Dynamic Expo config — extends app.json with environment variable overrides.
 *
 * app.json holds production defaults (nexea account).
 * Set env vars to override for dev builds (personal EAS accounts).
 *
 * Env vars:
 *   EAS_OWNER           - EAS account owner (default: "nexea")
 *   EAS_PROJECT_ID      - EAS project ID (default: nexea's project)
 *   NEW_ARCH_ENABLED    - "true" to enable new architecture (default: false)
 *   GOOGLE_SERVICES_JSON - Path to google-services.json (EAS secret sets this)
 *
 * Usage:
 *   # Dev build (personal account):
 *   EAS_OWNER=nekkaida EAS_PROJECT_ID=e7b5e6fa-... NEW_ARCH_ENABLED=true eas build --platform android --profile development
 *
 *   # Production build (no env vars needed):
 *   eas build --platform android --profile production
 */
module.exports = ({ config }) => {
  return {
    ...config,
    owner: process.env.EAS_OWNER || config.owner,
    newArchEnabled:
      process.env.NEW_ARCH_ENABLED === "true" || config.newArchEnabled,
    extra: {
      ...config.extra,
      eas: {
        projectId:
          process.env.EAS_PROJECT_ID || config.extra?.eas?.projectId,
      },
    },
    android: {
      ...config.android,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ||
        config.android?.googleServicesFile,
    },
  };
};
