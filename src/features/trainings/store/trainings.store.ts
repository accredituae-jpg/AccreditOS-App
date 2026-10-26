import { create } from "zustand";
import { getStoredViewPreference, setStoredViewPreference } from "@/lib/viewPreference";
import {
  apiGetTrainings,
  apiCreateTraining,
  apiUpdateTraining,
  apiDeleteTraining,
  apiGetCourses,
  apiCreateCourse,
  apiUpdateCourse,
  apiDeleteCourse,
} from "@/lib/api";
import type { TrainingTab } from "@/lib/api/trainingApi";
import type { Training } from "../types/trainings.types";

export type { TrainingTab };

interface Course {
  id: string;
  name: string;
}

interface TabCounts {
  today: number;
  pending: number;
  completed: number;
  cancelled: number;
}

interface TrainingsState {
  // Tab-based data
  activeTab: TrainingTab;
  tabTrainings: Record<TrainingTab, Training[]>;
  tabCounts: TabCounts;
  tabPages: Record<TrainingTab, number>; // total pages per tab
  currentPage: number;

  // UI state
  courses: Course[];
  loading: boolean;
  view: "list" | "grid";
  searchQuery: string;
  dateFilter: string;
  serviceTypeFilter: "all" | "training" | "inspection";
  awardingBodyFilter: string;
  calendarMonth: Date;

  // Legacy – kept for calendar view which needs all trainings
  trainings: Training[];

  setActiveTab: (tab: TrainingTab) => void;
  setView: (view: "list" | "grid") => void;
  setCurrentPage: (page: number) => void;
  setSearchQuery: (query: string) => void;
  setDateFilter: (dateFilter: string) => void;
  setServiceTypeFilter: (serviceType: "all" | "training" | "inspection") => void;
  setAwardingBodyFilter: (awardingBody: string) => void;
  setCalendarMonth: (month: Date) => void;

  fetchTab: (
    tab: TrainingTab,
    page?: number,
    search?: string,
    dateFilter?: string,
    serviceType?: string,
    awardingBody?: string
  ) => Promise<void>;
  fetchTrainings: (serviceType?: string, awardingBody?: string) => Promise<void>;
  addTraining: (trainingData: Omit<Training, "id">, options?: { silent?: boolean }) => Promise<void>;
  updateTraining: (updatedTraining: Training) => Promise<void>;
  deleteTraining: (id: string) => Promise<void>;

  fetchCourses: () => Promise<void>;
  addCourse: (name: string) => Promise<void>;
  updateCourse: (id: string, name: string) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
}

const EMPTY_TAB_TRAININGS: Record<TrainingTab, Training[]> = {
  today: [],
  pending: [],
  completed: [],
  cancelled: [],
};

const EMPTY_TAB_COUNTS: TabCounts = {
  today: 0,
  pending: 0,
  completed: 0,
  cancelled: 0,
};

const EMPTY_TAB_PAGES: Record<TrainingTab, number> = {
  today: 1,
  pending: 1,
  completed: 1,
  cancelled: 1,
};

function parseTrainingDateTime(regDateStr: string, timeStr: string): number {
  if (!regDateStr) return 0;
  const parts = regDateStr.split("-").map(Number);
  if (parts.length !== 3) return 0;
  const [day, month, year] = parts;

  let hours = 0;
  let minutes = 0;

  if (timeStr) {
    const isPM = /pm/i.test(timeStr);
    const isAM = /am/i.test(timeStr);
    const timeClean = timeStr.replace(/(am|pm)/i, "").trim();
    const timeParts = timeClean.split(":").map(Number);
    if (timeParts.length >= 1) {
      hours = timeParts[0] || 0;
      minutes = timeParts[1] || 0;
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
    }
  }

  return new Date(year, month - 1, day, hours, minutes).getTime();
}

function sortTrainingsDesc(trainings: Training[]): Training[] {
  return [...trainings].sort((a, b) => {
    const timeA = parseTrainingDateTime(a.regDate, a.time);
    const timeB = parseTrainingDateTime(b.regDate, b.time);
    return timeB - timeA;
  });
}

export const useTrainingsStore = create<TrainingsState>((set, get) => ({
  activeTab: "today",
  tabTrainings: EMPTY_TAB_TRAININGS,
  tabCounts: EMPTY_TAB_COUNTS,
  tabPages: EMPTY_TAB_PAGES,
  currentPage: 1,
  courses: [],
  loading: false,
  view: getStoredViewPreference(),
  searchQuery: "",
  dateFilter: "",
  serviceTypeFilter: "all",
  awardingBodyFilter: "all",
  calendarMonth: new Date(),
  trainings: [],

  setActiveTab: (tab) => {
    set({ activeTab: tab, currentPage: 1 });
    // Always re-fetch when switching tabs to get fresh data
    get().fetchTab(
      tab,
      1,
      get().searchQuery,
      get().dateFilter,
      get().serviceTypeFilter,
      get().awardingBodyFilter
    );
  },

  setView: (view) => {
    setStoredViewPreference(view);
    set({ view });
    if (view === "grid" && get().trainings.length === 0) {
      get().fetchTrainings(get().serviceTypeFilter, get().awardingBodyFilter);
    }
  },
  setCurrentPage: (currentPage) => set({ currentPage }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setDateFilter: (dateFilter) => {
    set({
      dateFilter,
      currentPage: 1,
      tabPages: EMPTY_TAB_PAGES,
      tabTrainings: EMPTY_TAB_TRAININGS,
    });
    get().fetchTab(
      get().activeTab,
      1,
      get().searchQuery,
      dateFilter,
      get().serviceTypeFilter,
      get().awardingBodyFilter
    );
    if (get().view === "grid") {
      get().fetchTrainings(get().serviceTypeFilter, get().awardingBodyFilter);
    }
  },
  setServiceTypeFilter: (serviceTypeFilter) => {
    set({
      serviceTypeFilter,
      currentPage: 1,
      tabPages: EMPTY_TAB_PAGES,
      tabTrainings: EMPTY_TAB_TRAININGS,
    });
    get().fetchTab(
      get().activeTab,
      1,
      get().searchQuery,
      get().dateFilter,
      serviceTypeFilter,
      get().awardingBodyFilter
    );
    if (get().view === "grid") {
      get().fetchTrainings(serviceTypeFilter, get().awardingBodyFilter);
    }
  },
  setAwardingBodyFilter: (awardingBodyFilter) => {
    set({
      awardingBodyFilter,
      currentPage: 1,
      tabPages: EMPTY_TAB_PAGES,
      tabTrainings: EMPTY_TAB_TRAININGS,
    });
    get().fetchTab(
      get().activeTab,
      1,
      get().searchQuery,
      get().dateFilter,
      get().serviceTypeFilter,
      awardingBodyFilter
    );
    if (get().view === "grid") {
      get().fetchTrainings(get().serviceTypeFilter, awardingBodyFilter);
    }
  },
  setCalendarMonth: (calendarMonth) => set({ calendarMonth }),

  // Fetch data for a specific tab
  fetchTab: async (
    tab: TrainingTab,
    page = 1,
    search = "",
    dateFilter?: string,
    serviceType?: string,
    awardingBody?: string
  ) => {
    set({ loading: true });
    try {
      const activeDateFilter =
        dateFilter !== undefined ? dateFilter : get().dateFilter;
      const activeServiceType =
        serviceType !== undefined ? serviceType : get().serviceTypeFilter;
      const activeAwardingBody =
        awardingBody !== undefined ? awardingBody : get().awardingBodyFilter;

      const res = await apiGetTrainings(
        tab,
        page,
        search,
        12,
        activeDateFilter || undefined,
        activeDateFilter || undefined,
        undefined,
        activeServiceType !== "all" ? activeServiceType : undefined,
        undefined,
        activeAwardingBody !== "all" ? activeAwardingBody : undefined
      );
      if (res.success && res.data) {
        const counts: TabCounts = (res as any).tabCounts || {
          today: (res as any).today ?? get().tabCounts.today,
          pending: (res as any).pending ?? get().tabCounts.pending,
          completed: (res as any).completed ?? get().tabCounts.completed,
          cancelled: (res as any).cancelled ?? get().tabCounts.cancelled,
        };
        const totalPages = (res as any).pagination?.pages ?? 1;
        const sortedData = sortTrainingsDesc(res.data);
        set((state) => ({
          tabTrainings: { ...state.tabTrainings, [tab]: sortedData },
          tabCounts: counts,
          tabPages: { ...state.tabPages, [tab]: totalPages },
          currentPage: page,
        }));
      }
    } finally {
      set({ loading: false });
    }
  },

  // Legacy: fetch all trainings for calendar view
  fetchTrainings: async (serviceType?: string, awardingBody?: string) => {
    set({ loading: true });
    try {
      const activeServiceType =
        serviceType !== undefined ? serviceType : get().serviceTypeFilter;
      const activeAwardingBody =
        awardingBody !== undefined ? awardingBody : get().awardingBodyFilter;

      const res = await apiGetTrainings(
        undefined,
        1,
        "",
        1000,
        undefined,
        undefined,
        undefined,
        activeServiceType !== "all" ? activeServiceType : undefined,
        undefined,
        activeAwardingBody !== "all" ? activeAwardingBody : undefined
      );
      if (res.success && res.data) {
        set({ trainings: res.data });
        // Also update tab counts if available
        const counts: TabCounts = (res as any).tabCounts;
        if (counts) set({ tabCounts: counts });
      }
    } finally {
      set({ loading: false });
    }
  },

  addTraining: async (trainingData, options) => {
    try {
      const res = await apiCreateTraining(trainingData);
      if (res.success && res.data) {
        if (!options?.silent) {
          // Refresh the active tab and calendar dataset
          const {
            activeTab,
            currentPage,
            searchQuery,
            dateFilter,
            serviceTypeFilter,
            awardingBodyFilter,
          } = get();
          await Promise.all([
            get().fetchTab(
              activeTab,
              currentPage,
              searchQuery,
              dateFilter,
              serviceTypeFilter,
              awardingBodyFilter
            ),
            get().fetchTrainings(serviceTypeFilter, awardingBodyFilter),
          ]);
        }
      } else {
        throw new Error(res.message || "Failed to create training record");
      }
    } catch (error) {
      throw error;
    }
  },

  updateTraining: async (updatedTraining) => {
    try {
      const res = await apiUpdateTraining(updatedTraining.id, updatedTraining);
      if (res.success && res.data) {
        // Refresh active tab and calendar dataset
        const {
          activeTab,
          currentPage,
          searchQuery,
          dateFilter,
          serviceTypeFilter,
          awardingBodyFilter,
        } = get();
        await Promise.all([
          get().fetchTab(
            activeTab,
            currentPage,
            searchQuery,
            dateFilter,
            serviceTypeFilter,
            awardingBodyFilter
          ),
          get().fetchTrainings(serviceTypeFilter, awardingBodyFilter),
        ]);
      } else {
        throw new Error(res.message || "Failed to update training");
      }
    } catch (error) {
      throw error;
    }
  },

  deleteTraining: async (id) => {
    try {
      const res = await apiDeleteTraining(id);
      if (res.success) {
        const {
          activeTab,
          currentPage,
          searchQuery,
          dateFilter,
          serviceTypeFilter,
          awardingBodyFilter,
        } = get();
        await Promise.all([
          get().fetchTab(
            activeTab,
            currentPage,
            searchQuery,
            dateFilter,
            serviceTypeFilter,
            awardingBodyFilter
          ),
          get().fetchTrainings(serviceTypeFilter, awardingBodyFilter),
        ]);
      } else {
        throw new Error(res.message || "Failed to delete training");
      }
    } catch (error) {
      throw error;
    }
  },

  fetchCourses: async () => {
    try {
      const res = await apiGetCourses();
      if (res.success && res.data) {
        set({ courses: res.data });
      }
    } catch (e) {
      console.error(e);
    }
  },

  addCourse: async (name) => {
    const tempId = self.crypto.randomUUID();
    const optimisticCourse: Course = { id: tempId, name };
    const previousCourses = get().courses;
    set({ courses: [...previousCourses, optimisticCourse] });

    try {
      const res = await apiCreateCourse(name);
      if (res.success && res.data) {
        const updated = previousCourses.concat(res.data);
        set({ courses: updated });
      } else {
        set({ courses: previousCourses });
        throw new Error(res.message || "Failed to create course");
      }
    } catch (e) {
      set({ courses: previousCourses });
      throw e;
    }
  },

  updateCourse: async (id, name) => {
    const previousCourses = get().courses;
    set({
      courses: previousCourses.map((c) => (c.id === id ? { ...c, name } : c)),
    });

    try {
      const res = await apiUpdateCourse(id, name);
      if (res.success && res.data) {
        const updated = get().courses.map((c) => (c.id === id ? res.data : c));
        set({ courses: updated });
      } else {
        set({ courses: previousCourses });
        throw new Error(res.message || "Failed to update course");
      }
    } catch (e) {
      set({ courses: previousCourses });
      throw e;
    }
  },

  deleteCourse: async (id) => {
    const previousCourses = get().courses;
    set({
      courses: previousCourses.filter((c) => c.id !== id),
    });

    try {
      const res = await apiDeleteCourse(id);
      if (!res.success) {
        set({ courses: previousCourses });
        throw new Error(res.message || "Failed to delete course");
      }
    } catch (e) {
      set({ courses: previousCourses });
      throw e;
    }
  },
}));
