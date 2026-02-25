import { create } from 'zustand';

interface MyGamesStore {
  // Flag to signal that My Games should refresh its data
  shouldRefresh: boolean;
  // Call this after match actions (submit result, confirm result, join match)
  triggerRefresh: () => void;
  // Call this after the refresh is complete
  clearRefresh: () => void;
  // Total pending invite count (match invites + season/partnership invites)
  pendingInviteCount: number;
  setPendingInviteCount: (count: number) => void;
}

export const useMyGamesStore = create<MyGamesStore>((set) => ({
  shouldRefresh: false,
  triggerRefresh: () => set({ shouldRefresh: true }),
  clearRefresh: () => set({ shouldRefresh: false }),
  pendingInviteCount: 0,
  setPendingInviteCount: (count: number) => set({ pendingInviteCount: count }),
}));
