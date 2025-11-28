import { MapPin, Star, Phone, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";

interface BusinessCardProps {
  id: string;
  slug: string;
  name: string;
  category: string;
  image?: string;
  rating?: number | null;
  reviews?: number | null;
  location: string;
  distance?: string;
  priceRange?: number | null;
  phone?: string;
  isOpen?: boolean;
  bumps?: number;
}

const PLACEHOLDER_IMAGE = "https://placehold.co/600x400?text=Samui+Connect";

export const BusinessCard = ({
  id,
  slug,
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
  bumps = 0,
}: BusinessCardProps) => {
  const [bumpCount, setBumpCount] = useState(bumps);
  const [hasBumped, setHasBumped] = useState(false);

  const handleBump = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!hasBumped) {
      setBumpCount(prev => prev + 1);
      setHasBumped(true);
    }
  };

  return (
    <Link to={`/business/${slug}`} className="block">
      <Card className="overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group">
        <div className="relative h-48 overflow-hidden">
          <img
            src={image || PLACEHOLDER_IMAGE}
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
            {typeof rating === "number" ? (
              <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="text-sm font-semibold text-primary">{rating.toFixed(1)}</span>
              </div>
            ) : null}
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

          {(typeof priceRange === "number" || typeof reviews === "number") && (
            <div className="flex items-center justify-between">
              {typeof priceRange === "number" ? (
                <div className="flex items-center gap-1">
                  {[...Array(4)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-sm font-semibold ${
                        i < (priceRange ?? 0) ? "text-primary" : "text-muted"
                      }`}
                    >
                      ฿
                    </span>
                  ))}
                </div>
              ) : <span />}
              {typeof reviews === "number" ? (
                <span className="text-xs text-muted-foreground">{reviews} reviews</span>
              ) : null}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <span className="text-sm text-muted-foreground">{bumpCount} bumps</span>
            <Button
              variant={hasBumped ? "secondary" : "default"}
              size="sm"
              onClick={handleBump}
              disabled={hasBumped}
              className="gap-1"
            >
              <Heart className={`h-4 w-4 ${hasBumped ? "fill-current" : ""}`} />
              {hasBumped ? "Bumped!" : "Bump"}
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
};
