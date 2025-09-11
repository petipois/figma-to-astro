<template>
  <button @click="resetCreditsHandler" class="bg-orange-700 text-white rounded-md px-4 py-2">
    Reset Credits
  </button>
</template>

<script setup>
import { resetCredits } from "@/lib/appwrite";

// Accept userID as a prop
const props = defineProps({
  userID: {
    type: String
  },
});

const resetCreditsHandler = async () => {
  try {
    await resetCredits(props.userID);
    // Reload page after successful reset
    window.location.reload();
  } catch (err) {
    console.error("Failed to reset credits:", err);
  }
};
</script>
