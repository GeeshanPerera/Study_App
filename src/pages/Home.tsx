import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Calendar, Clock, Target, Flame, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import FocusScoreRing from "@/components/FocusScoreRing";
import { useAppStore } from "@/lib/store";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

export default function Home() {
  const navigate = useNavigate();
  const { tasks, stats } = useAppStore();

  const now = new Date();
  const currentHour = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  const activeTasks = tasks.filter((t) => t.startTime <= currentHour && t.endTime > currentHour);
  const upcomingTasks = tasks.filter((t) => t.startTime > currentHour).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const hours = Math.floor(stats.totalStudyTime / 60);
  const mins = stats.totalStudyTime % 60;

  return (
    <div className="min-h-screen bg-background p-4 pb-24 max-w-lg mx-auto">
      <motion.div initial="hidden" animate="visible" className="space-y-4">
        {/* Header */}
        <motion.div custom={0} variants={fadeUp} className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">StudyDesk</h1>
            <p className="text-sm text-muted-foreground">Smart Study Assistant</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bento-item !p-2 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-warning" />
              <span className="text-sm font-semibold">{stats.streak}</span>
            </div>
          </div>
        </motion.div>

        {/* Main Actions */}
        <motion.div custom={1} variants={fadeUp} className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate("/study")}
            className="h-28 rounded-2xl gradient-primary text-primary-foreground flex flex-col gap-2 text-lg font-heading font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Play className="w-8 h-8" />
            Start Study
          </Button>
          <Button
            onClick={() => navigate("/schedule")}
            variant="outline"
            className="h-28 rounded-2xl flex flex-col gap-2 text-lg font-heading font-semibold bg-card hover:bg-muted transition-all"
          >
            <Calendar className="w-8 h-8 text-accent" />
            Schedule
          </Button>
        </motion.div>

        {/* Bento Stats Grid */}
        <motion.div custom={2} variants={fadeUp} className="grid grid-cols-2 gap-3">
          {/* Focus Score */}
          <div className="bento-item col-span-1 flex flex-col items-center justify-center">
            <FocusScoreRing score={stats.focusScore} size={100} />
            <p className="text-xs text-muted-foreground mt-1">Focus Score</p>
          </div>

          {/* Quick Stats */}
          <div className="space-y-3">
            <div className="bento-item flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{hours}h {mins}m</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
            <div className="bento-item flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold">{stats.completedTasks}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Gamification */}
        <motion.div custom={3} variants={fadeUp} className="bento-item">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">{stats.level}</p>
                <p className="text-xs text-muted-foreground">{stats.points} XP</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-warning">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-semibold">Level Up!</span>
            </div>
          </div>
          <div className="mt-3 w-full bg-muted rounded-full h-2">
            <motion.div
              className="h-2 rounded-full gradient-primary"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((stats.points % 200) / 2, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Active Task */}
        {activeTasks.length > 0 && (
          <motion.div custom={4} variants={fadeUp} className="bento-item border-l-4 border-l-primary">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Now</p>
            <p className="font-heading font-semibold mt-1">{activeTasks[0].title}</p>
            <p className="text-sm text-muted-foreground">{activeTasks[0].startTime} – {activeTasks[0].endTime}</p>
          </motion.div>
        )}

        {/* Upcoming */}
        {upcomingTasks.length > 0 && (
          <motion.div custom={5} variants={fadeUp} className="bento-item">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Up Next</p>
            {upcomingTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.startTime} – {task.endTime}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  task.priority === "high" ? "bg-destructive/10 text-destructive" :
                  task.priority === "medium" ? "bg-warning/10 text-warning" :
                  "bg-muted text-muted-foreground"
                }`}>{task.priority}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* IoT Status */}
        <motion.div custom={6} variants={fadeUp} className="bento-item flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
          <div>
            <p className="text-sm font-medium">Smart Desk Connected</p>
            <p className="text-xs text-muted-foreground">Monitoring your study behavior</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-lg border-t border-border p-2">
        <div className="max-w-lg mx-auto flex justify-around">
          {[
            { icon: Play, label: "Home", path: "/" },
            { icon: Calendar, label: "Schedule", path: "/schedule" },
            { icon: Target, label: "Analytics", path: "/analytics" },
          ].map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
                path === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
