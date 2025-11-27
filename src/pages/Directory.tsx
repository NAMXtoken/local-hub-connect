import { Header } from "@/components/Header";
import { FilterSidebar } from "@/components/FilterSidebar";
import { BusinessCard } from "@/components/BusinessCard";

// Mock data for demonstration
const businesses = [
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
    phone: "+1234567890",
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
  {
    id: "4",
    name: "Tech Repair Pro",
    category: "Services",
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80",
    rating: 4.6,
    reviews: 89,
    location: "Tech Plaza",
    distance: "1.8 km",
    priceRange: 2,
    isOpen: true,
    bumps: 156,
  },
  {
    id: "5",
    name: "Fashion Hub",
    category: "Shopping",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
    rating: 4.4,
    reviews: 176,
    location: "Shopping District",
    distance: "2.2 km",
    priceRange: 3,
    isOpen: true,
    bumps: 423,
  },
  {
    id: "6",
    name: "Urban Salon & Spa",
    category: "Health & Medical",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80",
    rating: 4.9,
    reviews: 203,
    location: "Central Avenue",
    distance: "0.9 km",
    priceRange: 3,
    isOpen: true,
    bumps: 892,
  },
  {
    id: "7",
    name: "Auto Care Masters",
    category: "Automotive",
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
    rating: 4.5,
    reviews: 142,
    location: "Industrial Park",
    distance: "4.5 km",
    priceRange: 2,
    isOpen: true,
    bumps: 234,
  },
  {
    id: "8",
    name: "Artisan Bakery",
    category: "Restaurants",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
    rating: 4.6,
    reviews: 267,
    location: "Old Town",
    distance: "1.5 km",
    priceRange: 2,
    isOpen: true,
    bumps: 678,
  },
].sort((a, b) => b.bumps - a.bumps);

const Directory = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Business Directory
          </h1>
          <p className="text-muted-foreground">
            Showing {businesses.length} businesses in your area
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-80 flex-shrink-0">
            <FilterSidebar />
          </aside>

          <main className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {businesses.map((business) => (
                <BusinessCard key={business.id} {...business} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Directory;
