<script setup lang="ts">
import SeasonMetricsModal from '@/components/SeasonMetricsModal.vue'
import UserSessionModal from '@/components/UserSessionModal.vue'
</script>

<template>
  <router-view />
  <UserSessionModal />
  <SeasonMetricsModal />
</template>
