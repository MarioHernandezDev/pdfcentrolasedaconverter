<script setup lang="ts">
import { ref } from 'vue'
import { ArrowUpRight, FileCheck2, LockKeyhole } from '@lucide/vue'
import DocumentUploader from '~/components/DocumentUploader.vue'
import LoginForm from '~/components/LoginForm.vue'
import ProcessingState from '~/components/ProcessingState.vue'
import SuccessPanel from '~/components/SuccessPanel.vue'

type Stage = 'upload' | 'processing' | 'success'

interface UploadResponse {
  processId: string
}

interface ConvertResponse {
  downloadUrl: string
}

const isAuthenticated = ref(false)
const stage = ref<Stage>('upload')
const documentTitle = ref('')
const downloadUrl = ref('')
const submissionError = ref('')

function extractErrorMessage(error: unknown): string {
  const fetchError = error as { data?: { data?: { message?: string }; message?: string } } | undefined
  return fetchError?.data?.data?.message
    ?? fetchError?.data?.message
    ?? 'No se ha podido completar el proceso. Intentalo de nuevo.'
}

async function startProcessing(payload: { file: File; title: string }) {
  stage.value = 'processing'
  documentTitle.value = payload.title
  submissionError.value = ''
  downloadUrl.value = ''

  try {
    const formData = new FormData()
    formData.append('file', payload.file)
    formData.append('title', payload.title)

    const uploadResult = await $fetch<UploadResponse>('/api/upload', {
      method: 'POST',
      body: formData
    })

    const convertResult = await $fetch<ConvertResponse>('/api/convert', {
      method: 'POST',
      body: { processId: uploadResult.processId, title: payload.title }
    })

    downloadUrl.value = convertResult.downloadUrl
    stage.value = 'success'
  } catch (error) {
    submissionError.value = extractErrorMessage(error)
    stage.value = 'upload'
  }
}

function returnToUpload() {
  stage.value = 'upload'
  documentTitle.value = ''
  downloadUrl.value = ''
  submissionError.value = ''
}
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <header class="border-b border-line bg-white">
      <div class="mx-auto flex min-h-[76px] max-w-6xl items-center justify-between px-5 sm:px-8">
        <a class="flex items-center gap-3" href="#inicio" aria-label="Centro Laseda, inicio">
          <span class="flex h-9 w-9 items-center justify-center border border-ink text-ink">
            <FileCheck2 :size="18" :stroke-width="1.7" aria-hidden="true" />
          </span>
          <span class="leading-tight">
            <span class="block text-sm font-semibold tracking-[0.02em] text-ink">CENTRO LASEDA</span>
            <span class="mt-1 block text-[10px] font-medium uppercase tracking-[0.14em] text-muted">Gestión documental</span>
          </span>
        </a>

        <div class="flex items-center gap-2.5 text-xs font-medium text-muted">
          <span class="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          <span>Sistema interno</span>
        </div>
      </div>
    </header>

    <main id="inicio" class="mx-auto flex min-h-[calc(100vh-76px)] max-w-6xl flex-col px-5 pb-12 pt-10 sm:px-8 sm:pt-14">
      <div class="mb-9 flex items-center justify-between border-b border-line pb-5">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Herramientas internas <span class="px-1.5 text-[#b4bab5]">/</span> Documentos</p>
          <h1 class="mt-2 text-xl font-medium tracking-[-0.02em] text-ink sm:text-2xl">Estandarización de documentos</h1>
        </div>
        <div v-if="isAuthenticated" class="hidden items-center gap-2 text-xs text-muted sm:flex">
          <LockKeyhole :size="14" :stroke-width="1.7" aria-hidden="true" />
          <span>Sesión protegida</span>
        </div>
      </div>

      <section class="flex flex-1 items-start justify-center sm:items-center" aria-live="polite">
        <LoginForm v-if="!isAuthenticated" @authenticated="isAuthenticated = true" />
        <DocumentUploader
          v-else-if="stage === 'upload'"
          :submission-error="submissionError"
          @process="startProcessing"
        />
        <ProcessingState v-else-if="stage === 'processing'" :title="documentTitle" />
        <SuccessPanel
          v-else
          :title="documentTitle"
          :download-url="downloadUrl"
          @new-document="returnToUpload"
        />
      </section>

      <footer class="mt-10 flex flex-col gap-2 border-t border-line pt-5 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>Centro Laseda <span class="px-1 text-[#b4bab5]">/</span> Uso interno</span>
        <span class="inline-flex items-center gap-1.5">Tratamiento confidencial <ArrowUpRight :size="12" aria-hidden="true" /></span>
      </footer>
    </main>
  </div>
</template>