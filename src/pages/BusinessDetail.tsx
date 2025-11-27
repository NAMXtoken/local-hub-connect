import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Clock, Star, DollarSign, Globe, Mail, Share2, Heart, Instagram, Facebook } from "lucide-react";
import { useParams } from "react-router-dom";
import { useState } from "react";

const BusinessDetail = () => {
  const { id } = useParams();

  // Mock data - would come from API in production
  const business = {
    name: "The Modern Cafe",
    category: "Cafes & Bars",
    images: [
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80",
      "https://images.unsplash.com/photo-1559305616-3b04e37e0fbe?w=800&q=80",
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&q=80",
    ],
    rating: 4.5,
    reviews: 128,
    location: "123 Main Street, Downtown District",
    distance: "1.2 km",
    priceRange: 2,
    phone: "+1 (234) 567-890",
    email: "info@moderncafe.com",
    website: "www.moderncafe.com",
    hours: "Mon-Fri: 8AM-10PM, Sat-Sun: 9AM-11PM",
    description: "A modern cafe serving artisanal coffee, fresh pastries, and healthy meals in a contemporary setting. Perfect for work meetings or casual catch-ups with friends.",
    amenities: ["WiFi", "Outdoor Seating", "Pet Friendly", "Parking Available", "Takeaway"],
    isOpen: true,
    bumps: 342,
    socialPosts: [
      {
        platform: "instagram",
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
        caption: "New seasonal menu launching this week! ☕✨",
        likes: 234,
        date: "2 days ago"
      },
      {
        platform: "facebook",
        image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80",
        caption: "Happy hour specials every Friday 4-7PM 🎉",
        likes: 156,
        date: "5 days ago"
      },
      {
        platform: "instagram",
        image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&q=80",
        caption: "Behind the scenes with our amazing baristas 🙌",
        likes: 189,
        date: "1 week ago"
      },
      {
        platform: "facebook",
        image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80",
        caption: "Thank you for an incredible year! Here's to more coffee moments ❤️",
        likes: 412,
        date: "2 weeks ago"
      }
    ]
  };

  const [bumpCount, setBumpCount] = useState(business.bumps);
  const [hasBumped, setHasBumped] = useState(false);

  const handleBump = () => {
    if (!hasBumped) {
      setBumpCount(prev => prev + 1);
      setHasBumped(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="h-96 rounded-xl overflow-hidden">
            <img
              src={business.images[0]}
              alt={business.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {business.images.slice(1).map((image, index) => (
              <div key={index} className="h-[11.5rem] rounded-xl overflow-hidden">
                <img
                  src={image}
                  alt={`${business.name} ${index + 2}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {business.name}
                  </h1>
                  <p className="text-lg text-muted-foreground">{business.category}</p>
                </div>
                <Button variant="outline" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg">
                  <Star className="h-5 w-5 fill-primary text-primary" />
                  <span className="text-lg font-semibold text-primary">{business.rating}</span>
                  <span className="text-sm text-muted-foreground ml-1">({business.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(4)].map((_, i) => (
                    <DollarSign
                      key={i}
                      className={`h-5 w-5 ${
                        i < business.priceRange ? "text-primary" : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                {business.isOpen ? (
                  <Badge className="bg-green-500 text-white">Open Now</Badge>
                ) : (
                  <Badge variant="secondary">Closed</Badge>
                )}
              </div>
            </div>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">About</h2>
              <p className="text-muted-foreground leading-relaxed">
                {business.description}
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {business.amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Community Love</h2>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-3xl font-bold text-primary">{bumpCount}</p>
                  <p className="text-sm text-muted-foreground">Total Bumps</p>
                </div>
                <Button
                  size="lg"
                  onClick={handleBump}
                  disabled={hasBumped}
                  variant={hasBumped ? "secondary" : "default"}
                  className="gap-2"
                >
                  <Heart className={`h-5 w-5 ${hasBumped ? "fill-current" : ""}`} />
                  {hasBumped ? "Bumped!" : "Bump This Business"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Show your appreciation for great service and help this business gain visibility in the directory!
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Social Media</h2>
              <div className="grid grid-cols-2 gap-4">
                {business.socialPosts.map((post, index) => (
                  <div key={index} className="group cursor-pointer">
                    <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                      <img
                        src={post.image}
                        alt={post.caption}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="flex items-center gap-2 text-white text-sm">
                            {post.platform === "instagram" ? (
                              <Instagram className="h-4 w-4" />
                            ) : (
                              <Facebook className="h-4 w-4" />
                            )}
                            <Heart className="h-4 w-4 fill-current" />
                            <span>{post.likes}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{post.caption}</p>
                    <p className="text-xs text-muted-foreground">{post.date}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="font-semibold text-lg text-foreground">Contact Information</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Address</p>
                    <p className="text-sm text-muted-foreground">{business.location}</p>
                    <p className="text-xs text-primary mt-1">{business.distance} away</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Phone</p>
                    <p className="text-sm text-muted-foreground">{business.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-sm text-muted-foreground">{business.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Website</p>
                    <p className="text-sm text-muted-foreground">{business.website}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Hours</p>
                    <p className="text-sm text-muted-foreground">{business.hours}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button className="w-full" size="lg">
                  Call Now
                </Button>
                <Button variant="outline" className="w-full" size="lg">
                  Get Directions
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-lg text-foreground mb-4">Location</h3>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <MapPin className="h-12 w-12 text-muted-foreground" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;
