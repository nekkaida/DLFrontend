import { authClient } from '@/lib/auth-client';
import { getBackendBaseURL } from '@/src/config/network';

export interface FiuuCheckoutParams {
  paymentUrl: string;
  params: Record<string, string>;
}

export interface FiuuCheckoutResponse {
  paymentId: string;
  orderId: string;
  membershipId: string;
  amount: string;
  currency: string;
  checkout: FiuuCheckoutParams;
  message?: string;
}

export class FiuuPaymentService {
  static async createCheckout(seasonId: string, userId: string): Promise<FiuuCheckoutResponse> {
    const backendUrl = getBackendBaseURL();

    const response = await authClient.$fetch(`${backendUrl}/api/payments/fiuu/checkout`, {
      method: 'POST',
      body: {
        seasonId,
        userId,
      },
    });

    const payload = response as any;

    const maybeData =
      payload?.data?.data ??
      payload?.data ??
      payload;

    if (!maybeData || !maybeData.checkout) {
      const errorMessage = payload?.message || payload?.error || 'Unable to start payment. Please try again.';
      throw new Error(errorMessage);
    }

    return {
      paymentId: maybeData.paymentId,
      orderId: maybeData.orderId,
      membershipId: maybeData.membershipId,
      amount: maybeData.amount,
      currency: maybeData.currency,
      checkout: maybeData.checkout,
      message: payload?.message ?? maybeData?.message,
    };
  }
}
