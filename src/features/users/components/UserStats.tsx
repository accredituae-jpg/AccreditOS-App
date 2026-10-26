import { StatsGrid, type StatsCardItem } from "@/components/ui/stats-card";

interface UserStatsProps {
  items: StatsCardItem[];
}

export function UserStats({ items }: UserStatsProps) {
  return <StatsGrid items={items} columns={4} />;
}
