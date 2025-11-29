import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Globe, Mail, Share2, Heart, Instagram, Facebook, Map, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useListing } from "@/hooks/use-listings";
import { BusinessMap } from "@/components/BusinessMap";
import { useAnonUserId } from "@/hooks/use-anon-user-id";
import { useBumpMutation, useBumpStats } from "@/hooks/use-bumps";
import type { BumpMutationError } from "@/types/bumps";

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

type ContactType = "phone" | "email" | "whatsapp" | "line";

const contactGroups = useMemo(
    () => [
      { label: "Phone", icon: Phone, values: listing?.contacts?.phone ?? [], type: "phone" as ContactType },
      { label: "Email", icon: Mail, values: listing?.contacts?.email ?? [], type: "email" as ContactType },
      { label: "WhatsApp", icon: Phone, values: listing?.contacts?.whatsapp ?? [], type: "whatsapp" as ContactType },
      { label: "Line", icon: Phone, values: listing?.contacts?.line ?? [], type: "line" as ContactType },
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

const buildContactHref = (type: ContactType, rawValue: string): string | null => {
  if (!rawValue) return null;
  switch (type) {
    case "phone": {
      const sanitized = rawValue.replace(/[^0-9+]/g, "");
      return sanitized ? `tel:${sanitized}` : null;
    }
    case "email":
      return `mailto:${rawValue}`;
    case "whatsapp": {
      const digits = rawValue.replace(/[^0-9]/g, "");
      return digits ? `https://wa.me/${digits}` : null;
    }
    case "line": {
      const handle = rawValue.startsWith("@") ? rawValue.slice(1) : rawValue;
      return handle ? `https://line.me/R/ti/p/${encodeURIComponent(handle)}` : null;
    }
    default:
      return null;
  }
};

const extractInstagramEmbed = (postUrl: string): string | null => {
  try {
    const parsed = new URL(postUrl);
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length < 2) {
      return null;
    }
    const [type, shortcode] = segments;
    const valid = ["p", "reel", "tv"];
    if (!valid.includes(type)) {
      return null;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "https://instagram.com";
    return `https://www.instagram.com/${type}/${shortcode}/embed/?cr=1&v=14&wp=540&rd=${encodeURIComponent(origin)}`;
  } catch {
    return null;
  }
};

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
        onError: (error: BumpMutationError) => {
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
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" aria-label="Share listing">
                    <Share2 className="h-5 w-5" />
                  </Button>
                  <Button variant="secondary" asChild>
                    <Link to={`/business/${listing.slug}/claim`}>Claim this profile</Link>
                  </Button>
                </div>
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

            {listing.featuredInstagramPosts?.length ? (
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Instagram className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Instagram Highlights</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Posts shared directly by the business. Tap a tile to open the original on Instagram.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listing.featuredInstagramPosts.slice(0, 6).map((postUrl, index) => {
                    const embedSrc = extractInstagramEmbed(postUrl);
                    return (
                      <div key={`${postUrl}-${index}`} className="rounded-xl border overflow-hidden bg-muted/30">
                        {embedSrc ? (
                          <iframe
                            title={`Instagram post ${index + 1}`}
                            src={embedSrc}
                            className="w-full"
                            style={{ border: "none", minHeight: 520 }}
                            loading="lazy"
                            allow="encrypted-media"
                            scrolling="no"
                            frameBorder={0}
                          />
                        ) : (
                          <a
                            href={postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ImageIcon className="h-8 w-8" />
                            <span className="text-xs break-all">{postUrl}</span>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ) : null}

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
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{group.label}</p>
                        <div className="flex flex-col gap-2">
                          {group.values.map((value) => {
                            const href = buildContactHref(group.type, value);
                            if (!href) {
                              return (
                                <span key={value} className="text-sm text-muted-foreground">
                                  {value}
                                </span>
                              );
                            }
                            const openInNewTab = href.startsWith("http");
                            return (
                              <Button
                                key={`${group.type}-${value}`}
                                variant="outline"
                                size="sm"
                                asChild
                                className="justify-start gap-2"
                              >
                                <a
                                  href={href}
                                  target={openInNewTab ? "_blank" : undefined}
                                  rel={openInNewTab ? "noopener noreferrer" : undefined}
                                >
                                  <group.icon className="h-4 w-4" />
                                  <span className="text-sm">{value}</span>
                                </a>
                              </Button>
                            );
                          })}
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
