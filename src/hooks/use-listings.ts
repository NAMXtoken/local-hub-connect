import { useQuery } from "@tanstack/react-query";
import { fetchListingBySlug, fetchListings, type Listing, type ListingFilters } from "@/lib/api";

const buildQueryKey = (filters?: ListingFilters) => {
  if (!filters) {
    return ["listings", "all"] as const;
  }
  return [
    "listings",
    (filters.categories ?? []).slice().sort().join("|"),
    (filters.locations ?? []).slice().sort().join("|"),
    filters.search?.trim().toLowerCase() ?? "",
  ] as const;
};

export const useListings = (filters?: ListingFilters, options?: { enabled?: boolean }) =>
  useQuery<Listing[], Error>({
    queryKey: buildQueryKey(filters),
    queryFn: () => fetchListings(filters),
    staleTime: 1000 * 60 * 10,
    enabled: options?.enabled ?? true,
  });

export const useListing = (slug?: string) =>
  useQuery<Listing, Error>({
    queryKey: ["listing", slug],
    queryFn: () => fetchListingBySlug(slug as string),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 5,
  });
