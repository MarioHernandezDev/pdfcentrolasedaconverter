<script setup lang="ts">
import { LoaderCircle } from '@lucide/vue'

defineProps<{
  title: string
}>()
</script>

<template>
  <section class="w-full max-w-[520px] border border-line bg-white px-6 py-12 text-center sm:px-10" role="status">
    <div class="mx-auto flex h-12 w-12 items-center justify-center border border-line text-accent">
      <LoaderCircle :size="21" :stroke-width="1.6" class="animate-spin" aria-hidden="true" />
    </div>
    <p class="mt-7 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">Proceso en curso</p>
    <h2 class="mt-2 text-xl font-medium tracking-[-0.02em] text-ink">Preparando plantilla</h2>
    <p class="mx-auto mt-2 max-w-sm truncate text-sm text-muted">{{ title }}</p>
    <div class="mx-auto mt-8 h-px max-w-[260px] overflow-hidden bg-line">
      <div class="h-full w-1/2 animate-[progress_1.4s_ease-in-out_infinite] bg-accent" />
    </div>
    <p class="mt-4 text-xs text-muted">Estamos organizando el documento para su descarga.</p>
  </section>
</template>

<style scoped>
@keyframes progress {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
</style>