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
  const [activeField, setActiveField] = useState<"startHour" | "startMinute" | "endHour" | "endMinute" | "day" | "month" | "year" | null>(null);
  const [keyboardEnabled, setKeyboardEnabled] = useState(true);
  const [freshInput, setFreshInput] = useState(false);
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
    setActiveField(null);
    setFreshInput(false);
  };

  const activateField = (field: "startHour" | "startMinute" | "endHour" | "endMinute" | "day" | "month" | "year") => {
    if (!keyboardEnabled) return;
    setActiveField(field);
    setFreshInput(true);
  };

  const getFieldValue = (field: "startHour" | "startMinute" | "endHour" | "endMinute" | "day" | "month" | "year") => {
    if (field === "startHour") return startParts.hour;
    if (field === "startMinute") return startParts.minute;
    if (field === "endHour") return endParts.hour;
    if (field === "endMinute") return endParts.minute;
    if (field === "day") return dateParts.day.toString().padStart(2, "0");
    if (field === "month") return dateParts.month.toString().padStart(2, "0");
    return dateParts.year.toString();
  };

  const setFieldValue = (field: "startHour" | "startMinute" | "endHour" | "endMinute" | "day" | "month" | "year", value: string) => {
    if (field === "startHour") {
      setForm((f) => ({ ...f, startTime: `${value}:${startParts.minute}` }));
      return;
    }
    if (field === "startMinute") {
      setForm((f) => ({ ...f, startTime: `${startParts.hour}:${value}` }));
      return;
    }
    if (field === "endHour") {
      setForm((f) => ({ ...f, endTime: `${value}:${endParts.minute}` }));
      return;
    }
    if (field === "endMinute") {
      setForm((f) => ({ ...f, endTime: `${endParts.hour}:${value}` }));
      return;
    }
    if (field === "day") {
      setForm((f) => ({ ...f, date: `${dateParts.year.toString().padStart(4, "0")}-${dateParts.month.toString().padStart(2, "0")}-${value}` }));
      return;
    }
    if (field === "month") {
      setForm((f) => ({ ...f, date: `${dateParts.year.toString().padStart(4, "0")}-${value}-${dateParts.day.toString().padStart(2, "0")}` }));
      return;
    }
    setForm((f) => ({ ...f, date: `${value}-${dateParts.month.toString().padStart(2, "0")}-${dateParts.day.toString().padStart(2, "0")}` }));
  };

  const pressDigit = (digit: string) => {
    if (!activeField || !keyboardEnabled) return;
    const maxLength = activeField === "year" ? 4 : 2;
    const current = getFieldValue(activeField);
    const next = freshInput ? digit : (current + digit).slice(-maxLength);
    const padded = activeField === "year" ? next : next.padStart(2, "0");
    setFieldValue(activeField, padded);
    setFreshInput(false);
  };

  const pressBackspace = () => {
    if (!activeField || !keyboardEnabled) return;
    const current = getFieldValue(activeField);
    const trimmed = current.slice(0, -1);
    const normalized = activeField === "year" ? (trimmed || "0") : (trimmed || "00").padStart(2, "0");
    setFieldValue(activeField, normalized);
    setFreshInput(false);
  };

  const handleSave = () => {
    const safeStart = `${startParts.hour.padStart(2, "0")}:${startParts.minute.padStart(2, "0")}`;
    const safeEnd = `${endParts.hour.padStart(2, "0")}:${endParts.minute.padStart(2, "0")}`;
    const safeYear = dateParts.year.toString().padStart(4, "0");
    const safeMonth = Math.min(12, Math.max(1, dateParts.month)).toString().padStart(2, "0");
    const safeDay = Math.min(daysInMonth(Number(safeYear), Number(safeMonth)), Math.max(1, dateParts.day)).toString().padStart(2, "0");
    const taskData = { ...form, startTime: safeStart, endTime: safeEnd, date: `${safeYear}-${safeMonth}-${safeDay}`, title: form.category, type: activeTab };
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
        setActiveField(null);
        setFreshInput(false);
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
            onClick={() => {
              setShowForm(false);
              setActiveField(null);
            }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-card w-full max-w-lg rounded-t-3xl p-4 max-h-[92vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
              onClickCapture={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest(".keypad-input") || target.closest(".custom-keypad")) return;
                setActiveField(null);
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-heading font-bold">{editingId ? "Edit" : "New"} Task</h2>
                <button type="button" onClick={() => { setShowForm(false); setActiveField(null); }} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
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

              <div className={`space-y-4 overflow-y-auto pr-1 ${keyboardEnabled && activeField ? "pb-36" : "pb-2"}`}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Start</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        readOnly
                        value={startParts.hour}
                        onFocus={() => activateField("startHour")}
                        onClick={() => activateField("startHour")}
                        className="keypad-input w-full h-11 px-3 rounded-xl bg-white text-black text-base font-bold border border-border focus:ring-2 focus:ring-primary outline-none"
                      />
                      <input
                        type="text"
                        readOnly
                        value={startParts.minute}
                        onFocus={() => activateField("startMinute")}
                        onClick={() => activateField("startMinute")}
                        className="keypad-input w-full h-11 px-3 rounded-xl bg-white text-black text-base font-bold border border-border focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">End</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        readOnly
                        value={endParts.hour}
                        onFocus={() => activateField("endHour")}
                        onClick={() => activateField("endHour")}
                        className="keypad-input w-full h-11 px-3 rounded-xl bg-white text-black text-base font-bold border border-border focus:ring-2 focus:ring-primary outline-none"
                      />
                      <input
                        type="text"
                        readOnly
                        value={endParts.minute}
                        onFocus={() => activateField("endMinute")}
                        onClick={() => activateField("endMinute")}
                        className="keypad-input w-full h-11 px-3 rounded-xl bg-white text-black text-base font-bold border border-border focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                </div>

                {activeTab === "custom" && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        readOnly
                        value={dateParts.day.toString().padStart(2, "0")}
                        onFocus={() => activateField("day")}
                        onClick={() => activateField("day")}
                        className="keypad-input w-full h-11 px-3 rounded-xl bg-white text-black text-base font-bold border border-border focus:ring-2 focus:ring-primary outline-none"
                      />
                      <input
                        type="text"
                        readOnly
                        value={dateParts.month.toString().padStart(2, "0")}
                        onFocus={() => activateField("month")}
                        onClick={() => activateField("month")}
                        className="keypad-input w-full h-11 px-3 rounded-xl bg-white text-black text-base font-bold border border-border focus:ring-2 focus:ring-primary outline-none"
                      />
                      <input
                        type="text"
                        readOnly
                        value={dateParts.year.toString()}
                        onFocus={() => activateField("year")}
                        onClick={() => activateField("year")}
                        className="keypad-input w-full h-11 px-3 rounded-xl bg-white text-black text-base font-bold border border-border focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                )}

                {activeTab === "weekly" && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Day of Week</label>
                    <div className="flex gap-1.5">
                      {DAYS.map((d, i) => (
                        <button
                          type="button"
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
                        type="button"
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
                        type="button"
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

                {keyboardEnabled && activeField && (
                  <div className="custom-keypad fixed bottom-3 left-1/2 -translate-x-1/2 w-[min(calc(100%-1.5rem),32rem)] rounded-2xl border border-border bg-muted p-2 shadow-xl z-[60]">
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <button
                          type="button"
                          key={n}
                          onClick={() => pressDigit(String(n))}
                          className="h-10 rounded-lg bg-card text-foreground font-semibold hover:bg-background"
                        >
                          {n}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={pressBackspace}
                        className="h-10 rounded-lg bg-card text-foreground font-semibold hover:bg-background"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => pressDigit("0")}
                        className="h-10 rounded-lg bg-card text-foreground font-semibold hover:bg-background"
                      >
                        0
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveField(null)}
                        className="h-10 rounded-lg bg-card text-foreground font-semibold hover:bg-background"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setKeyboardEnabled((prev) => !prev);
                    setActiveField(null);
                  }}
                  className="w-full h-10 rounded-xl bg-muted text-foreground text-sm font-medium"
                >
                  {keyboardEnabled ? "Disable Keyboard" : "Enable Keyboard"}
                </button>

                <Button onClick={handleSave} className="w-full rounded-xl gradient-primary text-primary-foreground h-11 text-base font-semibold">
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
