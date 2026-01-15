// src/utils/logger.ts
// Centralized logging utility that only logs for developers

// Cache the developer check to avoid repeated lookups
let isDeveloperCache: boolean | null = null;
let developerCheckPromise: Promise<boolean> | null = null;

/**
 * Check if current user is a developer
 * Uses cached result to avoid repeated async calls
 */
async function checkIsDeveloper(): Promise<boolean> {
  // Return cached result if available
  if (isDeveloperCache !== null) {
    return isDeveloperCache;
  }

  // If check is already in progress, return that promise
  if (developerCheckPromise) {
    return developerCheckPromise;
  }

  // Start new check
  developerCheckPromise = (async () => {
    try {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      const groups = session.tokens?.idToken?.payload?.['cognito:groups'];
      
      if (Array.isArray(groups)) {
        isDeveloperCache = groups.includes('developer');
      } else {
        isDeveloperCache = false;
      }
      
      return isDeveloperCache;
    } catch (error) {
      // On error, default to false (don't show logs)
      isDeveloperCache = false;
      return false;
    } finally {
      developerCheckPromise = null;
    }
  })();

  return developerCheckPromise;
}

/**
 * Synchronous check using cached value
 * Returns false if cache not yet populated (safe default)
 */
function isDeveloperSync(): boolean {
  return isDeveloperCache === true;
}

/**
 * Development-only log (only shows for developers)
 * Replaces console.log for non-critical logging
 */
export const devLog = (...args: any[]): void => {
  if (isDeveloperSync()) {
    console.log(...args);
  } else {
    // Check async if cache not populated yet
    checkIsDeveloper().then(isDev => {
      if (isDev) {
        console.log(...args);
      }
    });
  }
};

/**
 * Development-only warning (only shows for developers)
 * Replaces console.warn for non-critical warnings
 */
export const devWarn = (...args: any[]): void => {
  if (isDeveloperSync()) {
    console.warn(...args);
  } else {
    // Check async if cache not populated yet
    checkIsDeveloper().then(isDev => {
      if (isDev) {
        console.warn(...args);
      }
    });
  }
};

/**
 * Error log (always shows - critical errors)
 * Use this for errors that need to be visible to all users
 */
export const devError = (...args: any[]): void => {
  console.error(...args);
};

/**
 * Initialize developer check on module load
 * This pre-populates the cache for faster synchronous checks
 */
checkIsDeveloper().catch(() => {
  // Silently fail - cache will remain null and checks will default to false
});
