<template>
  <section class="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-gradient-to-b from-white to-orange-50">
    <h1 class="text-5xl md:text-6xl font-extrabold mb-4 text-gray-900 drop-shadow-md">
      Add Your Figma File
    </h1>
    <p class="text-gray-700 mb-8 max-w-xl text-center">
      Paste a Figma file URL below to see a live preview and generate ready-to-use Astro components instantly.
    </p>

    <form @submit.prevent="submitFigma" class="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-2xl mb-8">
      <input
        v-model="figmaURL"
        type="url"
        placeholder="Paste your Figma file URL"
        required
        class="flex-1 px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      <button
        type="submit"
        :disabled="loading"
        class="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md transform hover:scale-105 disabled:opacity-50"
      >
        {{ loading ? 'Fetching...' : 'Add File' }}
      </button>
    </form>

    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <p class="text-red-700 font-medium">❌ Error</p>
      <p class="text-red-600">{{ error }}</p>
    </div>

    <div v-if="success" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <p class="text-green-700 font-medium">✅ Success</p>
      <p class="text-green-600">Figma file fetched successfully!</p>
    </div>

    <div v-if="fileData" class="mb-6 p-6 bg-white rounded-lg shadow-lg">
      <h3 class="font-bold text-lg mb-2 text-gray-900">Figma File: {{ fileData.figmaData.name }}</h3>
      <p class="text-gray-700 mb-2">File Key: {{ fileData.fileKey }}</p>
      <p class="text-gray-700 mb-2">Components Found: {{ Object.keys(fileData.figmaData.components || {}).length }}</p>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const figmaURL = ref('https://www.figma.com/design/LdilSTSeMPzfJ4F2kj1ErR/Lush-Garden---Florist-Landing-Page-Design--Community-?node-id=0-1&p=f&t=h7KBNr99U1MwC5JJ-0')
const loading = ref(false)
const error = ref(null)
const success = ref(false)
const fileData = ref(null)

const submitFigma = async () => {
  if (!figmaURL.value) {
    error.value = 'Please enter a Figma URL'
    return
  }

  loading.value = true
  error.value = null
  success.value = false
  fileData.value = null

  try {
    const formData = new FormData()
    formData.append('figmaURL', figmaURL.value)

    const res = await fetch('/api/getFile', {
      method: 'POST',
      body: formData
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      error.value = data.message || 'Failed to fetch Figma file'
    } else {
      fileData.value = data
      success.value = true
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>
