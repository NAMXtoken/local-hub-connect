import { Trophy, TrendingUp, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import type { LeaderboardItem } from "@/hooks/use-bumps";

interface LeaderboardProps {
  items: LeaderboardItem[];
  timeframe: string;
  isLoading?: boolean;
}

export const Leaderboard = ({ items, timeframe, isLoading }: LeaderboardProps) => {
  const grouped = groupByCategory(items);
  const showSkeleton = isLoading && grouped.length === 0;

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
            Most bumped listings in the last {timeframe}
          </p>
        </div>

        {showSkeleton ? (
          <Card className="p-8 text-center text-muted-foreground">Loading leaderboard...</Card>
        ) : grouped.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Be the first to bump a listing today!
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {grouped.map(({ category, businesses }) => (
              <Card key={category} className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg text-foreground">{category}</h3>
                </div>
                <div className="space-y-3">
                  {businesses.slice(0, 3).map((business, index) => (
                    <Link
                      key={`${category}-${business.slug}`}
                      to={`/business/${business.slug}`}
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
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <Heart className="h-3 w-3 text-primary" /> {business.count}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

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

const groupByCategory = (items: LeaderboardItem[]) => {
  const map = new Map<string, LeaderboardItem[]>();
  items.forEach((item) => {
    const bucket = map.get(item.category) ?? [];
    bucket.push(item);
    map.set(item.category, bucket);
  });
  return Array.from(map.entries()).map(([category, businesses]) => ({ category, businesses }));
};
