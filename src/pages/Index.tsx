import { useMemo } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryGrid, DIRECTORY_CATEGORIES } from "@/components/CategoryGrid";
import { Leaderboard, type LeaderboardSection } from "@/components/Leaderboard";
import { BusinessCard } from "@/components/BusinessCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { slugify } from "@/lib/utils";
import { useListings } from "@/hooks/use-listings";
import { useBumpLeaderboard, type LeaderboardItem } from "@/hooks/use-bumps";
import type { Listing } from "@/lib/api";

const withSlugs = <T extends { name: string }>(items: T[]) =>
  items.map((item) => ({ ...item, slug: slugify(item.name) }));

const placeholderFeatured = withSlugs([
  {
    id: "1",
    name: "The Modern Cafe",
    category: "Cafes & Bars",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
    rating: 4.5,
    reviews: 128,
    location: "Downtown District",
    distance: "1.2 km",
    priceRange: 2,
    isOpen: true,
    bumps: 342,
  },
  {
    id: "2",
    name: "Elite Fitness Center",
    category: "Health & Medical",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    rating: 4.8,
    reviews: 245,
    location: "East Side",
    distance: "2.5 km",
    priceRange: 3,
    isOpen: true,
    bumps: 567,
  },
  {
    id: "3",
    name: "Gourmet Bistro",
    category: "Restaurants",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    rating: 4.7,
    reviews: 312,
    location: "Riverside",
    distance: "3.1 km",
    priceRange: 3,
    isOpen: false,
    bumps: 289,
  },
]);

const FEATURED_CATEGORY_NAMES = DIRECTORY_CATEGORIES.map((category) => category.name);

const normalizeCategory = (value?: string | null) => value?.toLowerCase().trim() ?? "";

const FEATURED_CATEGORY_SET = new Set(FEATURED_CATEGORY_NAMES.map((name) => normalizeCategory(name)));
const CATEGORY_NAME_BY_KEY = new Map(
  FEATURED_CATEGORY_NAMES.map((name) => [normalizeCategory(name), name] as const)
);

const Index = () => {
  const { data: listings = [], isLoading } = useListings();
  const { data: leaderboardData, isLoading: leaderboardLoading } = useBumpLeaderboard({ limit: 500 });
  const leaderboardItems = leaderboardData?.items ?? [];
  const leaderboardTimeframe = leaderboardData?.timeframe ?? "24 hours";
  const categoryCounts = useMemo(() => buildCategoryCounts(listings), [listings]);

  const featuredBusinesses = listings.length
    ? listings.slice(0, 3).map((listing) => ({
        id: listing.id,
        slug: listing.slug,
        name: listing.name,
        category: listing.primaryCategory || listing.tags[0] || "Local Business",
        image: listing.imageUrl,
        rating: null,
        reviews: null,
        location: listing.location || listing.address || "Koh Samui",
        priceRange: null,
        isOpen: true,
        bumps: 0,
      }))
    : placeholderFeatured;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <CategoryGrid counts={categoryCounts} />
      <Leaderboard
        sections={useLeaderboardSections(listings, leaderboardItems)}
        timeframe={leaderboardTimeframe}
        isLoading={leaderboardLoading}
      />

      {/* Featured Businesses */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Featured Businesses
              </h2>
              <p className="text-muted-foreground text-lg">
                {isLoading ? "Loading featured listings..." : "Top-rated businesses in your area"}
              </p>
            </div>
            <Link to="/directory">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBusinesses.map((business) => (
              <BusinessCard key={business.id} {...business} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;

function buildCategoryCounts(listings: Listing[]): Record<string, number> {
  const counts = new Map<string, number>(FEATURED_CATEGORY_NAMES.map((name) => [name, 0] as const));
  listings.forEach((listing) => {
    const matchedKeys = new Set<string>();
    if (listing.primaryCategory) {
      matchedKeys.add(normalizeCategory(listing.primaryCategory));
    }
    listing.tags.forEach((tag) => matchedKeys.add(normalizeCategory(tag)));

    matchedKeys.forEach((key) => {
      const displayName = CATEGORY_NAME_BY_KEY.get(key);
      if (!displayName) {
        return;
      }
      counts.set(displayName, (counts.get(displayName) ?? 0) + 1);
    });
  });
  return Object.fromEntries(counts);
}

function useLeaderboardSections(listings: Listing[], leaderboardItems: LeaderboardItem[]): LeaderboardSection[] {
  const listingsByCategory = useMemo(() => groupListingsByCategory(listings), [listings]);
  const bumpEntriesByCategory = useMemo(() => groupLeaderboardByCategory(leaderboardItems), [leaderboardItems]);

  return FEATURED_CATEGORY_NAMES.map((categoryName) => {
    const normalized = normalizeCategory(categoryName);
    const bumpEntries = (bumpEntriesByCategory.get(normalized) ?? []).slice(0, 3);
    const selections: LeaderboardItem[] = [...bumpEntries];

    if (selections.length < 3) {
      const fallbackListings = listingsByCategory.get(normalized) ?? [];
      for (const listing of fallbackListings) {
        if (selections.some((entry) => entry.slug === listing.slug)) {
          continue;
        }
        selections.push(convertListingToLeaderboardItem(listing, categoryName));
        if (selections.length === 3) {
          break;
        }
      }
    }

    return {
      category: categoryName,
      businesses: selections,
    } satisfies LeaderboardSection;
  });
}

function groupListingsByCategory(listings: Listing[]) {
  const map = new Map<string, Listing[]>();
  listings.forEach((listing) => {
    const candidates = new Set<string>();
    if (listing.primaryCategory) {
      candidates.add(listing.primaryCategory);
    }
    listing.tags.forEach((tag) => candidates.add(tag));

    candidates.forEach((candidate) => {
      const normalized = normalizeCategory(candidate);
      if (!FEATURED_CATEGORY_SET.has(normalized)) {
        return;
      }
      const bucket = map.get(normalized) ?? [];
      bucket.push(listing);
      map.set(normalized, bucket);
    });
  });

  map.forEach((bucket, key) => {
    bucket.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    map.set(key, bucket);
  });

  return map;
}

function groupLeaderboardByCategory(items: LeaderboardItem[]) {
  const map = new Map<string, LeaderboardItem[]>();
  items.forEach((item) => {
    const normalized = normalizeCategory(item.category);
    if (!FEATURED_CATEGORY_SET.has(normalized)) {
      return;
    }
    const bucket = map.get(normalized) ?? [];
    bucket.push(item);
    map.set(normalized, bucket);
  });

  map.forEach((bucket, key) => {
    bucket.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return (a.name || "").localeCompare(b.name || "");
    });
    map.set(key, bucket);
  });

  return map;
}

function convertListingToLeaderboardItem(listing: Listing, categoryName: string): LeaderboardItem {
  return {
    slug: listing.slug,
    listingId: listing.id,
    name: listing.name || "Untitled Listing",
    category: categoryName,
    image: listing.imageUrl || listing.remoteImageUrl,
    count: 0,
  };
}
