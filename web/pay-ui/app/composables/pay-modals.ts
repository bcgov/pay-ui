export const usePayModals = () => {
  const { baseModal } = useConnectModal()
  const t = useNuxtApp().$i18n.t
  const localePath = useLocalePath()

  // TODO I think we have another modal somewhere else that should be refactored here. Under refund transaction?
  // But we'll probably get rid of refund transaction or change it anyways soon.
  async function openLeaveCreateRoutingSlipModal() {
    await baseModal.open({
      title: t('modal.leaveCreateRoutingSlip.title'),
      description: t('modal.leaveCreateRoutingSlip.description'),
      dismissible: true,
      buttons: [
        { label: t('label.leave'), to: localePath('/dashboard'), shouldClose: true },
        { label: t('label.cancel'), shouldClose: true, variant: 'outline' }
      ]
    })
  }

  return {
    openLeaveCreateRoutingSlipModal
  }
}
