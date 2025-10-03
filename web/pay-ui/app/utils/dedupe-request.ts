// inspo from https://github.com/TanStack/form/issues/1431

export function createDedupedRequest() {
  const PROMISES = new Map<string, Promise<unknown>>()

  return {
    run: async <T>(key: string, cb: () => Promise<T>): Promise<T> => {
      if (PROMISES.has(key)) {
        const data = await PROMISES.get(key)
        return data as T
      }

      const promise = cb()
      PROMISES.set(key, promise)
      const data = await promise
      PROMISES.delete(key)

      return data
    }
  }
};
