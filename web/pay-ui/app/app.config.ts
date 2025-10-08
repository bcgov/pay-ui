export default defineAppConfig({
  connect: {
    header: {
      localeSelect: false
    },
    login: {
      redirect: '/home'
    },
    logout: {
      redirect: '/auth/login'
    }
  },
  ui: {
    container: {
      base: 'max-w-(--container-bcGovLg) px-0 sm:px-0 lg:px-0 py-6 sm:py-10 flex flex-col gap-6 sm:gap-8'
    },
    select: {
      slots: {
        placeholder: 'text-neutral'
      }
    },
    toast: {
      slots: {
        root: 'rounded',
        title: 'text-base font-bold text-neutral-highlighted',
        description: 'text-neutral-highlighted'
      },
      variants: {
        color: {
          error: {
            root: 'bg-shade-warning ring-error ring-inset',
            icon: 'text-error'
          }
        }
      }
    },
    tooltip: {
      slots: {
        content: 'bg-neutral ring-neutral text-secondary p-4 text-sm'
      }
    }
  }
})
