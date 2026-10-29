<script setup lang="ts">
const { data: me } = await useFetch<{ name: string }>('/api/v1/me')
</script>

<template>
  <ConnectLayout>
    <template #header>
      <!-- Progress bar at the top of the page while navigating -->
      <NuxtLoadingIndicator color="#FCBA19" />
      <ConnectHeader>
        <div class="flex items-center gap-4 text-white">
          <span data-testid="header-user-name">{{ me?.name }}</span>
          <UButton
            href="/auth/logout"
            external
            color="neutral"
            variant="outline"
            icon="i-mdi-logout-variant"
            :label="$t('header.logout')"
            data-testid="header-logout"
          />
        </div>
      </ConnectHeader>
    </template>
    <slot />
  </ConnectLayout>
</template>
