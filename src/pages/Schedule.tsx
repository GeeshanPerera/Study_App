import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Edit2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Task, type TaskPriority, type TaskCategory, type TaskRepeat } from "@/lib/store";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CATEGORIES: TaskCategory[] = ["study", "work", "personal"];
const PRIORITIES: TaskPriority[] = ["high", "medium", "low"];
const TABS = ["custom", "weekly", "everyday"] as const;
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 2 + i);

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function parseTime(value: string) {
  const [h = "09", m = "00"] = value.split(":");
  return { hour: h, minute: m };
}

function parseDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  const now = new Date();
  return {
    year: Number.isFinite(y) ? y : now.getFullYear(),
    month: Number.isFinite(m) ? m : now.getMonth() + 1,
    day: Number.isFinite(d) ? d : now.getDate(),
  };
}

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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("custom");
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
  const startParts = parseTime(form.startTime);
  const endParts = parseTime(form.endTime);
  const dateParts = parseDate(form.date);
  const dateDayOptions = Array.from({ length: daysInMonth(dateParts.year, dateParts.month) }, (_, i) => i + 1);
  const loadTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const payload = await res.json();
      const list = Array.isArray(payload?.tasks) ? payload.tasks : [];
      setTasks(list);
    } catch {
      toast.error("Failed to load tasks from data.json");
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

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
    const taskData = { ...form, title: form.category, type: activeTab };
    const conflicting = detectOverlap(tasks, taskData, editingId || undefined);
    if (conflicting) {
      setOverlap(conflicting);
      return;
    }
    const run = async () => {
      try {
        if (editingId) {
          const res = await fetch(`/api/tasks/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(taskData),
          });
          if (!res.ok) throw new Error("Update failed");
          setTasks((prev) => prev.map((t) => (t.id === editingId ? ({ ...t, ...taskData } as Task) : t)));
        } else {
          const newTask = { ...taskData, id: Date.now().toString() } as Task;
          const res = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTask),
          });
          if (!res.ok) throw new Error("Create failed");
          setTasks((prev) => [...prev, newTask]);
        }
        setShowForm(false);
      } catch {
        toast.error("Task save failed");
      }
    };
    void run();
  };

  const priorityColor = (p: TaskPriority) =>
    p === "high" ? "bg-destructive/10 text-destructive" :
      p === "medium" ? "bg-warning/10 text-warning" :
        "bg-muted text-muted-foreground";

  const categoryIcon = (c: TaskCategory) =>
    c === "study" ? "📚" : c === "work" ? "💼" : "🏠";

  return (
    <div className="min-h-screen bg-background p-3 max-w-lg mx-auto pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
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
      <div className="flex gap-1.5 mb-3 bg-muted rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg capitalize transition-all ${activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8 text-muted-foreground">
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
                  <p className="font-medium text-sm truncate capitalize">{task.category}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.startTime} – {task.endTime}
                    {task.type === "weekly" && task.dayOfWeek !== undefined && ` · ${DAYS[task.dayOfWeek]}`}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${priorityColor(task.priority)}`}>{task.priority}</span>
                <button onClick={() => openForm(task)} className="p-1.5 rounded-lg hover:bg-muted">
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => {
                    const run = async () => {
                      try {
                        const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
                        if (!res.ok) throw new Error("Delete failed");
                        setTasks((prev) => prev.filter((t) => t.id !== task.id));
                      } catch {
                        toast.error("Task delete failed");
                      }
                    };
                    void run();
                  }}
                  className="p-1.5 rounded-lg hover:bg-destructive/10"
                >
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
              className="bg-card w-full max-w-lg rounded-t-3xl p-4 max-h-[85vh] overflow-y-auto"
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
                    <p className="text-xs text-muted-foreground">Conflicts with {overlap.category} ({overlap.startTime}–{overlap.endTime})</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Start</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={startParts.hour}
                        onChange={(e) => setForm((f) => ({ ...f, startTime: `${e.target.value}:${startParts.minute}` }))}
                        className="w-full px-2 py-2.5 rounded-xl bg-muted text-sm focus:ring-2 focus:ring-primary outline-none"
                      >
                        {HOURS.map((h) => (
                          <option key={h} value={h}>{h}h</option>
                        ))}
                      </select>
                      <select
                        value={startParts.minute}
                        onChange={(e) => setForm((f) => ({ ...f, startTime: `${startParts.hour}:${e.target.value}` }))}
                        className="w-full px-2 py-2.5 rounded-xl bg-muted text-sm focus:ring-2 focus:ring-primary outline-none"
                      >
                        {MINUTES.map((m) => (
                          <option key={m} value={m}>{m}m</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">End</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={endParts.hour}
                        onChange={(e) => setForm((f) => ({ ...f, endTime: `${e.target.value}:${endParts.minute}` }))}
                        className="w-full px-2 py-2.5 rounded-xl bg-muted text-sm focus:ring-2 focus:ring-primary outline-none"
                      >
                        {HOURS.map((h) => (
                          <option key={h} value={h}>{h}h</option>
                        ))}
                      </select>
                      <select
                        value={endParts.minute}
                        onChange={(e) => setForm((f) => ({ ...f, endTime: `${endParts.hour}:${e.target.value}` }))}
                        className="w-full px-2 py-2.5 rounded-xl bg-muted text-sm focus:ring-2 focus:ring-primary outline-none"
                      >
                        {MINUTES.map((m) => (
                          <option key={m} value={m}>{m}m</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {activeTab === "custom" && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={dateParts.day}
                        onChange={(e) =>
                          setForm((f) => {
                            const current = parseDate(f.date);
                            const day = Number(e.target.value);
                            return {
                              ...f,
                              date: `${current.year.toString().padStart(4, "0")}-${current.month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
                            };
                          })
                        }
                        className="w-full px-2 py-2.5 rounded-xl bg-muted text-sm focus:ring-2 focus:ring-primary outline-none"
                      >
                        {dateDayOptions.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <select
                        value={dateParts.month}
                        onChange={(e) =>
                          setForm((f) => {
                            const current = parseDate(f.date);
                            const month = Number(e.target.value);
                            const maxDay = daysInMonth(current.year, month);
                            const safeDay = Math.min(current.day, maxDay);
                            return {
                              ...f,
                              date: `${current.year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${safeDay.toString().padStart(2, "0")}`,
                            };
                          })
                        }
                        className="w-full px-2 py-2.5 rounded-xl bg-muted text-sm focus:ring-2 focus:ring-primary outline-none"
                      >
                        {MONTHS.map((m, i) => (
                          <option key={m} value={i + 1}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={dateParts.year}
                        onChange={(e) =>
                          setForm((f) => {
                            const current = parseDate(f.date);
                            const year = Number(e.target.value);
                            const maxDay = daysInMonth(year, current.month);
                            const safeDay = Math.min(current.day, maxDay);
                            return {
                              ...f,
                              date: `${year.toString().padStart(4, "0")}-${current.month.toString().padStart(2, "0")}-${safeDay.toString().padStart(2, "0")}`,
                            };
                          })
                        }
                        className="w-full px-2 py-2.5 rounded-xl bg-muted text-sm focus:ring-2 focus:ring-primary outline-none"
                      >
                        {YEAR_OPTIONS.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
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
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${form.dayOfWeek === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
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
                        className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all ${form.priority === p ? priorityColor(p) + " ring-2 ring-offset-1 ring-current" : "bg-muted text-muted-foreground"
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
                        className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all ${form.category === c ? "bg-primary/10 text-primary ring-2 ring-primary/30" : "bg-muted text-muted-foreground"
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
