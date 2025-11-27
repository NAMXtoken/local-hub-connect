import { Trophy, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface Business {
  id: string;
  name: string;
  bumps: number;
  category: string;
  image: string;
  rating: number;
}

interface LeaderboardProps {
  businessesByCategory: Record<string, Business[]>;
}

export const Leaderboard = ({ businessesByCategory }: LeaderboardProps) => {
  const getMedalColor = (position: number) => {
    switch (position) {
      case 0:
        return "bg-amber-500";
      case 1:
        return "bg-slate-400";
      case 2:
        return "bg-amber-700";
      default:
        return "bg-muted";
    }
  };

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="h-8 w-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Top Loved Businesses
            </h2>
          </div>
          <p className="text-muted-foreground text-lg">
            Most bumped businesses by category
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(businessesByCategory).map(([category, businesses]) => (
            <Card key={category} className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg text-foreground">{category}</h3>
              </div>
              
              <div className="space-y-3">
                {businesses.slice(0, 3).map((business, index) => (
                  <Link
                    key={business.id}
                    to={`/business/${business.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors group"
                  >
                    <div className={`${getMedalColor(index)} w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate text-sm">
                        {business.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {business.bumps} bumps
                        </Badge>
                        <span>★ {business.rating}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
