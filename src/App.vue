<template>
  <v-app id="app">
    <div
      class="header-group"
      ref="headerGroup"
    >
      <!-- loader  -->
      <SbcLoader :show="showLoading" />
      <!-- common header -->
      <SbcHeader
        class="flex-column"
        :key="appStore.refreshKey"
        :inAuth="false"
        :show-product-selector="false"
        :redirectUrlLoginFail="logoutUrl"
        :redirect-on-logout="logoutUrl"
        :showActions="true"
        @account-data-loaded="appLoaded"
      >
      </SbcHeader>
      <BreadCrumb />
      <!-- error alert -->
      <ErrorAlertComponent
        :message="$t('errorAlertMessage')"
        v-if="hasCallFailed"
      ></ErrorAlertComponent>
      <!-- Alert banner -->
      <v-alert
        v-if="bannerText"
        tile
        dense
        type="warning"
        class="mb-0 text-center colour-dk-text"
        v-html="bannerText"
      />

    </div>
    <!-- Global Snackbar -->
    <v-snackbar
      id="global-snackbar"
      v-model="appStore.snackbar.show"
      :timeout="appStore.snackbar.timeout"
      :color="appStore.snackbar.color"
      :bottom="true"
      transition="fade"
      class="mb-lg-16"
    >
      {{ appStore.snackbar.text }}
    </v-snackbar>
    <!-- body content -->
    <div class="app-body">
      <!-- using v-show instead of v-if to persist state -->
      <LoaderComponent v-show="isThereActiveCalls"></LoaderComponent>
      <keep-alive :include="['TransactionTableView']">
        <router-view v-show="!isThereActiveCalls" />
      </keep-alive>
    </div>
    <SbcFooter :aboutText="aboutText" />
  </v-app>
</template>
<script lang="ts">
import { defineComponent, ref, computed, onMounted } from '@vue/composition-api'
import ErrorAlertComponent from '@/components/common/ErrorAlertComponent.vue'
import LoaderComponent from '@/components/common/LoaderComponent.vue'
import SbcFooter from 'sbc-common-components/src/components/SbcFooter.vue'
import SbcHeader from 'sbc-common-components/src/components/SbcHeader.vue'
import SbcLoader from 'sbc-common-components/src/components/SbcLoader.vue'
import { useLoader, useErrorAlert } from './composables/common'
import BreadCrumb from '@/components/common/BreadCrumb.vue'
import { useAppStore } from '@/store/app'
import LaunchDarklyService from 'sbc-common-components/src/services/launchdarkly.services'
import { LDFlags } from './util/constants'

export default defineComponent({
  components: {
    SbcHeader,
    SbcFooter,
    SbcLoader,
    LoaderComponent,
    ErrorAlertComponent,
    BreadCrumb
  },
  setup () {
    const appStore = useAppStore()
    const { isThereActiveCalls } = useLoader()
    const { hasCallFailed } = useErrorAlert()
    const aboutText = computed<string>(() => {
      return import.meta.env.ABOUT_TEXT
    })
    const showLoading = ref(true)
    const logoutUrl = ref('')

    const appLoaded = () => {
      appStore.loadComplete()
    }
    onMounted(() => {
      showLoading.value = false
    })
    const bannerText = computed<string>(() => {
      const bannerText: string = LaunchDarklyService.getFlag(LDFlags.BannerText)
      // remove spaces so that " " becomes falsy
      return bannerText?.trim()
    })

    return {
      appStore,
      hasCallFailed,
      isThereActiveCalls,
      aboutText,
      showLoading,
      logoutUrl,
      appLoaded,
      bannerText
    }
  }
})
</script>

<style lang="scss">
  .app-container {
    display: flex;
    flex-flow: column nowrap;
    min-height: 100vh;
  }

  .header-group {
    position: sticky;
    position: -webkit-sticky; /* For Safari support */
    top: 0;
    width: 100%;
    z-index: 2;
  }

  .app-body {
    flex: 1 1 auto;
    position: relative;
  }

  .sbc-header {
    height: 70px;
  }
</style>
