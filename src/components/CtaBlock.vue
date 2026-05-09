<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section
    class="relative space-y-2 rounded-[2rem] bg-[linear-gradient(145deg,_#0c081f,_#130a2c)] px-4 py-16 text-center shadow-cta overflow-hidden"
  >
    <div class="relative z-10 space-y-2">
      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-brand-lavender/90">
        Slope Senders
      </p>
      <p class="text-3xl font-semibold sm:text-4xl">Because your best run deserves a trophy.</p>
      <p class="text-lg leading-relaxed text-copy-muted">
        Even if you ate more snow than you skied.
      </p>
      <div class="flex flex-wrap justify-center gap-3 pt-6">
        <RouterLink
          to="/stats"
          class="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
        >
          Open personal stats
        </RouterLink>
        <RouterLink
          to="/tally"
          class="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
        >
          View season tallies
        </RouterLink>
      </div>
    </div>
  </section>
</template>
