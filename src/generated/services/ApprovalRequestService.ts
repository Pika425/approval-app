/*!
 * Service for cr628_approvalrequest table
 * Matches PAC CLI auto-generated service pattern exactly
 */

import type { ApprovalRequestBase, ApprovalRequest } from '../models/ApprovalRequestModel';
import type { IGetOptions, IGetAllOptions } from '../models/CommonModels';
import type { IOperationResult } from '@microsoft/power-apps/data';
import { dataSourcesInfo } from '../../../.power/schemas/appschemas/dataSourcesInfo';
import { getClient } from '@microsoft/power-apps/data';


export class ApprovalRequestService {
  private static readonly dataSourceName = 'cr628_approvalrequests';

  private static readonly client = getClient(dataSourcesInfo);

  public static async create(
    record: Omit<ApprovalRequestBase, 'cr628_approvalrequestid'>
  ): Promise<IOperationResult<ApprovalRequest>> {
    const result = await ApprovalRequestService.client.createRecordAsync<
      Omit<ApprovalRequestBase, 'cr628_approvalrequestid'>,
      ApprovalRequest
    >(
      ApprovalRequestService.dataSourceName,
      record
    );
    return result;
  }

  public static async update(
    id: string,
    changedFields: Partial<ApprovalRequestBase>
  ): Promise<IOperationResult<ApprovalRequest>> {
    const result = await ApprovalRequestService.client.updateRecordAsync<
      Partial<ApprovalRequestBase>,
      ApprovalRequest
    >(
      ApprovalRequestService.dataSourceName,
      id,
      changedFields
    );
    return result;
  }

  public static async delete(id: string): Promise<void> {
    await ApprovalRequestService.client.deleteRecordAsync(
      ApprovalRequestService.dataSourceName,
      id
    );
  }

  public static async get(
    id: string,
    options?: IGetOptions
  ): Promise<IOperationResult<ApprovalRequest>> {
    const result = await ApprovalRequestService.client.retrieveRecordAsync<ApprovalRequest>(
      ApprovalRequestService.dataSourceName,
      id,
      options
    );
    return result;
  }

  public static async getAll(
    options?: IGetAllOptions
  ): Promise<IOperationResult<ApprovalRequest[]>> {
    const result = await ApprovalRequestService.client.retrieveMultipleRecordsAsync<ApprovalRequest>(
      ApprovalRequestService.dataSourceName,
      options
    );
    return result;
  }
}
