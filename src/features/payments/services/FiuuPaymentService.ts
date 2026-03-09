import axiosInstance from '@/lib/endpoints';

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
    const response = await axiosInstance.post('/api/payments/fiuu/checkout', {
      seasonId,
      userId,
    });

    const payload = response.data as any;

    const maybeData = payload?.data ?? payload;
    const checkout = maybeData?.checkout;

    if (!checkout) {
      const messageCandidate =
        maybeData?.message ??
        payload?.message ??
        payload?.error?.message ??
        payload?.error;

      const errorMessage =
        typeof messageCandidate === 'string'
          ? messageCandidate
          : 'Unable to start payment. Please try again.';

      throw new Error(errorMessage);
    }

    return {
      paymentId: maybeData.paymentId,
      orderId: maybeData.orderId,
      membershipId: maybeData.membershipId,
      amount: maybeData.amount,
      currency: maybeData.currency,
      checkout,
      message: maybeData?.message,
    };
  }
}
