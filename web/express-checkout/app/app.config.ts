export default defineAppConfig({
  connect: {
    header: {
      localeSelect: false
    },
    logout: {
      redirect: '/'
    }
  }
})
