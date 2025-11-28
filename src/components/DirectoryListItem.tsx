import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Listing } from "@/lib/api";

interface DirectoryListItemProps {
  listing: Listing;
  rank: number;
}

export const DirectoryListItem = ({ listing, rank }: DirectoryListItemProps) => {
  const tags = listing.tags.slice(0, 3);
  const image = listing.imageUrl || listing.remoteImageUrl;

  return (
    <Link to={`/business/${listing.slug}`} className="block">
      <Card className="overflow-hidden hover:shadow-card-hover transition">
        <div className="flex gap-4 p-4">
          <div className="relative w-28 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {image ? (
              <img src={image} alt={listing.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                No image
              </div>
            )}
            <span className="absolute top-2 left-2 bg-background/90 text-xs font-semibold px-2 py-0.5 rounded-full">
              #{rank}
            </span>
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">{listing.primaryCategory || listing.tags[0]}</p>
                <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                  {listing.name || "Untitled Listing"}
                </h3>
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{listing.location || listing.address || "Koh Samui"}</span>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {listing.description || "Tap to view more details and contact information."}
              </p>
              <Button variant="secondary" size="sm" className="gap-1">
                View
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
