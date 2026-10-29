import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useErrorHandler } from '~/composables/common/useErrorHandler'

const { mockToastAdd } = vi.hoisted(() => ({ mockToastAdd: vi.fn() }))

mockNuxtImport('useToast', () => () => ({ add: mockToastAdd }))

describe('useErrorHandler', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('getErrorMessage', () => {
    it.each([
      ['response data message first',
        { response: { data: { message: 'data msg', detail: 'detail' } }, message: 'top' }, 'data msg'],
      ['response data detail second', { response: { data: { detail: 'detail' } }, message: 'top' }, 'detail'],
      ['error message third', { response: { data: {} }, message: 'top' }, 'top'],
      ['Error instance message', new Error('native'), 'native'],
      ['default for empty object', {}, 'An unexpected error occurred'],
      ['default for null', null, 'An unexpected error occurred'],
      ['default for undefined', undefined, 'An unexpected error occurred'],
      ['default for empty strings', { response: { data: { message: '', detail: '' } }, message: '' },
        'An unexpected error occurred']
    ])('uses %s', (_label, error, expected) => {
      expect(useErrorHandler().getErrorMessage(error)).toBe(expected)
    })
  })

  describe('handleError', () => {
    it('logs with context, shows an error toast and returns the message', () => {
      const error = { response: { data: { message: 'Bad request' } } }
      const result = useErrorHandler().handleError(error, 'Saving refund')

      expect(result).toBe('Bad request')
      expect(consoleSpy).toHaveBeenCalledWith('Saving refund:', error)
      expect(mockToastAdd).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Bad request',
        icon: 'i-mdi-alert-circle',
        color: 'error'
      })
    })

    it('uses a generic log prefix without context', () => {
      const error = new Error('oops')
      useErrorHandler().handleError(error)
      expect(consoleSpy).toHaveBeenCalledWith('Error:', error)
      expect(mockToastAdd).toHaveBeenCalledWith(expect.objectContaining({ description: 'oops' }))
    })
  })

  describe('handleErrorSilent', () => {
    it('logs with context and returns the message without a toast', () => {
      const error = { response: { data: { detail: 'Not found' } } }
      expect(useErrorHandler().handleErrorSilent(error, 'Loading')).toBe('Not found')
      expect(consoleSpy).toHaveBeenCalledWith('Loading:', error)
      expect(mockToastAdd).not.toHaveBeenCalled()
    })

    it('uses a generic log prefix without context', () => {
      expect(useErrorHandler().handleErrorSilent(undefined)).toBe('An unexpected error occurred')
      expect(consoleSpy).toHaveBeenCalledWith('Error:', undefined)
      expect(mockToastAdd).not.toHaveBeenCalled()
    })
  })
})
