<template>
  <button class="hamburger-btn" type="button" aria-label="切换侧边栏" @click="toggleClick">
    <Icon icon="lucide:menu" width="18" height="18"/>
  </button>
</template>

<script setup>
import {Icon} from "@iconify/vue";

defineProps({
  isActive: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits()
const toggleClick = () => {
  emit('toggleClick');
}
</script>

<style scoped>
.hamburger-btn {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--cm-text-2);
  cursor: pointer;
  background: transparent;
  flex: 0 0 32px;
}

.hamburger-btn:hover {
  background: var(--cm-surface-soft);
  color: var(--cm-text);
}
</style>
