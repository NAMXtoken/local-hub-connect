import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useListing } from "@/hooks/use-listings";
import type { Listing } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { DIRECTORY_CATEGORIES } from "@/components/CategoryGrid";

const IG_POST_SLOTS = 8;
const CATEGORY_OPTIONS = DIRECTORY_CATEGORIES.map((category) => category.name);
const LOCATION_OPTIONS = [
  "Chaweng",
  "Lamai",
  "Bophut",
  "Mae Nam",
  "Fisherman's Village",
  "Bang Rak",
  "Choeng Mon",
  "Lipa Noi",
  "Taling Ngam",
  "Nathon",
  "Other",
];

type ClaimFormState = {
  name: string;
  primaryCategory: string;
  location: string;
  address: string;
  description: string;
  website: string;
  phone: string;
  email: string;
  instagramPosts: string[];
};

const buildInitialState = (listing?: Listing | null): ClaimFormState => ({
  name: listing?.name ?? "",
  primaryCategory: listing?.primaryCategory ?? listing?.tags?.[0] ?? "",
  location: listing?.location ?? "",
  address: listing?.address ?? "",
  description: listing?.description ?? "",
  website: listing?.contacts?.website?.[0] ?? listing?.url ?? "",
  phone: listing?.contacts?.phone?.[0] ?? "",
  email: listing?.contacts?.email?.[0] ?? "",
  instagramPosts: Array.from({ length: IG_POST_SLOTS }, (_, index) => listing?.featuredInstagramPosts?.[index] ?? ""),
});

interface ClaimBusinessProps {
  mode?: "claim" | "create";
}

const ensureOption = (options: string[], current: string) => {
  if (current && !options.includes(current)) {
    return [current, ...options];
  }
  return options;
};

const ClaimBusiness = ({ mode = "claim" }: ClaimBusinessProps) => {
  const params = useParams<{ slug?: string }>();
  const slugParam = params.slug;
  const isCreateMode = mode === "create" || !slugParam;
  const activeSlug = isCreateMode ? undefined : slugParam;
  const { data: listing, isLoading: listingLoading, isError } = useListing(activeSlug);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<ClaimFormState>(() => buildInitialState());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isCreateMode && listing) {
      setFormState(buildInitialState(listing));
    }
  }, [isCreateMode, listing]);

  const handleChange = (field: keyof ClaimFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleInstagramChange = (index: number, value: string) => {
    setFormState((prev) => {
      const next = [...prev.instagramPosts];
      next[index] = value;
      return { ...prev, instagramPosts: next };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      if (isCreateMode) {
        const response = await fetch("/api/create-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formState),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error?.error || "Failed to add business");
        }
        const data = await response.json();
        const newSlug = data?.slug as string | undefined;
        toast({ title: "Business submitted", description: "Thanks! Your listing has been created." });
        queryClient.invalidateQueries({ queryKey: ["listings"], exact: false });
        if (newSlug) {
          setTimeout(() => navigate(`/business/${newSlug}`), 800);
        }
      } else {
        if (!activeSlug) {
          throw new Error("Missing business identifier");
        }
        const response = await fetch("/api/claims", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: activeSlug, ...formState }),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error?.error || "Failed to submit claim");
        }
        toast({ title: "Profile claim saved", description: "Your updates will appear shortly." });
        queryClient.invalidateQueries({ queryKey: ["listing", activeSlug] });
        queryClient.invalidateQueries({ queryKey: ["listings"], exact: false });
        setTimeout(() => navigate(`/business/${activeSlug}`), 800);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({ title: "Claim failed", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const igSlots = useMemo(() => Array.from({ length: IG_POST_SLOTS }, (_, index) => index), []);

  const heading = isCreateMode ? "Add Your Business" : "Claim this Profile";
  const lead = isCreateMode
    ? "Submit your business details below and we’ll add them to the directory."
    : "Let us know if any of the information below needs to be updated. This form is for development/testing only — a verification step will be added soon.";
  const backLinkTarget = isCreateMode ? "/directory" : activeSlug ? `/business/${activeSlug}` : "/directory";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            {!isCreateMode && activeSlug ? (
              <p className="text-sm text-muted-foreground mb-1">Claim request for {activeSlug}</p>
            ) : null}
            <h1 className="text-3xl font-bold text-foreground">{heading}</h1>
            <p className="text-muted-foreground mt-1">{lead}</p>
          </div>
          <Button variant="outline" asChild>
            <Link to={backLinkTarget}>{isCreateMode ? "Back to directory" : "Back to listing"}</Link>
          </Button>
        </div>

        {listingLoading && !isCreateMode ? (
          <Card className="p-6 text-muted-foreground">Loading business data…</Card>
        ) : isError && !isCreateMode ? (
          <Card className="p-6 text-destructive">Unable to load this business right now.</Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 space-y-4">
              <div>
                <Label htmlFor="business-name">Business Name</Label>
                <Input
                  id="business-name"
                  value={formState.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business-category">Primary Category</Label>
                  <select
                    id="business-category"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={formState.primaryCategory || ""}
                    onChange={(event) => handleChange("primaryCategory", event.target.value)}
                  >
                    <option value="">Select category</option>
                    {ensureOption(CATEGORY_OPTIONS, formState.primaryCategory).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="business-location">Location / Neighborhood</Label>
                  <select
                    id="business-location"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={formState.location || ""}
                    onChange={(event) => handleChange("location", event.target.value)}
                  >
                    <option value="">Select location</option>
                    {ensureOption(LOCATION_OPTIONS, formState.location).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="business-address">Address</Label>
                <Textarea
                  id="business-address"
                  value={formState.address}
                  onChange={(event) => handleChange("address", event.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="business-description">Description</Label>
                <Textarea
                  id="business-description"
                  value={formState.description}
                  onChange={(event) => handleChange("description", event.target.value)}
                  rows={5}
                />
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Contact Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business-phone">Phone</Label>
                  <Input
                    id="business-phone"
                    value={formState.phone}
                    onChange={(event) => handleChange("phone", event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="business-email">Email</Label>
                  <Input
                    id="business-email"
                    value={formState.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                    type="email"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="business-website">Website / Booking URL</Label>
                <Input
                  id="business-website"
                  value={formState.website}
                  onChange={(event) => handleChange("website", event.target.value)}
                />
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Instagram Posts</h2>
                <p className="text-sm text-muted-foreground">
                  Share up to {IG_POST_SLOTS} public Instagram post URLs you’d like to highlight. We’ll use Meta’s oEmbed endpoint to render them on your profile.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {igSlots.map((index) => (
                  <div key={`ig-${index}`}>
                    <Label htmlFor={`ig-post-${index}`}>Post #{index + 1}</Label>
                    <Input
                      id={`ig-post-${index}`}
                      placeholder="https://www.instagram.com/p/..."
                      value={formState.instagramPosts[index] ?? ""}
                      onChange={(event) => handleInstagramChange(index, event.target.value)}
                    />
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                {isCreateMode
                  ? "Thanks for sharing your business with the community."
                  : "We’ll review your submission and follow up with a verification step in the production release."}
              </p>
              <Button type="submit" size="lg" className="self-start md:self-auto" disabled={isSubmitting}>
                {isSubmitting
                  ? "Submitting..."
                  : isCreateMode
                    ? "Add business"
                    : "Submit claim request"}
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default ClaimBusiness;
