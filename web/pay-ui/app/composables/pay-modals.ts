export const usePayModals = () => {
  const { baseModal } = useConnectModal()
  const t = useNuxtApp().$i18n.t
  const localePath = useLocalePath()

  async function openLeaveCreateRoutingSlipModal() {
    await baseModal.open({
      title: t('modal.leaveCreateRoutingSlip.title'),
      description: t('modal.leaveCreateRoutingSlip.description'),
      dismissible: true,
      buttons: [
        { label: t('label.leave'), to: localePath('/home'), shouldClose: true },
        { label: t('label.cancel'), shouldClose: true, variant: 'outline' }
      ]
    })
  }

  async function openPlaceRoutingSlipToNSFModal(onConfirm: () => Promise<void>) {
    await baseModal.open({
      title: t('modal.placeRoutingSlipToNSF.title'),
      description: t('modal.placeRoutingSlipToNSF.description'),
      dismissible: true,
      buttons: [
        {
          label: t('modal.placeRoutingSlipToNSF.confirmButton'),
          onClick: async () => {
            await onConfirm()
          },
          shouldClose: true
        },
        {
          label: t('label.cancel'),
          variant: 'outline',
          shouldClose: true
        }
      ]
    })
  }

  async function openVoidRoutingSlipModal(onConfirm: () => Promise<void>) {
    await baseModal.open({
      title: t('modal.voidRoutingSlip.title'),
      description: t('modal.voidRoutingSlip.description'),
      dismissible: true,
      buttons: [
        {
          label: t('modal.voidRoutingSlip.confirmButton'),
          onClick: async () => {
            await onConfirm()
          },
          shouldClose: true
        },
        {
          label: t('label.cancel'),
          variant: 'outline',
          shouldClose: true
        }
      ]
    })
  }

  async function openCancelTransactionModal(onConfirm: () => Promise<void>) {
    await baseModal.open({
      title: 'Cancel Transaction?',
      description: 'Canceling a transaction will place the transaction amount back to the routing slip.',
      dismissible: true,
      buttons: [
        {
          label: 'Cancel Transaction',
          onClick: async () => {
            await onConfirm()
          },
          shouldClose: true
        },
        {
          label: 'Cancel',
          variant: 'outline',
          shouldClose: true
        }
      ]
    })
  }

  return {
    openLeaveCreateRoutingSlipModal,
    openPlaceRoutingSlipToNSFModal,
    openVoidRoutingSlipModal,
    openCancelTransactionModal
  }
}
