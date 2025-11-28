import { Search, Menu, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLayoutPreference } from "@/contexts/layout-preference";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { viewMode, setViewMode } = useLayoutPreference();

  const ViewToggle = (
    <div className="hidden md:flex items-center gap-1 rounded-full border border-border p-1 bg-background/80">
      <Button
        variant={viewMode === "classic" ? "default" : "ghost"}
        size="sm"
        className="rounded-full px-3 text-xs"
        onClick={() => setViewMode("classic")}
      >
        Classic
      </Button>
      <Button
        variant={viewMode === "explorer" ? "default" : "ghost"}
        size="sm"
        className="rounded-full px-3 text-xs"
        onClick={() => setViewMode("explorer")}
      >
        Explorer
      </Button>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-hero">
              <MapPin className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">BizDirectory</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/directory" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Directory
            </Link>
            <Link to="/categories" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Categories
            </Link>
            <Button variant="default" size="sm">
              Add Business
            </Button>
          </nav>

          {ViewToggle}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {isMenuOpen && (
          <div className="border-t border-border py-4 md:hidden">
            <nav className="flex flex-col gap-4">
              <Link to="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/directory" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Directory
              </Link>
              <Link to="/categories" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Categories
              </Link>
              <Button variant="default" size="sm" className="w-full">
                Add Business
              </Button>
              <div className="pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Directory view</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "classic" ? "default" : "secondary"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setViewMode("classic")}
                  >
                    Classic
                  </Button>
                  <Button
                    variant={viewMode === "explorer" ? "default" : "secondary"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setViewMode("explorer")}
                  >
                    Explorer
                  </Button>
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
