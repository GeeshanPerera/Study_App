import CircularProgress from "./CircularProgress";

interface FocusScoreRingProps {
  score: number;
  size?: number;
}

export default function FocusScoreRing({ score, size = 120 }: FocusScoreRingProps) {
  const color = score >= 70 ? "text-focus-high" : score >= 40 ? "text-focus-medium" : "text-focus-low";
  const label = score >= 70 ? "High Focus" : score >= 40 ? "Medium" : "Low Focus";

  return (
    <CircularProgress progress={score} size={size} strokeWidth={6}>
      <div className="text-center">
        <span className={`text-2xl font-heading font-bold ${color}`}>{score}</span>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CircularProgress>
  );
}
