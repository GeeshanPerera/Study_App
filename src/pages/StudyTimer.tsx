import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Pause, Play, Square, RotateCcw, Coffee, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import CircularProgress from "@/components/CircularProgress";
import { useAppStore, type StudyMode } from "@/lib/store";
import { toast } from "sonner";

const PRESETS: Record<string, { work: number; break: number; label: string }> = {
  pomodoro: { work: 25 * 60, break: 5 * 60, label: "Pomodoro" },
  deepwork: { work: 90 * 60, break: 15 * 60, label: "Deep Work" },
  custom: { work: 45 * 60, break: 10 * 60, label: "Custom" },
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
  const [mode, setMode] = useState<StudyMode>("pomodoro");
  const [phase, setPhase] = useState<"setup" | "running" | "paused" | "break" | "done">("setup");
  const [totalSeconds, setTotalSeconds] = useState(PRESETS.pomodoro.work);
  const [remaining, setRemaining] = useState(PRESETS.pomodoro.work);
  const [pomodoroCount, setPomodoroCount] = useState(0);
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
      setRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          if (mode === "pomodoro") {
            setPomodoroCount((c) => c + 1);
            setPhase("break");
            setRemaining(PRESETS.pomodoro.break);
            toast.success("Pomodoro complete! Take a break 🎉");
            return PRESETS.pomodoro.break;
          }
          setPhase("done");
          toast.success("Session Completed! 🎉");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer, mode, phase]);

  const pauseTimer = () => {
    clearTimer();
    setPhase("paused");
  };

  const stopTimer = () => {
    clearTimer();
    const duration = Math.round((totalSeconds - remaining) / 60);
    const focusScore = Math.min(100, Math.round((1 - remaining / totalSeconds) * 100));
    addSession({
      id: Date.now().toString(),
      startTime: startTimeRef.current,
      endTime: new Date().toISOString(),
      duration,
      mode,
      focusScore,
      completed: remaining === 0,
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
    setPhase("running");
    intervalRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          setRemaining(PRESETS.pomodoro.work);
          setTotalSeconds(PRESETS.pomodoro.work);
          setPhase("setup");
          toast("Break over! Ready for another round?");
          return PRESETS.pomodoro.work;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetTimer = () => {
    clearTimer();
    setRemaining(totalSeconds);
    setPhase("setup");
  };

  const selectDuration = (seconds: number) => {
    setTotalSeconds(seconds);
    setRemaining(seconds);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = phase === "break"
    ? ((PRESETS.pomodoro.break - remaining) / PRESETS.pomodoro.break) * 100
    : ((totalSeconds - remaining) / totalSeconds) * 100;

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/")} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-heading font-bold">Study Session</h1>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 mb-6">
        {(Object.entries(PRESETS) as [StudyMode, typeof PRESETS.pomodoro][]).map(([key, val]) => (
          <button
            key={key}
            onClick={() => {
              setMode(key);
              if (phase === "setup") {
                setTotalSeconds(val.work);
                setRemaining(val.work);
              }
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
              mode === key ? "gradient-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"
            }`}
          >
            {val.label}
          </button>
        ))}
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
            <p className="text-muted-foreground mb-2">
              {mode === "pomodoro" && `${pomodoroCount} pomodoro${pomodoroCount > 1 ? "s" : ""} completed`}
            </p>
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
            {/* Duration Presets (setup only) */}
            {phase === "setup" && mode !== "pomodoro" && (
              <div className="flex gap-2 mb-8 justify-center flex-wrap">
                {DURATIONS.map((d) => (
                  <button
                    key={d.seconds}
                    onClick={() => selectDuration(d.seconds)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      totalSeconds === d.seconds ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
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
                  <span className="text-5xl font-heading font-bold text-foreground">{formatTime(remaining)}</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {phase === "running" ? "Focusing..." : phase === "paused" ? "Paused" : phase === "break" ? "Rest up" : "Ready"}
                  </p>
                </div>
              </CircularProgress>
            </div>

            {/* Controls */}
            <div className="flex gap-3 justify-center">
              {phase === "setup" && (
                <Button onClick={startTimer} size="lg" className="rounded-2xl px-10 gradient-primary text-primary-foreground shadow-lg text-lg">
                  <Play className="w-5 h-5 mr-2" /> Start
                </Button>
              )}
              {phase === "running" && (
                <>
                  <Button onClick={pauseTimer} size="lg" variant="outline" className="rounded-2xl px-6">
                    <Pause className="w-5 h-5 mr-2" /> Pause
                  </Button>
                  <Button onClick={stopTimer} size="lg" variant="destructive" className="rounded-2xl px-6">
                    <Square className="w-5 h-5 mr-2" /> Stop
                  </Button>
                </>
              )}
              {phase === "paused" && (
                <>
                  <Button onClick={startTimer} size="lg" className="rounded-2xl px-6 gradient-primary text-primary-foreground">
                    <Play className="w-5 h-5 mr-2" /> Resume
                  </Button>
                  <Button onClick={stopTimer} size="lg" variant="destructive" className="rounded-2xl px-6">
                    <Square className="w-5 h-5 mr-2" /> Stop
                  </Button>
                </>
              )}
              {phase === "break" && (
                <Button onClick={startBreak} size="lg" className="rounded-2xl px-10 gradient-success text-success-foreground">
                  <Coffee className="w-5 h-5 mr-2" /> Start Break
                </Button>
              )}
            </div>

            {mode === "pomodoro" && pomodoroCount > 0 && (
              <p className="mt-4 text-sm text-muted-foreground">
                🍅 {pomodoroCount} pomodoro{pomodoroCount > 1 ? "s" : ""} done
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
