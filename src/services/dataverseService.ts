import type { ApprovalRequest } from "../types";
import { ApprovalRequestService } from "../generated/services/ApprovalRequestService";
import type {
  ApprovalRequestBase,
  ApprovalRequest as DvRecord,
} from "../generated/models/ApprovalRequestModel";

/** Picklist value ↔ string status mapping */
const STATUS_TO_NUM: Record<string, number> = {
  pending: 0,
  approved: 1,
  rejected: 2,
  cancelled: 3,
};
const NUM_TO_STATUS: Record<number, string> = {
  0: "pending",
  1: "approved",
  2: "rejected",
  3: "cancelled",
};

function hasPowerAppsBridge(): boolean {
  return !!(window as any).powerAppsBridge;
}

async function ensurePowerAppsBridge(timeoutMs = 8000): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (hasPowerAppsBridge()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return hasPowerAppsBridge();
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`[${label}] timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Parse a Dataverse record into our app's ApprovalRequest type
 */
function parseRecord(r: DvRecord): ApprovalRequest {
  let approvers: ApprovalRequest["approvers"] = [];
  try {
    approvers = r.cr628_approvers ? JSON.parse(r.cr628_approvers) : [];
  } catch {
    approvers = [];
  }

  return {
    id: r.cr628_approvalrequestid,
    title: r.cr628_title || "",
    type: r.cr628_type || "",
    applicant: r.cr628_applicant || "",
    applicantEmail: r.cr628_applicantemail || "",
    department: r.cr628_department || "",
    submitDate: r.cr628_submitdate || "",
    amount: r.cr628_amount,
    description: r.cr628_description || "",
    status: (NUM_TO_STATUS[r.cr628_status as number] as ApprovalRequest["status"]) || "pending",
    currentApprover: r.cr628_currentapprove || "",
    approvers,
  };
}

/**
 * Convert our app's ApprovalRequest to a Dataverse record payload
 */
function toRecord(req: ApprovalRequest): ApprovalRequestBase {
  return {
    cr628_title: req.title,
    cr628_type: req.type,
    cr628_applicant: req.applicant,
    cr628_applicantemail: req.applicantEmail,
    cr628_department: req.department,
    cr628_submitdate: req.submitDate,
    cr628_amount: req.amount,
    cr628_description: req.description,
    cr628_status: STATUS_TO_NUM[req.status] ?? 0,
    cr628_currentapprove: req.currentApprover,
    cr628_approvers: JSON.stringify(req.approvers),
  };
}

/**
 * 從 Dataverse 取得所有簽核申請 (via Power Apps SDK)
 */
export async function getApprovalsFromDataverse(): Promise<ApprovalRequest[]> {
  const bridgeReady = await ensurePowerAppsBridge();
  console.log("[Bridge check] window.powerAppsBridge:", bridgeReady);
  if (!bridgeReady) {
    console.error("[Bridge check] current URL:", window.location.href);
    console.error(
      "Dataverse unavailable in current host: window.powerAppsBridge=false and CSP blocks fetch (connect-src 'none'). Open app from apps.powerapps.com player."
    );
    return [];
  }
  try {
    const result = await withTimeout(
      ApprovalRequestService.getAll({
        orderBy: ["createdon desc"],
      }),
      12000,
      "getAll"
    );
    if (!result.success) {
      console.error("Dataverse getAll failed:", result.error);
      return [];
    }
    return (result.data || []).map(parseRecord);
  } catch (error) {
    console.error("Failed to fetch from Dataverse SDK:", error);
    return [];
  }
}

/**
 * 新增簽核申請到 Dataverse (via Power Apps SDK)
 */
export async function createApprovalInDataverse(
  request: ApprovalRequest
): Promise<string | null> {
  const bridgeReady = await ensurePowerAppsBridge();
  if (!bridgeReady) {
    console.error("[Bridge check] current URL:", window.location.href);
    console.error(
      "Dataverse unavailable in current host: window.powerAppsBridge=false and CSP blocks fetch (connect-src 'none'). Open app from apps.powerapps.com player."
    );
    return null;
  }
  try {
    const raw = toRecord(request);
    // Remove undefined values — SDK may not handle them correctly
    const record = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== undefined)
    );
    console.log("[Dataverse create] record:", JSON.stringify(record));
    const result = await withTimeout(ApprovalRequestService.create(record), 12000, "create");
    console.log("[Dataverse create] result:", JSON.stringify({
      success: result.success,
      dataKeys: result.data ? Object.keys(result.data) : null,
      error: result.error?.message,
    }));
    if (!result.success) {
      console.error("Dataverse create failed:", result.error);
      return null;
    }
    return result.data?.cr628_approvalrequestid || "created";
  } catch (error) {
    console.error("Failed to create approval in Dataverse:", error);
    return null;
  }
}

/**
 * 更新 Dataverse 中的簽核申請 (via Power Apps SDK)
 */
export async function updateApprovalInDataverse(
  id: string,
  request: ApprovalRequest
): Promise<boolean> {
  const bridgeReady = await ensurePowerAppsBridge();
  if (!bridgeReady) {
    console.error("[Bridge check] current URL:", window.location.href);
    console.error(
      "Dataverse unavailable in current host: window.powerAppsBridge=false and CSP blocks fetch (connect-src 'none'). Open app from apps.powerapps.com player."
    );
    return false;
  }
  try {
    const record = toRecord(request);
    console.log("[Dataverse update]", id, record);
    const result = await withTimeout(
      ApprovalRequestService.update(id, record),
      12000,
      "update"
    );
    if (!result.success) {
      console.error("Dataverse update failed:", result.error);
    }
    return result.success;
  } catch (error) {
    console.error("Failed to update approval in Dataverse:", error);
    return false;
  }
}
