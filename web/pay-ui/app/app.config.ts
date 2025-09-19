export default defineAppConfig({
  connect: {
    header: {
      localeSelect: false
    },
    login: {
      redirect: '/protected'
    },
    logout: {
      redirect: '/auth/login'
    }
  }
})
