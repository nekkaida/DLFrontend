import { create } from 'zustand';

/**
 * Secure in-memory store for password reset flow.
 * Stores verified OTP temporarily to avoid passing sensitive data in URL params.
 * Data is cleared automatically after use or on timeout.
 */

interface PasswordResetState {
  email: string | null;
  verifiedOtp: string | null;
  verifiedAt: number | null;
}

interface PasswordResetActions {
  setEmail: (email: string) => void;
  setVerifiedOtp: (email: string, otp: string) => void;
  getVerifiedOtp: () => { email: string; otp: string } | null;
  clearAll: () => void;
  isOtpValid: () => boolean;
}

// OTP verification is valid for 5 minutes after verification
const OTP_VALIDITY_MS = 5 * 60 * 1000;

export const usePasswordResetStore = create<PasswordResetState & PasswordResetActions>((set, get) => ({
  // State
  email: null,
  verifiedOtp: null,
  verifiedAt: null,

  // Actions
  setEmail: (email) => {
    set({ email, verifiedOtp: null, verifiedAt: null });
  },

  setVerifiedOtp: (email, otp) => {
    set({
      email,
      verifiedOtp: otp,
      verifiedAt: Date.now(),
    });
  },

  getVerifiedOtp: () => {
    const { email, verifiedOtp, verifiedAt } = get();

    // Check if we have valid data
    if (!email || !verifiedOtp || !verifiedAt) {
      return null;
    }

    // Check if OTP verification has expired
    if (Date.now() - verifiedAt > OTP_VALIDITY_MS) {
      // Clear expired data
      set({ email: null, verifiedOtp: null, verifiedAt: null });
      return null;
    }

    return { email, otp: verifiedOtp };
  },

  clearAll: () => {
    set({ email: null, verifiedOtp: null, verifiedAt: null });
  },

  isOtpValid: () => {
    const { verifiedOtp, verifiedAt } = get();
    if (!verifiedOtp || !verifiedAt) return false;
    return Date.now() - verifiedAt <= OTP_VALIDITY_MS;
  },
}));
