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
    <div className="h-screen bg-background w-full">
      <motion.div initial="hidden" animate="visible" className="h-full flex flex-col">
        {/* Header */}
        <motion.div custom={0} variants={fadeUp} className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Focus Assistance</h1>
          </div>
        </motion.div>

        {/* Main Actions */}
        <motion.div custom={1} variants={fadeUp} className="grid grid-cols-2 gap-4 flex-1 min-h-0 p-4 pt-0">
          <Button
            onClick={() => navigate("/study")}
            className="h-full w-full rounded-2xl gradient-primary text-primary-foreground flex flex-col items-center justify-center gap-3 text-2xl font-heading font-semibold transition-all"
          >
            <Play className="w-8 h-8" />
            Start Study
          </Button>
          <Button
            onClick={() => navigate("/schedule")}
            variant="outline"
            className="h-full w-full rounded-2xl flex flex-col items-center justify-center gap-3 text-2xl font-heading font-semibold bg-card hover:bg-muted transition-all"
          >
            <Calendar className="w-8 h-8 text-accent" />
            Schedule
          </Button>
        </motion.div>


      </motion.div>

    </div>
  );
}
