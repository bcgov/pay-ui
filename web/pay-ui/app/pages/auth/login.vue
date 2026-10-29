<script setup lang="ts">
// This needs to be overriden because our base url doesn't work for /en-ca removal etc.
import loginImage from '#auth/public/img/BCReg_Generic_Login_image.jpg'

const { t } = useI18n()
const { login } = useConnectAuth()
const rtc = useRuntimeConfig().public
const ac = useAppConfig().connect
const route = useRoute()

useHead({
  title: t('connect.page.login.title')
})

definePageMeta({
  layout: 'connect-auth',
  hideBreadcrumbs: true,
  middleware: async (to) => {
    const { $connectAuth, $router, _appConfig, $config } = useNuxtApp()
    if ($connectAuth.authenticated) {
      if (to.query.return) {
        const fallback = _appConfig.connect.login.redirect || '/'
        window.location.replace(getSafeRedirectUrl(to.query.return, getAppOrigins($config.public.baseUrl), fallback))
        return
      }
      await $router.push(_appConfig.connect.login.redirect || '/')
    }
  }
})

const isSessionExpired = sessionStorage.getItem(ConnectAuthStorageKey.CONNECT_SESSION_EXPIRED)

const loginOptions = computed(() => {
  const defaultRedirect = `${rtc.baseUrl.replace(/\/$/, '')}${ac.login.redirect}`
  const redirectUrl = getSafeRedirectUrl(route.query.return, getAppOrigins(rtc.baseUrl), defaultRedirect)

  const loginOptionsMap: Record<
    'bcsc' | 'bceid' | 'idir',
    { label: string, icon: string, onClick: () => Promise<void> }
  > = {
    bcsc: {
      label: t('connect.page.login.loginBCSC'),
      icon: 'i-mdi-account-card-details-outline',
      onClick: () => login(ConnectIdpHint.BCSC, redirectUrl)
    },
    bceid: {
      label: t('connect.page.login.loginBCEID'),
      icon: 'i-mdi-two-factor-authentication',
      onClick: () => login(ConnectIdpHint.BCEID, redirectUrl)
    },
    idir: {
      label: t('connect.page.login.loginIDIR'),
      icon: 'i-mdi-account-group-outline',
      onClick: () => login(ConnectIdpHint.IDIR, redirectUrl)
    }
  }

  return ac.login.idps.map(key => loginOptionsMap[key as keyof typeof loginOptionsMap])
})
</script>

<template>
  <div class="flex grow flex-col items-center justify-center py-10">
    <div class="flex flex-col items-center gap-10">
      <h1>
        {{ $t('connect.page.login.h1') }}
      </h1>
      <UAlert
        v-if="isSessionExpired"
        color="warning"
        variant="subtle"
        :title="$t('connect.page.login.sessionExpiredAlert.title')"
        :description="$t('connect.page.login.sessionExpiredAlert.description')"
        icon="i-mdi-alert"
      />
      <UCard class="my-auto max-w-md">
        <img
          :src="loginImage"
          class="pb-4"
          :alt="$t('connect.text.imageAltGenericLogin')"
        >
        <div class="space-y-4 pt-2.5">
          <div
            v-for="(option, i) in loginOptions"
            :key="option.label"
            class="flex flex-col items-center gap-1"
          >
            <UButton
              :variant="i === 0 ? 'solid' : 'outline'"
              block
              class="py-2.5"
              v-bind="option"
            />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
