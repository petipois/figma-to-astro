<template>
  <section class="w-full max-w-6xl mx-auto py-8 space-y-6 text-left">
    <!-- Figma file URL -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Figma File URL</label>
      <input type="text" :value="figmaFile.figmaURL" disabled
        class="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed" />
    </div>

    <!-- Send Figma button -->
    <div class="flex justify-center">
      <button @click="sendFigma" :disabled="loading"
        class="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
        {{ loading ? "Processing..." : "Preview & Generate" }}
      </button>
    </div>

    <!-- Progress bar -->
    <div v-if="loading" class="w-full mt-4">
      <div class="bg-gray-200 rounded-full h-2 overflow-hidden">
        <div class="bg-orange-500 h-full transition-all duration-500" :style="{ width: progress + '%' }"></div>
      </div>
    </div>

    <!-- Countdown & Refresh -->
    <div v-if="generateData || error" class="mt-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
      <div class="text-gray-700">
        Redirecting in <span class="font-semibold">{{ countdown }}</span> second{{ countdown !== 1 ? 's' : '' }}...
      </div>
      <button @click="redirectNow"
        class="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded transition-colors duration-200">
        Refresh Now
      </button>
    </div>

    <!-- Figma preview iframe -->
    <div v-if="generateData" class="mt-6">
      <iframe :src="`https://www.figma.com/embed?embed_host=astra&url=${encodeURIComponent(embedURL)}`"
        class="w-full h-[600px] rounded-lg shadow-md border" allowfullscreen>
      </iframe>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-700 font-medium">❌ Error</p>
      <p class="text-red-600">{{ error }}</p>
    </div>

    <!-- Stats panel -->
    <div v-if="generateData" class="mb-6 p-6 bg-white rounded-lg shadow-lg">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-orange-600">{{ generateData.generationStats.totalFrames }}</div>
          <div class="text-sm text-gray-600">Total Frames</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ generateData.totalComponents }}</div>
          <div class="text-sm text-gray-600">Components Generated</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ generateData.generationStats.skippedFrames }}</div>
          <div class="text-sm text-gray-600">Frames Skipped</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-600">{{ new Set(generateData.sections.map(s => s.componentType)).size }}</div>
          <div class="text-sm text-gray-600">Component Types</div>
        </div>
      </div>
    </div>

    <!-- index.astro preview -->
    <div v-if="generateData" class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 relative">
      <h3 class="font-bold text-lg mb-2 text-blue-900">📋 Complete index.astro File</h3>
      <p class="text-blue-700 mb-3">Copy this complete Astro page that imports all your generated components:</p>
      <pre class="bg-white p-4 rounded border overflow-x-auto text-sm"><code>{{ generateData.indexFile }}</code></pre>
      <button @click="copyToClipboard(generateData.indexFile)"
        class="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm transition-colors duration-200">
        Copy All
      </button>
    </div>

    <!-- Components grid -->
    <h3 v-if="generateData" class="text-2xl font-bold mb-4 text-gray-900">Generated Components</h3>
    <div v-if="generateData" class="grid grid-cols-1 md:grid-cols-2 gap-6" id="sectionsContainer">
      <div v-for="section in generateData.sections" :key="section.id"
        class="p-6 border border-gray-200 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h4 class="text-lg font-semibold text-gray-900">{{ section.componentName }}.astro</h4>
            <span class="text-sm px-2 py-1 rounded-full"
              :class="`bg-${getColorForType(section.componentType)}-100 text-${getColorForType(section.componentType)}-800`">
              {{ section.componentType }}
            </span>
          </div>
          <div class="text-sm text-gray-500">
            {{ section.texts.length }} text{{ section.texts.length !== 1 ? 's' : '' }} found
          </div>
        </div>

        <!-- Extracted texts -->
        <div v-if="section.texts.length" class="mb-4">
          <p class="text-sm font-medium text-gray-700 mb-2">Extracted Text:</p>
          <div class="text-xs text-gray-600 bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
            <span v-for="t in section.texts" :key="t" class="inline-block bg-white px-2 py-1 rounded mr-1 mb-1 border">
              {{ t }}
            </span>
          </div>
        </div>

        <!-- Component code -->
        <div class="mb-4">
          <p class="text-sm font-medium text-gray-700 mb-2">Generated Code:</p>
          <pre class="bg-gray-50 p-3 rounded text-xs overflow-x-auto max-h-64 overflow-y-auto border"><code>{{ section.code }}</code></pre>
        </div>

        <!-- Copy button -->
        <button @click="copyComponent(section)"
          class="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded transition-colors duration-200 font-medium">
          Copy Component Code
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch } from "vue"
import figmaFile from "@/lib/figmaFrames.json"
import { updateCredits } from "@/lib/appwrite"

const props = defineProps({ userID: String })

const loading = ref(false)
const error = ref(null)
const generateData = ref(null)
const progress = ref(0)
const embedURL = figmaFile.figmaURL

// Countdown state
const countdown = ref(10)
let countdownInterval = null

const sendFigma = async () => {
  loading.value = true
  error.value = null
  generateData.value = null
  progress.value = 0

  try {
    if (!props.userID) throw new Error("User not authenticated")

    // Update credits
    progress.value = 10
    await updateCredits(props.userID)

    progress.value = 25
    await new Promise(r => setTimeout(r, 300)) // simulate fetch

    progress.value = 50
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(figmaFile)
    })

    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.message || "Failed to generate components")

    generateData.value = data
    progress.value = 100

    // Start countdown
    startCountdown()
  } catch (err) {
    error.value = err.message || "Unknown error"
    startCountdown()
  } finally {
    loading.value = false
  }
}

// Countdown functions
const startCountdown = () => {
  clearInterval(countdownInterval)
  countdown.value = 60
  countdownInterval = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      redirectNow()
    }
  }, 1000)
}

const redirectNow = () => {
  clearInterval(countdownInterval)
  location.href = "/demo"
}

// Helpers
const getColorForType = (type) => {
  const colors = {
    Navbar: "blue",
    Hero: "purple",
    Footer: "gray",
    AboutUs: "green",
    Newsletter: "yellow",
    Blog: "indigo",
    Testimonial: "pink",
    Gallery: "cyan",
    CTA: "orange",
    Card: "slate"
  }
  return colors[type] || "gray"
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  } catch {
    alert("Failed to copy.")
  }
}

const copyComponent = async (section) => {
  try {
    await navigator.clipboard.writeText(section.code)
    alert(`Copied ${section.componentName}.astro!`)
  } catch {
    alert("Failed to copy component code.")
  }
}
</script>
