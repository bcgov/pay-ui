/** The signed-in user, for the header. */
export default defineEventHandler((event) => {
  const user = event.context.user
  return { name: user?.name ?? user?.username ?? '' }
})
