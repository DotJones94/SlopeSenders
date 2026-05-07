<script setup lang="ts">
import BestsVotingModal from '@/components/BestsVotingModal.vue'
import SeasonMetricsModal from '@/components/SeasonMetricsModal.vue'
import UserSessionModal from '@/components/UserSessionModal.vue'
</script>

<template>
  <router-view />
  <UserSessionModal />
  <BestsVotingModal />
  <SeasonMetricsModal />
</template>
