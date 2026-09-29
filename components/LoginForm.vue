<script setup lang="ts">
import { ref } from 'vue'
import { ArrowRight, LockKeyhole } from '@lucide/vue'

const emit = defineEmits<{
  authenticated: []
}>()

const password = ref('')
const hasError = ref(false)
const isSubmitting = ref(false)

async function submitPassword() {
  isSubmitting.value = true

  try {
    await $fetch('/api/auth', {
      method: 'POST',
      body: { password: password.value }
    })
    hasError.value = false
    emit('authenticated')
  } catch {
    hasError.value = true
    password.value = ''
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="w-full max-w-[440px] border border-line bg-white px-6 py-8 sm:px-9 sm:py-10">
    <div class="mb-8 flex h-11 w-11 items-center justify-center border border-line text-ink">
      <LockKeyhole :size="18" :stroke-width="1.6" aria-hidden="true" />
    </div>

    <p class="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">Acceso restringido</p>
    <h2 class="mt-2 text-2xl font-medium tracking-[-0.025em] text-ink">Iniciar sesión</h2>
    <p class="mt-2 text-sm leading-6 text-muted">Introduce la contraseña para acceder al sistema de documentos.</p>

    <form class="mt-8" @submit.prevent="submitPassword">
      <label for="access-password" class="mb-2 block text-xs font-medium text-ink">Contraseña</label>
      <input
        id="access-password"
        v-model="password"
        type="password"
        autocomplete="current-password"
        required
        class="h-11 w-full rounded-none border border-line bg-white px-3.5 text-sm text-ink placeholder:text-[#a2a8a3] focus:border-ink focus:outline-none"
        placeholder="Escribe tu contraseña"
        :aria-invalid="hasError"
        aria-describedby="password-feedback"
      >
      <p id="password-feedback" class="mt-2 min-h-5 text-xs text-[#8a514c]" role="alert">
        {{ hasError ? 'La contraseña no es válida. Inténtalo de nuevo.' : '' }}
      </p>
      <button
        type="submit"
        :disabled="isSubmitting"
        class="mt-3 flex h-11 w-full items-center justify-center gap-2 bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-[#38413b] disabled:cursor-not-allowed disabled:bg-[#b8beb9]"
      >
        {{ isSubmitting ? 'Comprobando...' : 'Acceder' }}
        <ArrowRight v-if="!isSubmitting" :size="15" :stroke-width="1.8" aria-hidden="true" />
      </button>
    </form>
    <p class="mt-6 border-t border-line pt-5 text-[11px] leading-5 text-muted">Acceso exclusivo para personal autorizado.</p>
  </section>
</template>