<template>
  <v-container class="view-container">
    <v-row justify="center">
      <v-col cols="12" lg="8" class="text-center">
        <v-icon size="48" color="warning" class="mb-6">mdi-wrench-outline</v-icon>
        <h1>EFT System Maintenance</h1>
        <p class="mt-8 mb-10">
          The Electronic Funds Transfer (EFT) system is currently undergoing maintenance.
          Please check back later. We apologize for any inconvenience.
        </p>
        <div class="btns">
          <v-btn
            large
            link
            color="primary"
            id="home-btn"
            to="/home"
          >
            Return to Home
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator'
import Vue from 'vue'

@Component
export default class EftMaintenanceView extends Vue {
}
</script>
