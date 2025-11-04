import type { AxiosResponse } from 'axios'
import type { CodesResponse } from '@/models/Code'
import ConfigHelper from '@/utils/config-helper'
import axios from '@/utils/http-util'

async function getCodes(codeType: string): Promise<AxiosResponse<CodesResponse>> {
  return axios.get(`${ConfigHelper.getPayAPIURL()}/codes/${codeType}`)
}

export default {
  getCodes
}
