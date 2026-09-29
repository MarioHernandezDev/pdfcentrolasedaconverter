<script setup lang="ts">
import { computed, ref } from 'vue'
import { FileUp, FileText, Presentation, X } from '@lucide/vue'

defineProps<{
  submissionError?: string
}>()

const emit = defineEmits<{
  process: [payload: { file: File; title: string }]
}>()

const selectedFile = ref<File | null>(null)
const title = ref('')
const errorMessage = ref('')
const isDragging = ref(false)
const inputElement = ref<HTMLInputElement | null>(null)

const fileExtension = computed(() => selectedFile.value?.name.split('.').pop()?.toLowerCase() ?? '')
const fileIcon = computed(() => fileExtension.value === 'pptx' ? Presentation : FileText)
const formattedFileSize = computed(() => {
  if (!selectedFile.value) return ''
  const sizeInKb = selectedFile.value.size / 1024
  return sizeInKb >= 1024
    ? `${(sizeInKb / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(sizeInKb))} KB`
})

function acceptFile(file?: File) {
  if (!file) return
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (extension !== 'pdf' && extension !== 'pptx') {
    selectedFile.value = null
    title.value = ''
    errorMessage.value = 'Formato no admitido. Selecciona un archivo PDF o PPTX.'
    return
  }

  if (file.size > 20 * 1024 * 1024) {
    selectedFile.value = null
    title.value = ''
    errorMessage.value = 'El archivo supera el límite permitido de 20 MB.'
    return
  }

  selectedFile.value = file
  title.value = file.name.replace(/\.(pdf|pptx)$/i, '').replace(/[_-]+/g, ' ').trim()
  errorMessage.value = ''
}

function handleInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  acceptFile(input.files?.[0])
  input.value = ''
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  acceptFile(event.dataTransfer?.files[0])
}

function clearFile() {
  selectedFile.value = null
  title.value = ''
  errorMessage.value = ''
  if (inputElement.value) inputElement.value.value = ''
}

function submitDocument() {
  if (!selectedFile.value || !title.value.trim()) return
  emit('process', { file: selectedFile.value, title: title.value.trim() })
}
</script>

<template>
  <section class="w-full max-w-[620px] border border-line bg-white px-5 py-6 sm:px-9 sm:py-9">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">Nuevo proceso</p>
        <h2 class="mt-2 text-xl font-medium tracking-[-0.02em] text-ink">Carga el documento</h2>
        <p class="mt-2 max-w-md text-sm leading-6 text-muted">Prepara una portada estandarizada para tu documento.</p>
      </div>
      <span class="hidden border border-line px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-muted sm:inline-flex">PDF · PPTX</span>
    </div>

    <p v-if="submissionError" class="mt-5 border border-[#e4c6c2] bg-[#fbf3f2] px-3.5 py-2.5 text-xs text-[#8a514c]" role="alert">{{ submissionError }}</p>

    <div
      class="mt-7 flex min-h-[190px] cursor-pointer flex-col items-center justify-center border border-dashed px-5 py-7 text-center transition-colors"
      :class="isDragging ? 'border-accent bg-[#f2f5f2]' : 'border-[#cbd1cc] bg-[#fbfcfb] hover:border-[#8d9990]'"
      role="button"
      tabindex="0"
      aria-label="Seleccionar archivo PDF o PPTX"
      @click="inputElement?.click()"
      @keydown.enter.prevent="inputElement?.click()"
      @keydown.space.prevent="inputElement?.click()"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <input
        ref="inputElement"
        type="file"
        hidden
        aria-hidden="true"
        tabindex="-1"
        accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        @click.stop
        @change="handleInputChange"
      >
      <FileUp :size="22" :stroke-width="1.5" class="text-muted" aria-hidden="true" />
      <p class="mt-3 text-sm font-medium text-ink">Arrastra el archivo aquí</p>
      <p class="mt-1.5 text-xs text-muted">o <span class="underline underline-offset-2">selecciona desde tu equipo</span></p>
      <p class="mt-3 text-[10px] uppercase tracking-[0.12em] text-[#8b928d]">Solo PDF o PPTX · Máximo 20 MB</p>
    </div>

    <p v-if="errorMessage" class="mt-3 text-xs text-[#8a514c]" role="alert">{{ errorMessage }}</p>

    <div v-if="selectedFile" class="mt-4 flex items-center gap-3 border border-line px-3.5 py-3">
      <component :is="fileIcon" :size="18" :stroke-width="1.6" class="shrink-0 text-accent" aria-hidden="true" />
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-ink">{{ selectedFile.name }}</p>
        <p class="mt-0.5 text-[11px] uppercase tracking-[0.06em] text-muted">{{ formattedFileSize }} · {{ fileExtension }}</p>
      </div>
      <button type="button" class="p-2 text-muted transition-colors hover:text-ink" aria-label="Quitar archivo" @click.stop="clearFile">
        <X :size="16" aria-hidden="true" />
      </button>
    </div>

    <div class="mt-6">
      <label for="document-title" class="mb-2 block text-xs font-medium text-ink">Título detectado para la portada</label>
      <input
        id="document-title"
        v-model="title"
        type="text"
        maxlength="120"
        :disabled="!selectedFile"
        placeholder="El título aparecerá aquí"
        class="h-11 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink placeholder:text-[#a2a8a3] disabled:bg-[#f6f7f5] disabled:text-muted focus:border-ink focus:outline-none"
      >
    </div>

    <button
      type="button"
      :disabled="!selectedFile || !title.trim()"
      class="mt-5 flex h-11 w-full items-center justify-center bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-[#38413b] disabled:cursor-not-allowed disabled:bg-[#b8beb9]"
      @click="submitDocument"
    >
      Generar plantilla
    </button>
    <p class="mt-3 text-center text-[11px] leading-5 text-muted">El archivo se utiliza únicamente durante este proceso.</p>
  </section>
</template>