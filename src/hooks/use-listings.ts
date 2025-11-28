import { useQuery } from "@tanstack/react-query";
import { fetchListingBySlug, fetchListings, type Listing } from "@/lib/api";

export const useListings = () =>
  useQuery<Listing[], Error>({
    queryKey: ["listings"],
    queryFn: fetchListings,
    staleTime: 1000 * 60 * 10,
  });

export const useListing = (slug?: string) =>
  useQuery<Listing, Error>({
    queryKey: ["listing", slug],
    queryFn: () => fetchListingBySlug(slug as string),
    enabled: Boolean(slug),
    staleTime: 1000 * 60 * 5,
  });
