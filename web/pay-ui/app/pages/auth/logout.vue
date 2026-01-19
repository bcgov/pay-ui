<script setup lang="ts">
const route = useRoute()
const ac = useAppConfig().connect
const { logout } = useConnectAuth()

const redirectUrl = computed(() => {
  const requestUrl = useRequestURL()
  const baseUrl = requestUrl.origin
  const urlReturn = route.query.return
  return urlReturn !== undefined
    ? `${baseUrl}${urlReturn}`
    : `${baseUrl}/auth/login`
})

onMounted(async () => {
  await logout(redirectUrl.value)
})
</script>

<template>
  <ConnectSpinner fullscreen />
</template>
