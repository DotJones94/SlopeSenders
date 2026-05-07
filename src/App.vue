<script setup lang="ts">
import BestsVotingModal from '@/components/BestsVotingModal.vue'
import PredictionsVotingModal from '@/components/PredictionsVotingModal.vue'
import SeasonMetricsModal from '@/components/SeasonMetricsModal.vue'
import UserSessionModal from '@/components/UserSessionModal.vue'
</script>

<template>
  <router-view />
  <UserSessionModal />
  <BestsVotingModal />
  <PredictionsVotingModal />
  <SeasonMetricsModal />
</template>
