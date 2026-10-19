<template>
  <div :class="accountShow && hasPerm('account:query') ? 'main-box-show' : 'main-box-hide'">
    <div :class="accountShow && hasPerm('account:query') ? 'block-show' : 'block-hide'" @click="uiStore.accountShow = false"></div>
    <account  :class="accountShow && hasPerm('account:query') ? 'show' : 'hide'" />
    <router-view class="main-view" v-slot="{ Component,route }">
      <keep-alive :include="['email','all-email','send','sys-setting','star','user','role','analysis','reg-key','draft']">
        <component :is="Component" :key="route.name"/>
      </keep-alive>
    </router-view>
  </div>
</template>
<script setup>
import account from '@/layout/account/index.vue'
import {useUiStore} from "@/store/ui.js";
import {useSettingStore} from "@/store/setting.js";
import {computed, onBeforeUnmount, onMounted, watch} from "vue";
import { useRoute } from 'vue-router'
import { hasPerm } from "@/perm/perm.js"

const settingStore = useSettingStore()
const uiStore = useUiStore();
const route = useRoute()
let  innerWidth =  window.innerWidth

let elNotification = null

const accountShow = computed(() => {
  return uiStore.accountShow && settingStore.settings.manyEmail === 0
})

watch(() => uiStore.changeNotice, () => {

  const settings = settingStore.settings

  let data = {
    notice: settings.notice,
    noticeWidth: settings.noticeWidth,
    noticeTitle: settings.noticeTitle,
    noticeContent: settings.noticeContent,
    noticeType: settings.noticeType,
    noticeDuration: settings.noticeDuration,
    noticePosition: settings.noticePosition,
    noticeOffset: settings.noticeOffset
  }

  showNotice(data)
})

watch(() => uiStore.changePreview, () => {
  showNotice(uiStore.previewData)
})

function showNotice(data) {

  if (data.notice === 1) {
    return;
  }

  if (elNotification) {
    elNotification.close()
  }

  const style = document.createElement('style');
  style.innerHTML = `
  .custom-notice.el-notification {
    --el-notification-width: min(${data.noticeWidth}px,calc(100% - 30px)) !important;
  }
  `;

  document.head.appendChild(style);

  elNotification = ElNotification({
    title: data.noticeTitle,
    message: `<div style="width: 100%;height: 100%;">${data.noticeContent}</div>`,
    type: data.noticeType === 'none' ? '' : data.noticeType,
    duration: data.noticeDuration,
    position: data.noticePosition,
    offset: data.noticeOffset,
    dangerouslyUseHTMLString: true,
    customClass: 'custom-notice'
  })
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  handleResize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

const handleResize = () => {
  if (['content','email','send'].includes(route.meta.name)) {
    if (innerWidth !==  window.innerWidth) {
      innerWidth = window.innerWidth;
      uiStore.accountShow = window.innerWidth >= 767;
    }
  }
}

</script>
<style lang="scss" scoped>
.main-box-show,
.main-box-hide {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
}

.main-box-show { grid-template-columns: var(--cm-account-w) 1fr; }

.main-box-hide { grid-template-columns: 1fr; }

@media (max-width: 767px) {
  .main-box-show { grid-template-columns: 1fr; }
}

.main-view {
  background: var(--cm-canvas);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.block-show {
  position: fixed;

  @media (max-width: 767px) {
    position: absolute;
    inset: 0;
    height: 100%;
    width: 100%;
    background: var(--cm-overlay);
    z-index: 10;
    transition: opacity 200ms ease;
  }
}

.block-hide {
  position: fixed;
  pointer-events: none;
  transition: opacity 200ms ease;
}

.show {
  transition: transform 180ms ease;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  @media (max-width: 767px) {
    position: fixed;
    z-index: 100;
    width: 260px;
    box-shadow: var(--cm-shadow-2);
  }
}

.hide {
  transition: transform 180ms ease;
  position: fixed;
  transform: translateX(-100%);
  opacity: 0;
  height: 100%;

  @media (max-width: 1024px) {
    width: 260px;
    z-index: 100;
  }
}
</style>
