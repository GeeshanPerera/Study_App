import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Edit2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore, type Task, type TaskPriority, type TaskCategory, type TaskRepeat } from "@/lib/store";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CATEGORIES: TaskCategory[] = ["study", "work", "personal"];
const PRIORITIES: TaskPriority[] = ["high", "medium", "low"];
const TABS = ["daily", "weekly", "everyday", "custom"] as const;

function detectOverlap(tasks: Task[], newTask: Partial<Task>, excludeId?: string): Task | undefined {
  return tasks.find(
    (t) =>
      t.id !== excludeId &&
      t.startTime < (newTask.endTime || "") &&
      t.endTime > (newTask.startTime || "")
  );
}

export default function Schedule() {
  const navigate = useNavigate();
  const { tasks, addTask, deleteTask, updateTask } = useAppStore();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("daily");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    startTime: "09:00",
    endTime: "10:00",
    date: new Date().toISOString().slice(0, 10),
    dayOfWeek: 1,
    priority: "medium" as TaskPriority,
    category: "study" as TaskCategory,
    repeat: "none" as TaskRepeat,
  });
  const [overlap, setOverlap] = useState<Task | null>(null);

  const filteredTasks = tasks.filter((t) => t.type === activeTab);

  const openForm = (task?: Task) => {
    if (task) {
      setEditingId(task.id);
      setForm({
        title: task.title,
        startTime: task.startTime,
        endTime: task.endTime,
        date: task.date || new Date().toISOString().slice(0, 10),
        dayOfWeek: task.dayOfWeek || 1,
        priority: task.priority,
        category: task.category,
        repeat: task.repeat,
      });
    } else {
      setEditingId(null);
      setForm({ title: "", startTime: "09:00", endTime: "10:00", date: new Date().toISOString().slice(0, 10), dayOfWeek: 1, priority: "medium", category: "study", repeat: "none" });
    }
    setShowForm(true);
    setOverlap(null);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    const taskData = { ...form, type: activeTab };
    const conflicting = detectOverlap(tasks, taskData, editingId || undefined);
    if (conflicting) {
      setOverlap(conflicting);
      return;
    }
    if (editingId) {
      updateTask(editingId, taskData);
    } else {
      addTask({ ...taskData, id: Date.now().toString() } as Task);
    }
    setShowForm(false);
  };

  const priorityColor = (p: TaskPriority) =>
    p === "high" ? "bg-destructive/10 text-destructive" :
    p === "medium" ? "bg-warning/10 text-warning" :
    "bg-muted text-muted-foreground";

  const categoryIcon = (c: TaskCategory) =>
    c === "study" ? "📚" : c === "work" ? "💼" : "🏠";

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-heading font-bold">Schedule</h1>
        </div>
        <Button onClick={() => openForm()} size="sm" className="rounded-xl gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4 bg-muted rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg capitalize transition-all ${
              activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filteredTasks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-muted-foreground">
              <p>No {activeTab} tasks yet</p>
              <p className="text-sm mt-1">Tap + to add one</p>
            </motion.div>
          ) : (
            filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="bento-item flex items-center gap-3"
              >
                <div className="text-lg">{categoryIcon(task.category)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.startTime} – {task.endTime}
                    {task.type === "weekly" && task.dayOfWeek !== undefined && ` · ${DAYS[task.dayOfWeek]}`}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${priorityColor(task.priority)}`}>{task.priority}</span>
                <button onClick={() => openForm(task)} className="p-1.5 rounded-lg hover:bg-muted">
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => deleteTask(task.id)} className="p-1.5 rounded-lg hover:bg-destructive/10">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-card w-full max-w-lg rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-heading font-bold">{editingId ? "Edit" : "New"} Task</h2>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {overlap && (
                <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-warning">Overlap detected</p>
                    <p className="text-xs text-muted-foreground">Conflicts with "{overlap.title}" ({overlap.startTime}–{overlap.endTime})</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Study Math"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted border-0 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Start</label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">End</label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                {activeTab === "daily" && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                )}

                {activeTab === "weekly" && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Day of Week</label>
                    <div className="flex gap-1.5">
                      {DAYS.map((d, i) => (
                        <button
                          key={d}
                          onClick={() => setForm((f) => ({ ...f, dayOfWeek: i }))}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                            form.dayOfWeek === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                  <div className="flex gap-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p}
                        onClick={() => setForm((f) => ({ ...f, priority: p }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                          form.priority === p ? priorityColor(p) + " ring-2 ring-offset-1 ring-current" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                  <div className="flex gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setForm((f) => ({ ...f, category: c }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                          form.category === c ? "bg-primary/10 text-primary ring-2 ring-primary/30" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {categoryIcon(c)} {c}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSave} className="w-full rounded-xl gradient-primary text-primary-foreground h-12 text-base font-semibold">
                  {editingId ? "Update" : "Create"} Task
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
