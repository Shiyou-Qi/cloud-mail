<template>
  <div class="aside-inner" :class="{ 'is-collapsed': collapsed }">
    <div class="brand">
      <div class="brand-mark">
        <Icon icon="lucide:mail" width="17" height="17"/>
      </div>
      <div class="brand-text">{{ settingStore.settings.title }}</div>
      <button class="brand-toggle" type="button"
              :aria-label="uiStore.asideCollapsed ? '展开侧边栏' : '收起侧边栏'"
              :title="uiStore.asideCollapsed ? '展开侧边栏' : '收起侧边栏'"
              @click="toggleSidebar">
        <Icon :icon="collapsed ? 'lucide:chevron-right' : 'lucide:chevron-left'" width="16" height="16"/>
      </button>
    </div>

    <el-scrollbar class="nav-scroll">
      <nav class="nav">
        <div class="nav-group">
          <button v-for="item in visiblePrimary" :key="item.name" class="nav-item"
                  :class="{ 'is-active': route.meta.name === item.name }"
                  :title="collapsed ? $t(item.label) : ''"
                  @click="go(item)">
            <Icon :icon="item.icon" width="18" height="18"/>
            <span class="nav-text">{{ $t(item.label) }}</span>
          </button>
        </div>

        <div class="nav-group" v-if="manageItems.length">
          <div class="nav-label">{{ $t('manage') }}</div>
          <button v-for="item in manageItems" :key="item.name" class="nav-item"
                  :class="{ 'is-active': route.meta.name === item.name }"
                  :title="collapsed ? $t(item.label) : ''"
                  @click="go(item)">
            <Icon :icon="item.icon" width="18" height="18"/>
            <span class="nav-text">{{ $t(item.label) }}</span>
          </button>
        </div>
      </nav>
    </el-scrollbar>

    <div class="aside-foot">
      <div class="foot-dot"></div>
      <span class="foot-text">Cloud Mail</span>
    </div>
  </div>
</template>

<script setup>
import router from "@/router/index.js";
import {useRoute} from "vue-router";
import {computed} from "vue";
import {Icon} from "@iconify/vue";
import {useSettingStore} from "@/store/setting.js";
import {useUiStore} from "@/store/ui.js";
import {hasPerm} from "@/perm/perm.js";

const settingStore = useSettingStore();
const uiStore = useUiStore();
const route = useRoute();
defineProps({collapsed: {type: Boolean, default: false}})

const primary = [
  {name: 'email', label: 'inbox', icon: 'lucide:inbox', path: '/inbox'},
  {name: 'send', label: 'sent', icon: 'lucide:send', path: '/sent', perm: 'email:send'},
  {name: 'draft', label: 'drafts', icon: 'lucide:file-text', path: '/drafts', perm: 'email:send'},
  {name: 'star', label: 'starred', icon: 'lucide:star', path: '/starred'},
  {name: 'setting', label: 'settings', icon: 'lucide:settings', path: '/settings'}
]

const manage = [
  {name: 'analysis', label: 'analytics', icon: 'lucide:chart-pie', path: '/analysis', perm: 'analysis:query'},
  {name: 'user', label: 'allUsers', icon: 'lucide:users', path: '/all-users', perm: 'user:query'},
  {name: 'all-email', label: 'allMail', icon: 'lucide:mails', path: '/all-mail', perm: 'all-email:query'},
  {name: 'role', label: 'permissions', icon: 'lucide:shield-check', path: '/role', perm: 'role:query'},
  {name: 'reg-key', label: 'inviteCode', icon: 'lucide:key-round', path: '/invite-code', perm: 'reg-key:query'},
  {name: 'sys-setting', label: 'SystemSettings', icon: 'lucide:sliders-horizontal', path: '/system-settings', perm: 'setting:query'}
]

const manageItems = computed(() => manage.filter(i => hasPerm(i.perm)))
const visiblePrimary = computed(() => primary.filter(i => !i.perm || hasPerm(i.perm)))

function go(item) {
  router.push({name: item.name})
  if (window.innerWidth <= 1024) uiStore.asideShow = false
}

function toggleSidebar() {
  if (window.innerWidth <= 1024) {
    uiStore.asideShow = false
    return
  }
  uiStore.asideCollapsed = !uiStore.asideCollapsed
}
</script>

<style lang="scss" scoped>
.aside-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--cm-surface);
  border-right: 1px solid var(--cm-line);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: var(--cm-header-h);
  flex: 0 0 var(--cm-header-h);
  padding: 0 10px 0 16px;
  border-bottom: 1px solid var(--cm-line);
  position: relative;
}

.brand-mark {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  background: var(--cm-brand);
  color: var(--cm-brand-ink);
  flex: 0 0 28px;
  box-shadow: 0 4px 10px -4px rgba(70, 191, 208, .85);
}

.brand-text {
  font-size: 14.5px;
  font-weight: 640;
  letter-spacing: -.01em;
  color: var(--cm-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 1;
}

.brand-toggle {
  flex: 0 0 26px;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  color: var(--cm-text-3);
  cursor: pointer;
  opacity: 0;
  transition: opacity .15s ease, background-color .15s ease, color .15s ease;

  &:hover { background: var(--cm-surface-soft); color: var(--cm-text); }
}
.aside-inner:hover .brand-toggle { opacity: 1; }

.nav-scroll { flex: 1; min-height: 0; }

.nav {
  padding: 12px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.nav-group { display: flex; flex-direction: column; gap: 2px; }

.nav-label {
  font-size: 11px;
  font-weight: 620;
  letter-spacing: .08em;
  color: var(--cm-text-3);
  padding: 0 10px 6px;
  white-space: nowrap;
  overflow: hidden;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  padding: 0 10px;
  border-radius: 9px;
  color: var(--cm-text-2);
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 500;
  position: relative;
  transition: background-color .15s ease, color .15s ease;
  text-align: left;
  width: 100%;

  .iconify { color: var(--cm-text-3); transition: color .15s ease; }

  &:hover { background: var(--cm-surface-soft); color: var(--cm-text); }
  &:hover .iconify { color: var(--cm-text-2); }

  &.is-active {
    background: var(--cm-brand-soft);
    color: var(--cm-brand-strong);
    font-weight: 600;
  }
  &.is-active .iconify { color: var(--cm-brand-strong); }
  &.is-active::before {
    content: "";
    position: absolute;
    left: -10px;
    top: 9px;
    bottom: 9px;
    width: 2px;
    border-radius: 0 2px 2px 0;
    background: var(--cm-brand);
  }
}

.nav-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.aside-foot {
  flex: 0 0 auto;
  height: 40px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 18px;
  border-top: 1px solid var(--cm-line);
  color: var(--cm-text-3);
  font-size: 11.5px;
  white-space: nowrap;
  overflow: hidden;

  .foot-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--cm-success);
    box-shadow: 0 0 0 3px rgba(47, 158, 111, .14);
    flex: 0 0 6px;
  }
}

.aside-inner.is-collapsed {
  .brand { padding: 0; justify-content: center; }
  .brand-text { display: none; }
  .brand-mark { transition: opacity .14s ease; }
  .brand-toggle {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
    background: transparent;
  }
  &:hover .brand-mark { opacity: 0; }
  &:hover .brand-toggle { opacity: 1; }
  .nav { padding: 12px 8px; }
  .nav-label { display: none; }
  .nav-item { justify-content: center; padding: 0; }
  .nav-text { display: none; }
  .nav-item.is-active::before { display: none; }
  .aside-foot { justify-content: center; padding: 0; }
  .foot-text { display: none; }
}
</style>
