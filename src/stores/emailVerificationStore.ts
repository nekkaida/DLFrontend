import { create } from 'zustand';

/**
 * Store for secure email verification flow data.
 * Passes email between registration and verification screens without URL params.
 * This prevents email from being exposed in browser history, logs, or referrer headers.
 */

interface EmailVerificationState {
  email: string | null;
  otpSentAt: number | null;
}

interface EmailVerificationActions {
  setEmail: (email: string) => void;
  getEmail: () => string | null;
  clearAll: () => void;
  isSessionValid: () => boolean;
}

// Session validity: 10 minutes (enough time to check email and enter OTP)
const SESSION_VALIDITY_MS = 10 * 60 * 1000;

export const useEmailVerificationStore = create<EmailVerificationState & EmailVerificationActions>((set, get) => ({
  email: null,
  otpSentAt: null,

  setEmail: (email: string) => {
    set({
      email: email.toLowerCase().trim(),
      otpSentAt: Date.now(),
    });
  },

  getEmail: () => {
    const state = get();
    // Check if session is still valid
    if (!state.email || !state.otpSentAt) {
      return null;
    }

    const elapsed = Date.now() - state.otpSentAt;
    if (elapsed > SESSION_VALIDITY_MS) {
      // Session expired, clear data
      set({ email: null, otpSentAt: null });
      return null;
    }

    return state.email;
  },

  clearAll: () => {
    set({
      email: null,
      otpSentAt: null,
    });
  },

  isSessionValid: () => {
    const state = get();
    if (!state.email || !state.otpSentAt) {
      return false;
    }
    const elapsed = Date.now() - state.otpSentAt;
    return elapsed <= SESSION_VALIDITY_MS;
  },
}));
