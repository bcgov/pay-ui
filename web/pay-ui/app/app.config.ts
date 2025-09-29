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
  },
  ui: {
    select: {
      slots: {
        placeholder: 'text-neutral'
      }
    },
    tooltip: {
      slots: {
        content: 'bg-neutral ring-neutral text-secondary p-4 text-sm'
      }
    }
  }
})
