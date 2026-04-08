import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Pause, Play, Square, RotateCcw, Coffee, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import CircularProgress from "@/components/CircularProgress";
import { useAppStore, type StudyMode } from "@/lib/store";
import { toast } from "sonner";

const PRESETS: Record<string, { work: number; break: number; label: string }> = {
  deepwork: { work: 90 * 60, break: 5 * 60, label: "Deep Work" },
};

const DURATIONS = [
  { label: "25 min", seconds: 25 * 60 },
  { label: "45 min", seconds: 45 * 60 },
  { label: "1 hour", seconds: 60 * 60 },
  { label: "90 min", seconds: 90 * 60 },
];

export default function StudyTimer() {
  const navigate = useNavigate();
  const { addSession, addBehaviorLog } = useAppStore();
  const [mode, setMode] = useState<StudyMode>("deepwork");
  const [phase, setPhase] = useState<"setup" | "running" | "break" | "done">("setup");
  const [totalSeconds, setTotalSeconds] = useState(PRESETS.deepwork.work);
  const [elapsed, setElapsed] = useState(0);
  const [breakRemaining, setBreakRemaining] = useState(5 * 60);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<string>("");

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const startTimer = useCallback(() => {
    clearTimer();
    if (phase === "setup") startTimeRef.current = new Date().toISOString();
    setPhase("running");
    intervalRef.current = window.setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, [clearTimer, phase]);

  const stopTimer = () => {
    clearTimer();
    const duration = Math.round(elapsed / 60);
    const focusScore = Math.min(100, Math.round((elapsed / totalSeconds) * 100));
    addSession({
      id: Date.now().toString(),
      startTime: startTimeRef.current,
      endTime: new Date().toISOString(),
      duration,
      mode,
      focusScore,
      completed: elapsed >= totalSeconds,
    });
    addBehaviorLog({
      timestamp: new Date().toISOString(),
      presence: true,
      movementLevel: focusScore > 70 ? "high" : focusScore > 40 ? "medium" : "low",
      focusScore,
    });
    setPhase("done");
  };

  const startBreak = () => {
    clearTimer();
    setPhase("break");
    setBreakRemaining(5 * 60);
    intervalRef.current = window.setInterval(() => {
      setBreakRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          toast.warning("Break countdown ended! Please start the session again.", { duration: 10000 });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetTimer = () => {
    clearTimer();
    setElapsed(0);
    setPhase("setup");
  };

  const selectDuration = (seconds: number) => {
    setTotalSeconds(seconds);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = phase === "break"
    ? ((5 * 60 - breakRemaining) / (5 * 60)) * 100
    : Math.min((elapsed / totalSeconds) * 100, 100);

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/")} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-heading font-bold">Study Session</h1>
      </div>



      <AnimatePresence mode="wait">
        {phase === "done" ? (
          <motion.div
            key="done"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10 }}
              className="w-24 h-24 rounded-full gradient-success flex items-center justify-center mx-auto mb-6"
            >
              <Flame className="w-12 h-12 text-success-foreground" />
            </motion.div>
            <h2 className="text-2xl font-heading font-bold mb-2">Session Complete!</h2>

            <p className="text-muted-foreground mb-8">Great focus session. Keep it up!</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={resetTimer} variant="outline" className="rounded-xl">
                <RotateCcw className="w-4 h-4 mr-2" /> Again
              </Button>
              <Button onClick={() => navigate("/")} className="rounded-xl gradient-primary text-primary-foreground">
                Home
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="timer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            {/* Duration Target (setup only) */}
            {phase === "setup" && (
              <div className="flex flex-col mb-8 justify-center gap-2">
                <p className="text-sm text-muted-foreground mb-1">Target Duration (Optional)</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.seconds}
                      onClick={() => selectDuration(d.seconds)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${totalSeconds === d.seconds ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Timer Display */}
            <div className="flex justify-center mb-8">
              <CircularProgress progress={progress} size={240} strokeWidth={10}>
                <div>
                  {phase === "break" && (
                    <div className="flex items-center gap-1 justify-center mb-1">
                      <Coffee className="w-4 h-4 text-success" />
                      <span className="text-xs text-success font-medium">Break</span>
                    </div>
                  )}
                  <span className="text-5xl font-heading font-bold text-foreground">
                    {formatTime(phase === "break" ? breakRemaining : elapsed)}
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {phase === "running" ? "Focusing..." : phase === "break" ? "Rest up" : "Ready"}
                  </p>
                  {phase === "break" && (
                    <div className="mt-2 text-xs font-medium text-primary">
                      Study Time: {formatTime(elapsed)}
                    </div>
                  )}
                </div>
              </CircularProgress>
            </div>

            {/* Controls */}
            <div className="flex gap-3 justify-center">
              {phase === "setup" && (
                <Button onClick={startTimer} size="lg" className="rounded-2xl px-10 gradient-primary text-primary-foreground shadow-lg text-lg">
                  <Play className="w-5 h-5 mr-2" /> Start Study
                </Button>
              )}
              {phase === "running" && (
                <>
                  <Button onClick={startBreak} size="lg" variant="outline" className="rounded-2xl px-6 border-success text-success hover:bg-success/10">
                    <Coffee className="w-5 h-5 mr-2" /> Start Break
                  </Button>
                  <Button onClick={stopTimer} size="lg" variant="destructive" className="rounded-2xl px-6">
                    <Square className="w-5 h-5 mr-2" /> Stop Session
                  </Button>
                </>
              )}
              {phase === "break" && (
                <>
                  <Button onClick={startTimer} size="lg" className="rounded-2xl px-8 gradient-primary text-primary-foreground shadow-lg text-lg">
                    <Play className="w-5 h-5 mr-2" /> Start Session
                  </Button>
                  <Button onClick={stopTimer} size="lg" variant="destructive" className="rounded-2xl px-6">
                    <Square className="w-5 h-5 mr-2" /> Stop Session
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
