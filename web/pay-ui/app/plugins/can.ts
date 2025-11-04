import type { Directive, DirectiveBinding } from 'vue'

interface CustomHTMLElement extends HTMLElement {
  disabled: boolean
  readOnly: boolean
}

const can: Directive = {
  mounted(el, binding) {
    canAccess(binding, el)
  },
  updated(el, binding) {
    canAccess(binding, el)
  }
}

function canAccess(binding: DirectiveBinding, el: HTMLElement) {
  const behaviour = binding.modifiers.disable ? 'disable' : 'hide'
  // to handle special elements like v-card etc
  const isCard = !!binding.modifiers.card
  const requestedAction: Role[] = [binding.arg as Role]
  const customeEl = el as CustomHTMLElement
  const okayToAccess = commonUtil.verifyRoles(requestedAction)
  // if not okay , hide or disable
  if (!okayToAccess) {
    if (behaviour === 'hide') {
      commentNode(el)
    } else if (behaviour === 'disable' && isCard === false) {
      customeEl.disabled = true
    } else if (behaviour === 'disable' && isCard === true) {
      // TODO tab still works.. can tab to the text field and make it work
      customeEl.classList.add('v-card--disabled')
      customeEl.style.pointerEvents = 'none'
    }
  }
}

function commentNode(el: HTMLElement) {
  const comment = document.createComment(' ')

  Object.defineProperty(comment, 'setAttribute', {
    value: () => undefined
  })

  if (el.parentNode) {
    el.parentNode.replaceChild(comment, el)
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('can', can)
})
