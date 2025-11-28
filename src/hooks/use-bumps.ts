import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { localBumpLeaderboard, localBumpStats, localCreateBump } from "@/lib/local-bump-store";

interface BumpStatsResponse {
  slug: string;
  listingId: string | null;
  total: number;
  counts: Record<string, number>;
  canBump: boolean;
  nextAvailableAt: number | null;
}

interface BumpRequest {
  slug: string;
  listingId: string;
  userId: string;
  category?: string;
  name?: string;
}

interface LeaderboardItem {
  slug: string;
  listingId: string;
  name: string;
  category: string;
  image?: string;
  count: number;
}

interface LeaderboardResponse {
  timeframe: string;
  items: LeaderboardItem[];
}

export const useBumpStats = (slug?: string, userId?: string | null) => {
  return useQuery<BumpStatsResponse>({
    queryKey: ["bumps", "stats", slug, userId],
    enabled: Boolean(slug),
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ slug: slug as string });
        if (userId) {
          params.set("userId", userId);
        }
        const response = await fetch(`/api/bumps?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to load bump stats");
        }
        return response.json();
      } catch (error) {
        if (typeof window !== "undefined" && slug) {
          return localBumpStats(slug, userId);
        }
        throw error;
      }
    },
    staleTime: 1000 * 60,
  });
};

export const useBumpLeaderboard = () => {
  return useQuery<LeaderboardResponse>({
    queryKey: ["bumps", "leaderboard"],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/bumps?leaderboard=1`);
        if (!response.ok) {
          throw new Error("Failed to load leaderboard");
        }
        return response.json();
      } catch (error) {
        if (typeof window !== "undefined") {
          return localBumpLeaderboard();
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useBumpMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BumpRequest) => {
      const response = await fetch("/api/bumps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      let data: any = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (error) {
          console.error("Failed to parse bumps response", error, text);
        }
      }
      if (!response.ok) {
        if (response.status === 404 && typeof window !== "undefined") {
          return localCreateBump(payload);
        }
        const error = new Error(data?.error ?? `Unable to bump (status ${response.status})`) as Error & {
          details?: any;
          status?: number;
        };
        error.details = data ?? { raw: text };
        error.status = response.status;
        throw error;
      }
      return (data ?? { success: true }) as { success: boolean; nextAvailableAt?: number; source?: string };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bumps", "stats", variables.slug, variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["bumps", "leaderboard"] });
      if (typeof window !== "undefined" && data?.source === "local") {
        const stats = localBumpStats(variables.slug, variables.userId);
        queryClient.setQueryData(["bumps", "stats", variables.slug, variables.userId], stats);
        const leaderboard = localBumpLeaderboard();
        queryClient.setQueryData(["bumps", "leaderboard"], leaderboard);
      }
    },
  });
};

export type { LeaderboardItem, LeaderboardResponse, BumpStatsResponse };
