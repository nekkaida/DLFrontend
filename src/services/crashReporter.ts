import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { ErrorInfo } from 'react';

const CRASH_REPORT_URL = `${process.env.EXPO_PUBLIC_API_URL || ''}/api/crash-reports`;
const MAX_STACK_LENGTH = 8000;
const MAX_CRASHES_PER_MINUTE = 3;
const CRASH_WINDOW_MS = 60 * 1000;

// Re-entry guard — prevents infinite loop if reporter itself crashes
let isReporting = false;

// Crash loop protection
const recentCrashes: number[] = [];

function isInCrashLoop(): boolean {
  const now = Date.now();
  while (recentCrashes.length > 0 && recentCrashes[0] < now - CRASH_WINDOW_MS) {
    recentCrashes.shift();
  }
  return recentCrashes.length >= MAX_CRASHES_PER_MINUTE;
}

function sanitizeTrace(trace: string | undefined): string | undefined {
  if (!trace) return undefined;
  return trace
    .replace(/Bearer\s+[A-Za-z0-9\-._~+\/]+=*/g, 'Bearer [REDACTED]')
    .replace(/password['":\s]*['"][^'"]+['"]/gi, 'password: "[REDACTED]"')
    .replace(/token['":\s]*['"][^'"]+['"]/gi, 'token: "[REDACTED]"')
    .slice(0, MAX_STACK_LENGTH);
}

function getDeviceInfo() {
  return {
    platform: Platform.OS,
    osVersion: Platform.Version?.toString() || null,
    appVersion: Application.nativeApplicationVersion || Constants.expoConfig?.version || null,
    deviceModel: Device.modelName || null,
    buildType: Constants.appOwnership || 'standalone',
  };
}

async function sendReport(payload: Record<string, unknown>): Promise<void> {
  try {
    await fetch(CRASH_REPORT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Silently fail — cannot crash while reporting a crash
  }
}

/**
 * Report a React render error caught by ErrorBoundary.
 * Pass as onError callback: <ErrorBoundary onError={reportRenderError}>
 */
export function reportRenderError(error: Error, errorInfo: ErrorInfo): void {
  if (__DEV__ || isReporting || isInCrashLoop()) return;
  isReporting = true;
  recentCrashes.push(Date.now());

  try {
    const device = getDeviceInfo();
    sendReport({
      type: 'RENDER_ERROR',
      errorMessage: error.message || String(error),
      stackTrace: sanitizeTrace(error.stack),
      componentStack: sanitizeTrace(errorInfo?.componentStack || undefined),
      screenName: currentScreen,
      ...device,
    });
  } catch {
    // Never throw from crash reporter
  } finally {
    isReporting = false;
  }
}

/**
 * Report an unhandled JS error caught by ErrorUtils.setGlobalHandler.
 */
export function reportJSError(error: Error, isFatal: boolean): void {
  if (__DEV__ || isReporting || isInCrashLoop()) return;
  isReporting = true;
  recentCrashes.push(Date.now());

  try {
    const device = getDeviceInfo();
    sendReport({
      type: isFatal ? 'JS_ERROR' : 'UNHANDLED_REJECTION',
      errorMessage: error.message || String(error),
      stackTrace: sanitizeTrace(error.stack),
      severity: isFatal ? 'CRITICAL' : 'HIGH',
      screenName: currentScreen,
      ...device,
    });
  } catch {
    // Never throw from crash reporter
  } finally {
    isReporting = false;
  }
}

/**
 * Report unexpected session loss (auto-logout).
 * Call from NavigationInterceptor when session transitions to null unexpectedly.
 */
export function reportSessionLoss(reason: string, screenName?: string): void {
  if (__DEV__ || isReporting || isInCrashLoop()) return;
  isReporting = true;
  recentCrashes.push(Date.now());

  try {
    const device = getDeviceInfo();
    sendReport({
      type: 'SESSION_LOST',
      errorMessage: `Unexpected session loss: ${reason}`,
      screenName: screenName || currentScreen,
      ...device,
    });
  } catch {
    // Never throw from crash reporter
  } finally {
    isReporting = false;
  }
}

/**
 * Track the current screen for crash context.
 */
let currentScreen: string | null = null;
export function setCurrentScreen(screen: string): void {
  currentScreen = screen;
}
