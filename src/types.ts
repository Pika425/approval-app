export type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";

export type ApprovalRequest = {
  id: string;
  title: string;
  type: string;
  applicant: string;
  applicantEmail: string;
  department: string;
  submitDate: string;
  amount?: number;
  description: string;
  status: ApprovalStatus;
  currentApprover: string;
  approvers: ApproverStep[];
  attachments?: string[];
};

export type ApproverStep = {
  order: number;
  name: string;
  role: string;
  status: ApprovalStatus;
  comment?: string;
  actionDate?: string;
};
