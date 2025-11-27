import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryGrid } from "@/components/CategoryGrid";
import { BusinessCard } from "@/components/BusinessCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <CategoryGrid />
      
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
