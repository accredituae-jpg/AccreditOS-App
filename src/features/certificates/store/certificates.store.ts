import { create } from "zustand";
import { getStoredViewPreference, setStoredViewPreference } from "@/lib/viewPreference";

interface CertificatesUIState {
  searchTerm: string;
  clientIdFilter: string;
  expiryFilter: string;
  awardingBodyFilter: string;
  statusFilter: string;
  fromCertNo: string;
  toCertNo: string;
  serviceTypeFilter: "all" | "training" | "inspection";
  selectedCertificateIds: string[];
  currentPage: number;
  view: "list" | "grid";

  setSearchTerm: (term: string) => void;
  setClientIdFilter: (filter: string) => void;
  setExpiryFilter: (filter: string) => void;
  setAwardingBodyFilter: (filter: string) => void;
  setStatusFilter: (filter: string) => void;
  setFromCertNo: (fromCertNo: string) => void;
  setToCertNo: (toCertNo: string) => void;
  setServiceTypeFilter: (serviceTypeFilter: "all" | "training" | "inspection") => void;
  setSelectedCertificateIds: (ids: string[]) => void;
  toggleSelectCertificate: (id: string) => void;
  selectAllCertificates: (ids: string[]) => void;
  clearSelectedCertificates: () => void;
  setCurrentPage: (page: number) => void;
  setView: (view: "list" | "grid") => void;
  resetFilters: () => void;
}

export const useCertificatesStore = create<CertificatesUIState>((set, get) => ({
  searchTerm: "",
  clientIdFilter: "all",
  expiryFilter: "all",
  awardingBodyFilter: "all",
  statusFilter: "all",
  fromCertNo: "",
  toCertNo: "",
  serviceTypeFilter: "all",
  selectedCertificateIds: [],
  currentPage: 1,
  view: getStoredViewPreference(),

  setSearchTerm: (searchTerm) => set({ searchTerm, currentPage: 1 }),
  setClientIdFilter: (clientIdFilter) => set({ clientIdFilter, currentPage: 1 }),
  setExpiryFilter: (expiryFilter) => set({ expiryFilter, currentPage: 1 }),
  setAwardingBodyFilter: (awardingBodyFilter) => set({ awardingBodyFilter, currentPage: 1 }),
  setStatusFilter: (statusFilter) => set({ statusFilter, currentPage: 1 }),
  setFromCertNo: (fromCertNo) => set({ fromCertNo, currentPage: 1 }),
  setToCertNo: (toCertNo) => set({ toCertNo, currentPage: 1 }),
  setServiceTypeFilter: (serviceTypeFilter) => set({ serviceTypeFilter, currentPage: 1 }),
  setSelectedCertificateIds: (selectedCertificateIds) => set({ selectedCertificateIds }),
  toggleSelectCertificate: (id) =>
    set((state) => ({
      selectedCertificateIds: state.selectedCertificateIds.includes(id)
        ? state.selectedCertificateIds.filter((item) => item !== id)
        : [...state.selectedCertificateIds, id],
    })),
  selectAllCertificates: (ids) => set({ selectedCertificateIds: ids }),
  clearSelectedCertificates: () => set({ selectedCertificateIds: [] }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setView: (view) => {
    if (get().view === view) return;
    setStoredViewPreference(view);
    set({ view });
  },
  resetFilters: () =>
    set({
      searchTerm: "",
      clientIdFilter: "all",
      expiryFilter: "all",
      awardingBodyFilter: "all",
      statusFilter: "all",
      fromCertNo: "",
      toCertNo: "",
      serviceTypeFilter: "all",
      currentPage: 1,
    }),
}));
