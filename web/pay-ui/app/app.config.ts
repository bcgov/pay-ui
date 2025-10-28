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
    inputMenu: {
      variants: {
        size: {
          bcGovLg: {
            base: 'px-2.5 pb-2 pt-6 text-base gap-1.5',
            leading: 'ps-2.5',
            trailing: 'pe-2.5',
            leadingIcon: 'size-5',
            leadingAvatarSize: '2xs',
            trailingIcon: 'size-5'
          }
        },
        variant: {
          bcGov: 'ring-0 ring-transparent peer rounded-t-sm rounded-b-none bg-shade shadow-input focus:ring-0 focus:outline-none focus:shadow-input-focus text-neutral-highlighted aria-invalid:shadow-input-error aria-invalid:focus:shadow-input-error aria-invalid:ring-0'
        }
      },
      defaultVariants: {
        size: 'bcGovLg',
        color: 'primary',
        variant: 'bcGov'
      }
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
