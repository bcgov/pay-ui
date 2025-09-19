import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, it, expect } from 'vitest'
import Protected from '~/pages/protected.vue'

const testLabel = 'Test account name'

mockNuxtImport('useConnectAccountStore', () => () => ({
  currentAccount: { label: testLabel }
}))

describe('Index Page', () => {
  function mountPage() {
    return mountSuspended(Protected)
  }

  it('should mount successfully', async () => {
    const wrapper = await mountPage()
    expect(wrapper.exists()).toBe(true)
  })

  it('should render mocked account name', async () => {
    const wrapper = await mountPage()
    const p = wrapper.findAll('p')
    expect(p[0]!.text()).toContain('Hello ' + testLabel)
    expect(p[1]!.text()).toContain('Maximum 50 characters')
  })
})
