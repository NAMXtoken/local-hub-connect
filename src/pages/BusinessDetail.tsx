import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Globe, Mail, Share2, Heart, Instagram, Facebook, Map } from "lucide-react";
import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useListing } from "@/hooks/use-listings";
import { BusinessMap } from "@/components/BusinessMap";
import { useAnonUserId } from "@/hooks/use-anon-user-id";
import { useBumpMutation, useBumpStats } from "@/hooks/use-bumps";

const BusinessDetail = () => {
  const { slug } = useParams();
  const { data: listing, isLoading, isError } = useListing(slug);
  const userId = useAnonUserId();
  const { data: bumpStats, isLoading: bumpLoading } = useBumpStats(listing?.slug, userId ?? undefined);
  const bumpMutation = useBumpMutation();
  const [bumpError, setBumpError] = useState<string | null>(null);

  const heroImages = useMemo(() => {
    const preferred = listing?.imageUrl || listing?.remoteImageUrl;
    if (!preferred) {
      return [
        "https://placehold.co/1200x900?text=Samui+Connect",
        "https://placehold.co/600x400?text=Samui+Connect",
        "https://placehold.co/600x400?text=Samui+Connect",
      ];
    }
    return [preferred, preferred, preferred];
  }, [listing?.imageUrl, listing?.remoteImageUrl]);

  const contactGroups = useMemo(
    () => [
      { label: "Phone", icon: Phone, values: listing?.contacts?.phone ?? [] },
      { label: "Email", icon: Mail, values: listing?.contacts?.email ?? [] },
      { label: "WhatsApp", icon: Phone, values: listing?.contacts?.whatsapp ?? [] },
      { label: "Line", icon: Phone, values: listing?.contacts?.line ?? [] },
    ],
    [listing?.contacts]
  );

  const socialLinks = useMemo(
    () => [
      { icon: Globe, href: listing?.contacts?.website?.[0], label: "Website" },
      { icon: Facebook, href: listing?.contacts?.facebook?.[0], label: "Facebook" },
      { icon: Instagram, href: listing?.contacts?.instagram?.[0], label: "Instagram" },
    ].filter((entry) => Boolean(entry.href)),
    [listing?.contacts]
  );

  const hasCoordinates = useMemo(() => {
    const lat = Number(listing?.mapLatitude);
    const lng = Number(listing?.mapLongitude);
    return Number.isFinite(lat) && Number.isFinite(lng);
  }, [listing?.mapLatitude, listing?.mapLongitude]);

  const directionsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${listing?.mapLatitude},${listing?.mapLongitude}`
    : listing?.mapEmbedUrl || listing?.url;

  const handleBump = () => {
    if (!listing || !userId || bumpMutation.isPending) return;
    setBumpError(null);
    bumpMutation.mutate(
      {
        slug: listing.slug,
        listingId: listing.id,
        userId,
        category: listing.primaryCategory || listing.tags[0],
        name: listing.name,
      },
      {
        onSuccess: () => setBumpError(null),
        onError: (error: any) => {
          const message = error?.details?.error || error?.message || "Unable to bump right now";
          if (message.toLowerCase().includes("bumped")) {
            setBumpError("Easy there! You already high-fived this place today. Try again tomorrow.");
          } else {
            setBumpError(message);
          }
        },
      }
    );
  };

  const totalBumps = bumpStats?.total ?? 0;
  const lastDayBumps = bumpStats?.counts?.["24 hours"] ?? 0;
  const rawCanBump = bumpStats?.canBump ?? true;
  const nextAvailableAt = bumpStats?.nextAvailableAt ?? null;
  const isCoolingDown = Boolean(userId && nextAvailableAt && rawCanBump === false);

  const nextAvailableMessage = useMemo(() => {
    if (!nextAvailableAt) return null;
    const diff = nextAvailableAt - Date.now();
    if (diff <= 0) return "You can bump this listing now.";
    const hours = Math.ceil(diff / (1000 * 60 * 60));
    return `You can bump again in about ${hours} hour${hours === 1 ? "" : "s"}.`;
  }, [nextAvailableAt]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
          Loading listing details...
        </div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center text-destructive">
          Unable to load that listing right now.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="h-96 rounded-xl overflow-hidden">
            <img
              src={heroImages[0]}
              alt={listing.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {heroImages.slice(1).map((image, index) => (
              <div key={index} className="h-[11.5rem] rounded-xl overflow-hidden">
                <img
                  src={image}
                  alt={`${listing.name} ${index + 2}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {listing.name}
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    {listing.primaryCategory || listing.tags[0] || "Local Business"}
                  </p>
                  {listing.location && (
                    <div className="flex items-center gap-2 text-muted-foreground mt-2">
                      <MapPin className="h-4 w-4" />
                      <span>{listing.location}</span>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
              {listing.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {listing.tags.slice(0, 6).map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">About</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {listing.description || "No description provided yet."}
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {listing.tags.length > 0 ? (
                  listing.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">No tags shared for this listing.</p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Community Love</h2>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-3xl font-bold text-primary">{totalBumps}</p>
                    <p className="text-sm text-muted-foreground">All-time bumps</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-foreground">{lastDayBumps}</p>
                    <p className="text-sm text-muted-foreground">Past 24 hours</p>
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={handleBump}
                  disabled={!listing || bumpLoading || bumpMutation.isPending || !userId || isCoolingDown}
                  variant={!userId || isCoolingDown ? "secondary" : "default"}
                  className="gap-2"
                >
                  <Heart className={`h-5 w-5 ${isCoolingDown ? "fill-current" : ""}`} />
                  {!userId
                    ? "Preparing..."
                    : isCoolingDown
                      ? "Come back soon"
                      : "Bump This Business"}
                </Button>
                {bumpLoading && <p className="text-sm text-muted-foreground">Checking bump status...</p>}
                {isCoolingDown && nextAvailableMessage && (
                  <p className="text-sm text-muted-foreground">{nextAvailableMessage}</p>
                )}
                {bumpError && <p className="text-sm text-destructive">{bumpError}</p>}
              </div>
              <p className="text-sm text-muted-foreground">
                Show your appreciation for great service and help this business gain visibility in the directory!
              </p>
            </Card>

            {socialLinks.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Online Presence</h2>
                <div className="flex flex-wrap gap-4">
                  {socialLinks.map(({ icon: Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </a>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Visit Us</h2>
              <div className="space-y-4">
                {listing.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium text-foreground">Address</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {listing.address}
                      </p>
                    </div>
                  </div>
                )}
                {contactGroups.map((group) => (
                  group.values.length > 0 && (
                    <div key={group.label} className="flex items-start gap-3">
                      <group.icon className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium text-foreground">{group.label}</p>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {group.values.map((value) => (
                            <div key={value}>{value}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Location Map</h2>
                {directionsUrl && (
                  <Button
                    size="sm"
                    variant="default"
                    asChild
                    className="gap-2"
                  >
                    <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                      <Map className="h-4 w-4" />
                      Get Directions
                    </a>
                  </Button>
                )}
              </div>
              <BusinessMap listing={listing} />
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Share This Listing</h2>
              <p className="text-muted-foreground mb-4">
                Help spread the word about this business and support the local community.
              </p>
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="w-full">
                  Share on Facebook
                </Button>
                <Button variant="outline" className="w-full">
                  Share on Instagram
                </Button>
                <Button variant="outline" className="w-full">
                  Copy Link
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;
