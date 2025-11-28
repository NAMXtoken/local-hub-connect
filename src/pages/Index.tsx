import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryGrid } from "@/components/CategoryGrid";
import { Leaderboard } from "@/components/Leaderboard";
import { BusinessCard } from "@/components/BusinessCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { slugify } from "@/lib/utils";
import { useListings } from "@/hooks/use-listings";
import { useBumpLeaderboard } from "@/hooks/use-bumps";

const withSlugs = <T extends { name: string }>(items: T[]) =>
  items.map((item) => ({ ...item, slug: slugify(item.name) }));

const placeholderLeaderboard = withSlugs([
  {
    id: "placeholder-1",
    name: "Community Favorite",
    category: "Local Business",
    image: "https://placehold.co/600x400?text=Samui+Connect",
    bumps: 12,
  },
  {
    id: "placeholder-2",
    name: "Island Classic",
    category: "Food & Beverage",
    image: "https://placehold.co/600x400?text=Samui+Connect",
    bumps: 9,
  },
  {
    id: "placeholder-3",
    name: "Hidden Gem",
    category: "Things To Do",
    image: "https://placehold.co/600x400?text=Samui+Connect",
    bumps: 7,
  },
]);

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

const Index = () => {
  const { data: listings = [], isLoading } = useListings();
  const { data: leaderboardData, isLoading: leaderboardLoading } = useBumpLeaderboard();
  const leaderboardItems = leaderboardData?.items ?? placeholderLeaderboard;
  const leaderboardTimeframe = leaderboardData?.timeframe ?? "24 hours";

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
      <CategoryGrid />
      <Leaderboard
        items={leaderboardItems}
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
