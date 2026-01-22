export const usePayModals = () => {
  const { baseModal } = useConnectModal()
  const t = useNuxtApp().$i18n.t

  async function openLeaveCreateRoutingSlipModal() {
    await baseModal.open({
      title: t('modal.leaveCreateRoutingSlip.title'),
      description: t('modal.leaveCreateRoutingSlip.description'),
      dismissible: true,
      buttons: [
        { label: t('label.leave'), to: '/home', shouldClose: true },
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

  async function openAuthorizeWriteOffModal(onConfirm: () => Promise<void>) {
    await baseModal.open({
      title: t('modal.authorizeWriteOff.title'),
      description: t('modal.authorizeWriteOff.description'),
      dismissible: true,
      buttons: [
        {
          label: t('modal.authorizeWriteOff.confirmButton'),
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

  async function openErrorDialog(title: string, description: string) {
    await baseModal.open({
      title,
      description,
      dismissible: true,
      buttons: [
        {
          label: t('label.ok'),
          shouldClose: true
        }
      ]
    })
  }

  return {
    openLeaveCreateRoutingSlipModal,
    openPlaceRoutingSlipToNSFModal,
    openVoidRoutingSlipModal,
    openAuthorizeWriteOffModal,
    openCancelTransactionModal,
    openErrorDialog
  }
}
