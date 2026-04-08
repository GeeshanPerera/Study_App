import { useState, useCallback } from "react";

export type TaskPriority = "high" | "medium" | "low";
export type TaskCategory = "study" | "work" | "personal";
export type TaskRepeat = "none" | "daily" | "weekly";
export type StudyMode = "pomodoro" | "deepwork" | "custom";
export type FocusLevel = "high" | "medium" | "low";

export interface Task {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date?: string;
  dayOfWeek?: number;
  type: "daily" | "weekly" | "everyday" | "custom";
  priority: TaskPriority;
  category: TaskCategory;
  repeat: TaskRepeat;
  completed?: boolean;
}

export interface BehaviorLog {
  timestamp: string;
  presence: boolean;
  movementLevel: FocusLevel;
  focusScore: number;
}

export interface StudySession {
  id: string;
  startTime: string;
  endTime?: string;
  duration: number;
  mode: StudyMode;
  focusScore: number;
  completed: boolean;
}

export interface UserStats {
  totalStudyTime: number;
  focusScore: number;
  completedTasks: number;
  streak: number;
  points: number;
  level: "Beginner" | "Intermediate" | "Advanced" | "Focus Master";
}

const STORAGE_KEY = "studydesk_data";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { tasks: [], behaviorLogs: [], sessions: [], stats: { totalStudyTime: 0, focusScore: 75, completedTasks: 0, streak: 3, points: 150, level: "Beginner" } };
}

function saveData(data: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useAppStore() {
  const [data, setData] = useState(loadData);

  const updateData = useCallback((updater: (prev: any) => any) => {
    setData((prev: any) => {
      const next = updater(prev);
      saveData(next);
      return next;
    });
  }, []);

  const addTask = useCallback((task: Task) => {
    updateData((prev: any) => ({ ...prev, tasks: [...prev.tasks, task] }));
  }, [updateData]);

  const deleteTask = useCallback((id: string) => {
    updateData((prev: any) => ({ ...prev, tasks: prev.tasks.filter((t: Task) => t.id !== id) }));
  }, [updateData]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    updateData((prev: any) => ({
      ...prev,
      tasks: prev.tasks.map((t: Task) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  }, [updateData]);

  const addSession = useCallback((session: StudySession) => {
    updateData((prev: any) => {
      const newStats = { ...prev.stats };
      newStats.totalStudyTime += session.duration;
      newStats.completedTasks += session.completed ? 1 : 0;
      newStats.points += session.completed ? Math.round(session.focusScore / 2) : 5;
      if (newStats.points >= 1000) newStats.level = "Focus Master";
      else if (newStats.points >= 500) newStats.level = "Advanced";
      else if (newStats.points >= 200) newStats.level = "Intermediate";
      return { ...prev, sessions: [...prev.sessions, session], stats: newStats };
    });
  }, [updateData]);

  const addBehaviorLog = useCallback((log: BehaviorLog) => {
    updateData((prev: any) => ({ ...prev, behaviorLogs: [...prev.behaviorLogs, log] }));
  }, [updateData]);

  return {
    tasks: data.tasks as Task[],
    sessions: data.sessions as StudySession[],
    behaviorLogs: data.behaviorLogs as BehaviorLog[],
    stats: data.stats as UserStats,
    addTask,
    deleteTask,
    updateTask,
    addSession,
    addBehaviorLog,
  };
}
