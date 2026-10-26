export interface Training {
  id: string;
  courseName: string;
  trainingType: "classroom" | "online" | "site";
  serviceType?: "training" | "inspection";
  quantity?: string | number;
  clientName: string;
  participantName: string;
  participantPhone: string;
  regDate: string;
  issueDate: string;
  time?: string;
  status: "pending" | "completed" | "cancelled";
  certificateIssued?: boolean;
  awardingBodyId?: string;
  awardingBodyName?: string;
  drivingLicenseNo?: string | null;
  drivingLicenseType?: string | null;
  customCompany?: string | null;
  clientId?: string;
  courseId?: string;
}

