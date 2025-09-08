<script setup>
import { ref } from "vue";

const figmaURL = ref(
  "https://www.figma.com/design/LdilSTSeMPzfJ4F2kj1ErR/Lush-Garden---Florist-Landing-Page-Design--Community-?node-id=0-1&p=f&t=h7KBNr99U1MwC5JJ-0"
);
const loading = ref(false);
const previewData = ref(null);
const error = ref("");

const handleSubmit = async () => {
  error.value = "";
  previewData.value = null;
  loading.value = true;

  try {
    const res = await fetch("/api/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ figmaURL: figmaURL.value }),
    });

    const data = await res.json();

    if (!res.ok) {
      error.value = data.message || "Invalid Figma URL";
    } else {
      previewData.value = data;
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const copyCode = (code) => {
  navigator.clipboard.writeText(code);
};
</script>

<template>
  <section
    class="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-gradient-to-b from-white to-orange-50"
  >
    <h1 class="text-5xl md:text-6xl font-extrabold mb-4 text-gray-900 drop-shadow-md">
      Preview Your Figma File
    </h1>
    <p class="text-gray-700 mb-8 max-w-xl text-center">
      Paste a Figma file URL below to see a live preview and generate
      ready-to-use Astro components instantly.
    </p>

    <div
      class="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-2xl mb-8"
    >
      <input
        v-model="figmaURL"
        type="url"
        placeholder="Paste your Figma file URL"
        class="flex-1 px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      <button
        @click="handleSubmit"
        :disabled="loading"
        class="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md transform hover:scale-105"
      >
        {{ loading ? "Loading..." : "Preview" }}
      </button>
    </div>

    <div v-if="error" class="text-red-500">{{ error }}</div>
    <div v-else-if="previewData" class="w-full text-left">
      <div class="mb-6 p-4 bg-white rounded-lg shadow">
        <p><strong>Total Frames:</strong> {{ previewData.totalFrames }}</p>
        <p><strong>Sections Detected:</strong> {{ previewData.totalSections }}</p>
      </div>

      <iframe
        :src="previewData.embedUrl"
        class="w-full h-96 border border-gray-200 rounded-lg shadow mb-6"
        allowfullscreen
      ></iframe>

      <div
        id="sectionsContainer"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div
          v-for="s in previewData.sections"
          :key="s.component"
          class="p-4 border rounded-lg shadow-sm bg-white"
        >
          <h3 class="text-xl font-semibold mb-4">{{ s.component }}.astro</h3>
          <pre
            class="bg-gray-100 p-3 rounded mb-4 overflow-x-auto"
          >{{ s.code }}</pre>
          <button
            @click="copyCode(s.code)"
            class="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded transition-colors duration-200"
          >
            Copy to clipboard
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
