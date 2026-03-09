import { useEffect, useRef, useState, useCallback } from 'react';
import axiosInstance from '@/lib/endpoints';

interface PartnershipStatusData {
  hasMyPendingRequest: boolean;
  hasPartnerPendingRequest: boolean;
  partnerHasLeft: boolean;
  myRequestedAt: string | null;
  partnerRequestedAt: string | null;
}

interface UsePartnershipStatusOptions {
  partnershipId: string | null;
  enabled?: boolean;
  pollingInterval?: number; // default 30000 (30 seconds)
}

interface UsePartnershipStatusResult {
  hasMyPendingRequest: boolean;
  hasPartnerPendingRequest: boolean;
  partnerHasLeft: boolean;
  myRequestedAt: string | null;
  partnerRequestedAt: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePartnershipStatus = ({
  partnershipId,
  enabled = true,
  pollingInterval = 30000,
}: UsePartnershipStatusOptions): UsePartnershipStatusResult => {
  const [status, setStatus] = useState<PartnershipStatusData>({
    hasMyPendingRequest: false,
    hasPartnerPendingRequest: false,
    partnerHasLeft: false,
    myRequestedAt: null,
    partnerRequestedAt: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!partnershipId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.get(
        `/api/pairing/partnership/${partnershipId}/status`
      );

      if (response.data?.success && response.data?.data) {
        setStatus({
          hasMyPendingRequest: response.data.data.hasMyPendingRequest || false,
          hasPartnerPendingRequest: response.data.data.hasPartnerPendingRequest || false,
          partnerHasLeft: response.data.data.partnerHasLeft || false,
          myRequestedAt: response.data.data.myRequestedAt || null,
          partnerRequestedAt: response.data.data.partnerRequestedAt || null,
        });
        setError(null);
      } else {
        setError(response.data?.message || 'Failed to fetch partnership status');
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching partnership status:', err);
      setError('Failed to fetch partnership status');
      setIsLoading(false);
    }
  }, [partnershipId]);

  useEffect(() => {
    if (enabled && partnershipId) {
      // Initial fetch
      fetchStatus();

      // Set up polling
      intervalRef.current = setInterval(() => {
        console.log('[PartnershipStatusMonitor] Polling partnership status...');
        fetchStatus();
      }, pollingInterval);
    }

    return () => {
      if (intervalRef.current) {
        console.log('[PartnershipStatusMonitor] Stopping monitoring');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, partnershipId, pollingInterval, fetchStatus]);

  return {
    ...status,
    isLoading,
    error,
    refetch: fetchStatus,
  };
};
