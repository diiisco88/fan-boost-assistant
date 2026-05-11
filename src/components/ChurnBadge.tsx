import { Badge } from "./ui/badge";

interface ChurnBadgeProps {
  score: number;
}

export function ChurnBadge({ score }: ChurnBadgeProps) {
  const rounded = Math.round(score);

  if (rounded < 30) {
    return <Badge variant="success">{rounded}</Badge>;
  }

  if (rounded < 60) {
    return <Badge variant="warning">{rounded}</Badge>;
  }

  return <Badge variant="danger">{rounded}</Badge>;
}
