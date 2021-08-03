import { createLocalVue, mount, shallowMount } from '@vue/test-utils'

import LoaderComponent from '@/components/common/LoaderComponent.vue'
import Vuetify from 'vuetify'
import Vuex from 'vuex'

describe('LoaderComponent.vue', () => {
  const localVue = createLocalVue()
  localVue.use(Vuex)
  const vuetify = new Vuetify({})

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('renders component', () => {
    const wrapper = mount(LoaderComponent, {
      localVue,
      vuetify
    })
    expect(wrapper.find("[data-test='div-loading-container']").exists()).toBeTruthy()
  })
})
