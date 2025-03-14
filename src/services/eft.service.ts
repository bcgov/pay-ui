import { AxiosResponse } from 'axios'
import { Code } from '@/models/Code'
import ConfigHelper from '@/util/config-helper'
import axios from '@/util/http-util'
import { StatementFilterParams } from '@/models/statement'
import PaymentService from './payment.services'

export default class EftService {
  public static async getCodes (codeType: string): Promise<AxiosResponse<Code[]>> {
    return axios.get(`${ConfigHelper.getPayAPIURL()}/codes/${codeType}`)
  }

  public static async getStatementsList (filterParams: StatementFilterParams, organizationId = state.currentOrganization.id) {
    const response = await PaymentService.getStatementsList(organizationId, filterParams)
    return response?.data
  }

  public static async updateEftRefundStatus (
    eftRefundId: number,
    shortNameRefund: any
  ): Promise<AxiosResponse> {
    const response = await axios.patch(
      `${ConfigHelper.getPayAPIURL()}/eft-shortnames/shortname-refund/${eftRefundId}`,
      shortNameRefund
    )
    return response
  }
}
