export const usePayModals = () => {
  const { baseModal } = useConnectModal()

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

  return {
    openExampleModal
  }
}
