<script setup lang="ts">
import { Check, Download, FileCheck2, RotateCcw } from '@lucide/vue'

defineProps<{
  title: string
  downloadUrl: string
}>()

const emit = defineEmits<{
  newDocument: []
}>()
</script>

<template>
  <section class="w-full max-w-[560px] border border-line bg-white px-5 py-7 sm:px-9 sm:py-9">
    <div class="flex items-start gap-4">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center border border-[#cbd8ce] bg-[#f2f6f3] text-accent">
        <Check :size="19" :stroke-width="1.7" aria-hidden="true" />
      </span>
      <div class="pt-0.5">
        <p class="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">Proceso completado</p>
        <h2 class="mt-1.5 text-xl font-medium tracking-[-0.02em] text-ink">Plantilla lista</h2>
        <p class="mt-2 text-sm leading-6 text-muted">Se ha preparado la portada para el documento indicado.</p>
      </div>
    </div>

    <div class="mt-7 flex items-center gap-3 border-y border-line py-4">
      <FileCheck2 :size="18" :stroke-width="1.6" class="shrink-0 text-muted" aria-hidden="true" />
      <div class="min-w-0">
        <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Título de portada</p>
        <p class="mt-1 truncate text-sm font-medium text-ink">{{ title }}</p>
      </div>
    </div>

    <div class="mt-5 border-l-2 border-[#cbd8ce] bg-[#f7f9f7] px-3.5 py-3 text-xs leading-5 text-muted">
      El archivo de origen se eliminará de la sesión temporal al finalizar el proceso.
    </div>

    <a
      :href="downloadUrl"
      download
      class="mt-6 flex h-11 w-full items-center justify-center gap-2 bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-[#38413b]"
    >
      <Download :size="16" :stroke-width="1.7" aria-hidden="true" />
      Descargar plantilla
    </a>

    <button
      type="button"
      class="mx-auto mt-5 flex items-center gap-2 py-1 text-xs font-medium text-muted transition-colors hover:text-ink"
      @click="emit('newDocument')"
    >
      <RotateCcw :size="14" aria-hidden="true" />
      Procesar otro documento
    </button>
  </section>
</template>