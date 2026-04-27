import type { ApprovalRequest } from "../types";
import {
  createApprovalInDataverse,
  getApprovalsFromDataverse,
  updateApprovalInDataverse,
} from "./dataverseService";

const API_MODE = (import.meta.env.VITE_API_MODE as string) || "dataverse";
const USE_DATAVERSE = API_MODE === "dataverse";
const TRIGGER_FLOW_URL = import.meta.env.VITE_FLOW_TRIGGER_URL as string;
const GET_APPROVALS_FLOW_URL = import.meta.env.VITE_FLOW_GET_APPROVALS_URL as string;
const CREATE_APPROVAL_FLOW_URL = import.meta.env.VITE_FLOW_CREATE_APPROVAL_URL as string;
const UPDATE_APPROVAL_FLOW_URL = import.meta.env.VITE_FLOW_UPDATE_APPROVAL_URL as string;
const FORCE_APPROVER_NAME =
  (import.meta.env.VITE_FORCE_APPROVER_NAME as string) || "林廷軒";

export type FlowPayload = {
  requestId: string;
  title: string;
  action: "approve" | "reject";
  approver: string;
  comment: string;
};

type RawApprovalRequest = Partial<ApprovalRequest> & {
  id?: string;
  requestId?: string;
};

export function getBackendDisplayName(): string {
  return USE_DATAVERSE ? "Dataverse" : "SharePoint";
}

function normalizeApproval(item: RawApprovalRequest): ApprovalRequest {
  const approvers = (Array.isArray(item.approvers) ? item.approvers : []).map((approver) => {
    if (approver?.status !== "pending") {
      return approver;
    }

    return {
      ...approver,
      name: FORCE_APPROVER_NAME,
    };
  });
  const hasRejected = approvers.some((a) => a?.status === "rejected");
  const hasPending = approvers.some((a) => a?.status === "pending");
  const allApproved = approvers.length > 0 && approvers.every((a) => a?.status === "approved");

  let derivedStatus = item.status || "pending";
  if (hasRejected) {
    derivedStatus = "rejected";
  } else if (allApproved) {
    derivedStatus = "approved";
  } else if (hasPending) {
    derivedStatus = "pending";
  }

  const fallbackCurrentApprover =
    approvers.find((a) => a?.status === "pending")?.name || "";
  const currentApprover = hasPending
    ? FORCE_APPROVER_NAME
    : item.currentApprover || fallbackCurrentApprover;

  return {
    id: item.id || item.requestId || crypto.randomUUID(),
    title: item.title || "",
    type: item.type || "",
    applicant: item.applicant || "",
    applicantEmail: item.applicantEmail || "",
    department: item.department || "",
    submitDate: item.submitDate || new Date().toISOString().slice(0, 10),
    amount: item.amount,
    description: item.description || "",
    status: derivedStatus,
    currentApprover,
    approvers,
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
  };
}

async function postFlowJson<TResponse>(url: string, payload: unknown): Promise<TResponse | null> {
  if (!url) {
    console.error("Flow URL not configured.");
    return null;
  }
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    if (response.status === 204) {
      return null;
    }

    return (await response.json()) as TResponse;
  } catch (error) {
    console.error("Flow call failed:", error);
    return null;
  }
}

/**
 * 觸發 Power Automate 簽核流程
 */
export async function triggerApprovalFlow(payload: FlowPayload): Promise<boolean> {
  try {
    if (!TRIGGER_FLOW_URL) {
      console.error("VITE_FLOW_TRIGGER_URL is not configured.");
      return false;
    }
    const response = await fetch(TRIGGER_FLOW_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch (error) {
    console.error("Flow trigger failed:", error);
    return false;
  }
}

/**
 * 取得簽核申請清單（由 Power Automate 從 SharePoint 回傳）
 */
export async function fetchApprovals(): Promise<ApprovalRequest[]> {
  if (USE_DATAVERSE) {
    return getApprovalsFromDataverse();
  }

  const result = await postFlowJson<
    RawApprovalRequest[] | { items?: RawApprovalRequest[]; data?: RawApprovalRequest[] }
  >(GET_APPROVALS_FLOW_URL, {});

  if (!result) {
    return [];
  }

  if (Array.isArray(result)) {
    return result.map(normalizeApproval);
  }

  const rows = result.items || result.data || [];
  return rows.map(normalizeApproval);
}

/**
 * 新增簽核申請（透過 Power Automate 寫入 SharePoint）
 */
export async function createApproval(request: ApprovalRequest): Promise<boolean> {
  if (USE_DATAVERSE) {
    const id = await createApprovalInDataverse(request);
    return id !== null;
  }

  const result = await postFlowJson<{ success?: boolean; id?: string }>(
    CREATE_APPROVAL_FLOW_URL,
    { request }
  );
  return !!result && result.success !== false;
}

/**
 * 更新簽核申請（透過 Power Automate 寫入 SharePoint）
 */
export async function updateApproval(
  id: string,
  request: ApprovalRequest
): Promise<boolean> {
  if (USE_DATAVERSE) {
    return updateApprovalInDataverse(id, request);
  }

  const requestId = request.id || id;
  const lastComment =
    request.approvers
      .slice()
      .reverse()
      .find((a) => a.comment && a.comment.trim())?.comment || "";

  const result = await postFlowJson<{ success?: boolean }>(
    UPDATE_APPROVAL_FLOW_URL,
    {
      // Keep original nested shape for existing flow definitions.
      id,
      request,
      // Provide flattened aliases for common flow trigger schemas.
      requestId,
      itemId: id,
      status: request.status,
      approverNotes: lastComment,
    }
  );
  return !!result && result.success !== false;
}
