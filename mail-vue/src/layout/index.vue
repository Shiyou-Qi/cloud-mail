<template>
  <el-container class="layout">
    <el-aside
        class="aside"
        :class="[uiStore.asideShow ? 'aside-show' : 'el-aside-hide', asideCollapsed ? 'aside-collapsed' : '']">
      <Aside :collapsed="asideCollapsed" />
    </el-aside>
    <div
        :class="(uiStore.asideShow && isMobile)? 'overlay-show':'overlay-hide'"
        @click="uiStore.asideShow = false"
    ></div>
    <el-container class="main-container">
      <el-main>
        <el-header>
            <Header />
        </el-header>
        <Main />
      </el-main>
    </el-container>
  </el-container>
  <writer ref="writerRef" />
</template>

<script setup>
import Aside from '@/layout/aside/index.vue'
import Header from '@/layout/header/index.vue'
import Main from '@/layout/main/index.vue'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {useUiStore} from "@/store/ui.js";
import writer from '@/layout/write/index.vue'

const uiStore = useUiStore();
const writerRef = ref({})
const isMobile = ref(window.innerWidth < 1025)
const asideCollapsed = computed(() => uiStore.asideCollapsed && !isMobile.value)
const handleResize = () => {
  isMobile.value = window.innerWidth < 1025
  uiStore.asideShow = window.innerWidth > 1024;
}

onMounted(() => {
  uiStore.writerRef = writerRef

  window.addEventListener('resize', handleResize)
  handleResize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.layout {
  height: 100%;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
  background: var(--cm-canvas);
}

.el-aside {
  width: var(--cm-aside-w);
  flex: 0 0 auto;
  transition: width 180ms ease, transform 180ms ease;
  background: var(--cm-surface);
}

.el-aside.aside-collapsed { width: var(--cm-aside-w-collapsed); }

.aside-show {
  transform: translateX(0);
  z-index: 101;

  @media (max-width: 1024px) {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: var(--cm-aside-w);
    box-shadow: var(--cm-shadow-2);
  }
}

.el-aside-hide {
  position: fixed;
  left: 0;
  height: 100%;
  z-index: 100;
  transform: translateX(-100%);
  transition: transform 160ms ease;
}

@media (max-width: 1024px) {
  .el-aside { width: var(--cm-aside-w); }
  .el-aside.aside-collapsed { width: var(--cm-aside-w); }
}

.main-container {
  min-height: 100%;
  min-width: 0;
  background: var(--cm-canvas);
  overflow: hidden;
  -webkit-overflow-scrolling: touch;
}

.el-main {
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.el-header {
  height: var(--cm-header-h) !important;
  flex: 0 0 var(--cm-header-h);
  padding: 0;
  background: var(--cm-surface);
}

.overlay-show {
  position: fixed;
  inset: 0;
  background: var(--cm-overlay);
  z-index: 100;
  transition: opacity .2s ease;
  backdrop-filter: blur(1px);
}

.overlay-hide {
  display: flex;
  pointer-events: none;
  opacity: 0;
}
</style>
