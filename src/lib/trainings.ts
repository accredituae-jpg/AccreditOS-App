export interface Training {
  id: string;
  courseId: string;
  courseName: string;
  trainingType: "classroom" | "online" | "site";
  clientId: string;
  clientName: string;
  participantName: string;
  participantPhone: string;
  regDate: string;
  issueDate: string;
  time: string;
  status: "upcoming" | "pending" | "completed";
  certificateIssued?: boolean;
  awardingBodyId?: string | null;
  awardingBodyName?: string;
  customCompany?: string;
  drivingLicenseNo?: string;
  drivingLicenseType?: string;
  serviceType?: "training" | "inspection";
}

export function getTrainings(): Training[] {
  return [];
}

export function saveTrainings(trainings: Training[]): void {
  // Deprecated: client-side persistence is replaced by server-side DB operations
}

