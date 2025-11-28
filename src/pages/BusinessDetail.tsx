import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Globe, Mail, Share2, Heart, Instagram, Facebook } from "lucide-react";
import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useListing } from "@/hooks/use-listings";

const BusinessDetail = () => {
  const { slug } = useParams();
  const { data: listing, isLoading, isError } = useListing(slug);
  const [bumpCount, setBumpCount] = useState(0);
  const [hasBumped, setHasBumped] = useState(false);

  useEffect(() => {
    if (listing) {
      setBumpCount(Math.max(0, listing.contacts?.facebook?.length ?? 0) * 10);
      setHasBumped(false);
    }
  }, [listing]);

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

  const handleBump = () => {
    if (!hasBumped) {
      setBumpCount((prev) => prev + 1);
      setHasBumped(true);
    }
  };

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
