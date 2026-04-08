import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Calendar, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

export default function Home() {
  const navigate = useNavigate();
  const { stats } = useAppStore();

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


      </motion.div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-lg border-t border-border p-2">
        <div className="max-w-lg mx-auto flex justify-around">
          {[
            { icon: Play, label: "Home", path: "/" },
            { icon: Calendar, label: "Schedule", path: "/schedule" },
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
