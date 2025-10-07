export const usePayModals = () => {
  const { baseModal } = useConnectModal()
  const t = useNuxtApp().$i18n.t
  const localePath = useLocalePath()

  async function openExampleModal(
    title: string,
    description: string,
    dismissible: boolean,
    buttons: ConnectModalButton[]
  ) {
    await baseModal.open({
      title,
      description,
      dismissible,
      buttons
    })
  }

  async function openLeaveCreateRoutingSlipModal() {
    await baseModal.open({
      title: t('modal.leaveCreateRoutingSlip.title'),
      description: t('modal.leaveCreateRoutingSlip.description'),
      dismissible: true,
      buttons: [
        { label: t('label.leave'), to: localePath('/home') },
        { label: t('label.cancel'), shouldClose: true, variant: 'outline' }
      ]
    })
  }

  return {
    openExampleModal,
    openLeaveCreateRoutingSlipModal
  }
}
