import { create } from 'zustand';
import { MatchFormData } from '../components/CreateMatchScreen';

interface ThreadMetadata {
  threadId: string;
  threadName: string;
  divisionId?: string;
  sportType: 'PICKLEBALL' | 'TENNIS' | 'PADEL';
}

interface CreateMatchState {
  pendingMatchData: MatchFormData | null;
  threadMetadata: ThreadMetadata | null;
  setPendingMatchData: (data: MatchFormData | null) => void;
  setThreadMetadata: (metadata: ThreadMetadata | null) => void;
  clearPendingMatch: () => void;
}

export const useCreateMatchStore = create<CreateMatchState>((set) => ({
  pendingMatchData: null,
  threadMetadata: null,
  setPendingMatchData: (data) => set({ pendingMatchData: data }),
  setThreadMetadata: (metadata) => set({ threadMetadata: metadata }),
  clearPendingMatch: () => set({ pendingMatchData: null, threadMetadata: null }),
}));

