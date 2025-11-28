<script setup lang="ts">
import skierImage from '@/assets/images/skier.png'
</script>

<template>
  <div class="animated-skier">
    <img :src="skierImage" alt="Skier" class="skier-image" />
  </div>
</template>

<style scoped>
.animated-skier {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-30%) translateY(-20vh);
  z-index: 1000;
  pointer-events: none;
  animation: skiDown 20s linear infinite;
}

.skier-image {
  width: 60px;
  height: auto;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

@keyframes skiDown {
  0% {
    transform: translateX(-30%) translateY(-20vh) rotate(-25deg);
  }
  33% {
    transform: translateX(30%) translateY(33vh) rotate(25deg);
  }
  66% {
    transform: translateX(-20%) translateY(66vh) rotate(-25deg);
  }
  90% {
    transform: translateX(-50%) translateY(90vh) rotate(-15deg);
  }
  100% {
    transform: translateX(-60%) translateY(100vh) rotate(0deg);
  }
}
</style>
