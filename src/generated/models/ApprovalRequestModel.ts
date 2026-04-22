/*!
 * Generated model for cr628_approvalrequest table
 */

export interface ApprovalRequestBase {
  cr628_title?: string;
  cr628_type?: string;
  cr628_applicant?: string;
  cr628_applicantemail?: string;
  cr628_department?: string;
  cr628_submitdate?: string;
  cr628_amount?: number;
  cr628_description?: string;
  cr628_status?: number; // PicklistType: 0=pending, 1=approved, 2=rejected, 3=cancelled
  cr628_currentapprove?: string;
  cr628_approvers?: string; // JSON string
}

export interface ApprovalRequest extends ApprovalRequestBase {
  cr628_approvalrequestid: string;
}
