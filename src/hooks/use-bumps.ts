import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { localBumpLeaderboard, localBumpStats, localCreateBump } from "@/lib/local-bump-store";
import type { BumpMutationError, BumpMutationResponse, BumpMutationErrorDetails } from "@/types/bumps";

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const normalizeSuccessPayload = (payload: unknown): BumpMutationResponse => {
  if (!isRecord(payload)) {
    return { success: true };
  }

  const success = typeof payload.success === "boolean" ? payload.success : true;
  const nextAvailableAt = typeof payload.nextAvailableAt === "number" ? payload.nextAvailableAt : undefined;
  const source = typeof payload.source === "string" ? payload.source : undefined;
  return { success, nextAvailableAt, source };
};

const buildBumpError = (status: number, body: unknown, rawText: string): BumpMutationError => {
  const defaultMessage = `Unable to bump (status ${status})`;
  let message = defaultMessage;
  const details: BumpMutationErrorDetails = rawText ? { raw: rawText } : {};

  if (isRecord(body)) {
    for (const [key, value] of Object.entries(body)) {
      if (key === "error") {
        if (typeof value === "string") {
          message = value;
          details.error = value;
        }
        continue;
      }
      if (key === "nextAvailableAt" && typeof value === "number") {
        details.nextAvailableAt = value;
        continue;
      }
      (details as Record<string, unknown>)[key] = value;
    }
  }

  const error: BumpMutationError = new Error(message);
  error.status = status;
  error.details = details;
  return error;
};

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
    mutationFn: async (payload: BumpRequest): Promise<BumpMutationResponse> => {
      const response = await fetch("/api/bumps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      const parsed = text ? parseJson(text) : null;
      if (!response.ok) {
        if (response.status === 404 && typeof window !== "undefined") {
          return localCreateBump(payload);
        }
        throw buildBumpError(response.status, parsed, text);
      }
      return normalizeSuccessPayload(parsed);
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
