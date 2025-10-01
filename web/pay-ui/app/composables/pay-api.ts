// TODO: move this into /services ???

export const usePayApi = () => {
  const { $payApi } = useNuxtApp()

  async function getCodes<T>(codeType: string): Promise<T[]> {
    const res = await $payApi<{ codes: T[] }>(`/codes/${codeType}`)
    return res.codes
  }

  return {
    getCodes
  }
}
