import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryGrid } from "@/components/CategoryGrid";
import { Leaderboard } from "@/components/Leaderboard";
import { BusinessCard } from "@/components/BusinessCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const leaderboardData = {
  "Restaurants": [
    { id: "1", name: "Gourmet Bistro", bumps: 892, category: "Restaurants", image: "", rating: 4.7 },
    { id: "2", name: "Ocean View Restaurant", bumps: 756, category: "Restaurants", image: "", rating: 4.6 },
    { id: "3", name: "The Italian Corner", bumps: 643, category: "Restaurants", image: "", rating: 4.5 },
  ],
  "Shopping": [
    { id: "4", name: "Boutique Fashion", bumps: 678, category: "Shopping", image: "", rating: 4.8 },
    { id: "5", name: "Local Artisan Market", bumps: 589, category: "Shopping", image: "", rating: 4.7 },
    { id: "6", name: "Vintage Finds", bumps: 534, category: "Shopping", image: "", rating: 4.6 },
  ],
  "Health & Medical": [
    { id: "7", name: "Elite Fitness Center", bumps: 823, category: "Health & Medical", image: "", rating: 4.8 },
    { id: "8", name: "Wellness Spa", bumps: 712, category: "Health & Medical", image: "", rating: 4.7 },
    { id: "9", name: "Family Dental Care", bumps: 598, category: "Health & Medical", image: "", rating: 4.6 },
  ],
  "Cafes & Bars": [
    { id: "10", name: "The Modern Cafe", bumps: 945, category: "Cafes & Bars", image: "", rating: 4.9 },
    { id: "11", name: "Sunset Lounge", bumps: 834, category: "Cafes & Bars", image: "", rating: 4.7 },
    { id: "12", name: "Coffee & Co", bumps: 721, category: "Cafes & Bars", image: "", rating: 4.6 },
  ],
  "Services": [
    { id: "13", name: "Premier Cleaning", bumps: 567, category: "Services", image: "", rating: 4.8 },
    { id: "14", name: "Quick Repairs", bumps: 498, category: "Services", image: "", rating: 4.6 },
    { id: "15", name: "Professional Movers", bumps: 445, category: "Services", image: "", rating: 4.5 },
  ],
  "Retail": [
    { id: "16", name: "Electronics Plus", bumps: 689, category: "Retail", image: "", rating: 4.7 },
    { id: "17", name: "Home Essentials", bumps: 612, category: "Retail", image: "", rating: 4.6 },
    { id: "18", name: "Sports & Outdoors", bumps: 578, category: "Retail", image: "", rating: 4.5 },
  ],
  "Home Services": [
    { id: "19", name: "Expert Plumbing", bumps: 734, category: "Home Services", image: "", rating: 4.8 },
    { id: "20", name: "Garden Masters", bumps: 656, category: "Home Services", image: "", rating: 4.7 },
    { id: "21", name: "Handy Repairs", bumps: 589, category: "Home Services", image: "", rating: 4.6 },
  ],
  "Automotive": [
    { id: "22", name: "Auto Care Center", bumps: 812, category: "Automotive", image: "", rating: 4.8 },
    { id: "23", name: "Quick Tire Service", bumps: 698, category: "Automotive", image: "", rating: 4.7 },
    { id: "24", name: "Premium Detailing", bumps: 623, category: "Automotive", image: "", rating: 4.6 },
  ],
};

const featuredBusinesses = [
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
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <CategoryGrid />
      <Leaderboard businessesByCategory={leaderboardData} />
      
      {/* Featured Businesses */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Featured Businesses
              </h2>
              <p className="text-muted-foreground text-lg">
                Top-rated businesses in your area
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
