import { Action, Module, Mutation, VuexModule } from 'vuex-module-decorators'

import { Payment } from '@/models/Payment'
import { RoutingSlipDetails } from '@/models/RoutingSlip'
import RoutingSlipService from '@/services/routingSlip.services'

@Module({ namespaced: true, stateFactory: true })
export default class RoutingSlipModule extends VuexModule {
  public routingSlipDetails: RoutingSlipDetails = {}
  public routingSlipPayment: Payment = {}

  @Mutation
  public setRoutingSlipDetails (routingSlipDetails: RoutingSlipDetails) {
    this.routingSlipDetails = routingSlipDetails
  }

  @Mutation
  public setRoutingSlipPayment (routingSlipPayment: Payment) {
    this.routingSlipPayment = routingSlipPayment
  }

  @Action({ rawError: true })
  public async createRoutingSlip (): Promise<RoutingSlipDetails> {
    // TODO save apis come here
    // eslint-disable-next-line no-console
    console.log('this.context', this.context)
    return {}
  }

  @Action({ rawError: true })
  public async checkRoutingNumber (): Promise<boolean> {
    const context: any = this.context
    try {
      const routingumber = context.state.routingSlipDetails.number
      const response = await RoutingSlipService.isRoutingNumberAvailable(
        routingumber
      )
      // if routing number existing we will get 200 as response
      // else we will get 404
      if (response.status === 404) {
        // we will return truw,so can use this routing number
        return true
      }
      // all other case routing is existing so can't use this number
      return false
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('error ', error.response.data)
      // on error we return true where the can use this routing number which should brake on create and show error message
      return true
    }
  }
}
