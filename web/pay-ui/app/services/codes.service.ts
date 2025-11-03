import type { AxiosResponse } from 'axios'
import type { Code } from '@/models/Code'
import ConfigHelper from '@/utils/config-helper'
import axios from '@/utils/http-util'

export default class CodesService {
  public static async getCodes (codeType: string): Promise<AxiosResponse<Code[]>> {
    return axios.get(`${ConfigHelper.getPayAPIURL()}/codes/${codeType}`)
  }
}
