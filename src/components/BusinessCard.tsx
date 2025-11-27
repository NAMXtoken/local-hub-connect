import { MapPin, Star, Phone, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface BusinessCardProps {
  id: string;
  name: string;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  location: string;
  distance?: string;
  priceRange: number;
  phone?: string;
  isOpen?: boolean;
}

export const BusinessCard = ({
  id,
  name,
  category,
  image,
  rating,
  reviews,
  location,
  distance,
  priceRange,
  phone,
  isOpen = true,
}: BusinessCardProps) => {
  return (
    <Link to={`/business/${id}`}>
      <Card className="overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group">
        <div className="relative h-48 overflow-hidden">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3">
            {isOpen ? (
              <Badge className="bg-green-500 text-white">Open Now</Badge>
            ) : (
              <Badge variant="secondary">Closed</Badge>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-card opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {name}
              </h3>
              <p className="text-sm text-muted-foreground">{category}</p>
            </div>
            <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="text-sm font-semibold text-primary">{rating}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{location}</span>
            </div>
            {distance && (
              <span className="text-xs">• {distance}</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {[...Array(4)].map((_, i) => (
                <DollarSign
                  key={i}
                  className={`h-4 w-4 ${
                    i < priceRange ? "text-primary" : "text-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{reviews} reviews</span>
          </div>
        </div>
      </Card>
    </Link>
  );
};
