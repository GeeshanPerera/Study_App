import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Clock, Target, Award, Play, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import FocusScoreRing from "@/components/FocusScoreRing";
import { useAppStore } from "@/lib/store";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const MOCK_WEEKLY = [
  { day: "Mon", hours: 2.5, score: 78 },
  { day: "Tue", hours: 3.0, score: 82 },
  { day: "Wed", hours: 1.5, score: 65 },
  { day: "Thu", hours: 4.0, score: 91 },
  { day: "Fri", hours: 2.0, score: 70 },
  { day: "Sat", hours: 5.0, score: 88 },
  { day: "Sun", hours: 1.0, score: 55 },
];

export default function Analytics() {
  const navigate = useNavigate();
  const { stats, sessions } = useAppStore();

  const hours = Math.floor(stats.totalStudyTime / 60);
  const mins = stats.totalStudyTime % 60;
  const weeklyTotal = MOCK_WEEKLY.reduce((a, b) => a + b.hours, 0);
  const bestDay = MOCK_WEEKLY.reduce((a, b) => (b.score > a.score ? b : a));

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto pb-24">
      <motion.div initial="hidden" animate="visible" className="space-y-4">
        {/* Header */}
        <motion.div custom={0} variants={fadeUp} className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-heading font-bold">Analytics</h1>
        </motion.div>

        {/* Focus Score */}
        <motion.div custom={1} variants={fadeUp} className="bento-item flex items-center gap-6">
          <FocusScoreRing score={stats.focusScore} size={110} />
          <div>
            <h3 className="font-heading font-semibold text-lg">Overall Focus</h3>
            <p className="text-sm text-muted-foreground">Based on your study patterns</p>
            <div className="flex items-center gap-1 mt-2 text-success">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+5% this week</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div custom={2} variants={fadeUp} className="grid grid-cols-3 gap-3">
          {[
            { icon: Clock, label: "Study Time", value: `${hours}h ${mins}m`, color: "text-primary" },
            { icon: Target, label: "Tasks Done", value: `${stats.completedTasks}`, color: "text-success" },
            { icon: Award, label: "Sessions", value: `${sessions.length}`, color: "text-accent" },
          ].map((stat) => (
            <div key={stat.label} className="bento-item text-center">
              <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-lg font-heading font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Weekly Study Chart */}
        <motion.div custom={3} variants={fadeUp} className="bento-item">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold">Weekly Study</h3>
            <span className="text-sm text-muted-foreground">{weeklyTotal.toFixed(1)}h total</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={MOCK_WEEKLY}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                formatter={(v: number) => [`${v}h`, "Study"]}
              />
              <Bar dataKey="hours" fill="hsl(190, 60%, 38%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Focus Trend */}
        <motion.div custom={4} variants={fadeUp} className="bento-item">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold">Focus Trend</h3>
            <span className="text-sm text-success">Best: {bestDay.day} ({bestDay.score})</span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={MOCK_WEEKLY}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                formatter={(v: number) => [v, "Score"]}
              />
              <Line type="monotone" dataKey="score" stroke="hsl(220, 70%, 55%)" strokeWidth={2.5} dot={{ fill: "hsl(220, 70%, 55%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Best Performance */}
        <motion.div custom={5} variants={fadeUp} className="bento-item gradient-primary text-primary-foreground">
          <h3 className="font-heading font-semibold mb-1">🏆 Best Performance</h3>
          <p className="text-sm opacity-90">{bestDay.day} — {bestDay.hours}h of focused study with a score of {bestDay.score}</p>
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
                path === "/analytics" ? "text-primary" : "text-muted-foreground hover:text-foreground"
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
