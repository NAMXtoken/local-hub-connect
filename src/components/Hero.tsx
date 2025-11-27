import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";

export const Hero = () => {
  return (
    <div className="relative h-[500px] w-full overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/70 to-background" />
      </div>

      <div className="relative container mx-auto px-4 h-full flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
          Discover Local Businesses
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
          Find the best restaurants, shops, services and more in your area
        </p>

        <div className="w-full max-w-3xl">
          <div className="flex flex-col sm:flex-row gap-3 bg-card p-3 rounded-xl shadow-card-hover">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search businesses, categories, or keywords..."
                className="pl-10 h-12 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <Button size="lg" className="h-12 px-8 bg-gradient-hero hover:opacity-90 transition-opacity">
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
