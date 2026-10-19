<template>
  <header class="header">
    <div class="header-left">
      <hanburger class="header-hamburger" @click="changeAside"></hanburger>
      <div class="heading">
        <div class="heading-title">{{ $t(route.meta.title) }}</div>
        <div class="heading-sub" v-if="sectionName">{{ sectionName }}</div>
      </div>
    </div>

    <div class="header-right">
      <button v-perm="'email:send'" class="compose" type="button" @click="openSend">
        <Icon icon="lucide:pen-line" width="16" height="16"/>
        <span class="compose-text">{{ $t('compose') }}</span>
      </button>

      <span class="divider"></span>

      <button class="icon-btn" type="button" :title="$t('toggleTheme')" @click="openDark($event)">
        <Icon :icon="uiStore.dark ? 'lucide:sun' : 'lucide:moon'" width="18" height="18"/>
      </button>
      <button class="icon-btn" type="button" :title="$t('announcement')" @click="openNotice">
        <Icon icon="lucide:megaphone" width="18" height="18"/>
      </button>

      <el-dropdown ref="userinfoRef" @visible-change="e => userInfoShow = e" :teleported="false" popper-class="account-dropdown">
        <button class="account-chip" type="button" @click="userInfoHide">
          <span class="account-avatar">{{ formatName(userStore.user.email) }}</span>
          <span class="account-meta">
            <span class="account-name">{{ userStore.user.name }}</span>
            <span class="account-mail">{{ userStore.user.email }}</span>
          </span>
          <Icon class="account-caret" icon="lucide:chevron-down" width="15" height="15"/>
        </button>
        <template #dropdown>
          <div class="user-details">
            <div class="details-head">
              <div class="details-avatar">{{ formatName(userStore.user.email) }}</div>
              <div class="details-id">
                <div class="user-name">{{ userStore.user.name }}</div>
                <div class="detail-email" @click="copyEmail(userStore.user.email)">
                  <span>{{ userStore.user.email }}</span>
                  <Icon icon="lucide:copy" width="13" height="13"/>
                </div>
              </div>
            </div>
            <div class="details-role">
              <el-tag>{{ userStore.user.role.name }}</el-tag>
            </div>

            <div class="stat-list">
              <div class="stat-row">
                <span class="stat-label">{{ $t('sendCount') }}</span>
                <span class="stat-value">
                  <span v-if="sendCount">{{ sendCount }}</span>
                  <el-tag v-else type="info">{{ sendType }}</el-tag>
                </span>
              </div>
              <div class="stat-row">
                <span class="stat-label">{{ $t('accountCount') }}</span>
                <span class="stat-value">
                  <el-tag v-if="settingStore.settings.manyEmail || settingStore.settings.addEmail" type="info">{{ $t('disabled') }}</el-tag>
                  <span v-else-if="accountCount && hasPerm('account:add')">{{ $t('totalUserAccount', {msg: accountCount}) }}</span>
                  <el-tag v-else-if="!accountCount && hasPerm('account:add')" type="info">{{ $t('unlimited') }}</el-tag>
                  <el-tag v-else-if="!hasPerm('account:add')" type="info">{{ $t('unauthorized') }}</el-tag>
                </span>
              </div>
            </div>

            <el-button class="logout" :loading="logoutLoading" @click="clickLogout">
              <Icon icon="lucide:log-out" width="15" height="15"/>
              <span>{{ $t('logOut') }}</span>
            </el-button>
          </div>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup>
import router from "@/router";
import hanburger from '@/components/hamburger/index.vue'
import {logout} from "@/request/login.js";
import {Icon} from "@iconify/vue";
import {useUiStore} from "@/store/ui.js";
import {useUserStore} from "@/store/user.js";
import {useRoute} from "vue-router";
import {computed, ref} from "vue";
import {useSettingStore} from "@/store/setting.js";
import {hasPerm} from "@/perm/perm.js"
import {useI18n} from "vue-i18n";
import {setExtend} from "@/utils/day.js"

const {t} = useI18n();
const route = useRoute();
const settingStore = useSettingStore();
const userStore = useUserStore();
const uiStore = useUiStore();
const logoutLoading = ref(false)
const userInfoShow = ref(false)
const userinfoRef = ref({})

const adminPages = ['analysis', 'user', 'all-email', 'role', 'reg-key', 'sys-setting']
const sectionName = computed(() => adminPages.includes(route.meta.name) ? t('manage') : '')

const accountCount = computed(() => userStore.user.role.accountCount)

const sendType = computed(() => {
  if (settingStore.settings.send === 1) return t('disabled')
  if (!hasPerm('email:send')) return t('unauthorized')
  if (userStore.user.role.sendType === 'ban') return t('sendBanned')
  if (userStore.user.role.sendType === 'internal') return t('sendInternal')
  if (!userStore.user.role.sendCount) return t('unlimited')
  if (userStore.user.role.sendType === 'day') return t('daily')
  if (userStore.user.role.sendType === 'count') return t('total')
})

const sendCount = computed(() => {
  if (!hasPerm('email:send')) return null
  if (userStore.user.role.sendType === 'ban') return null
  if (userStore.user.role.sendType === 'internal') return null
  if (!userStore.user.role.sendCount) return null
  if (settingStore.settings.send === 1) return null
  return userStore.user.sendCount + '/' + userStore.user.role.sendCount
})

function userInfoHide() {
  if (userInfoShow.value) {
    userinfoRef.value.handleClose()
  } else {
    userinfoRef.value.handleOpen()
  }
}

async function copyEmail(email) {
  try {
    await navigator.clipboard.writeText(email);
    ElMessage({message: t('copySuccessMsg'), type: 'success', plain: true})
  } catch (err) {
    console.error(`${t('copyFailMsg')}:`, err);
    ElMessage({message: t('copyFailMsg'), type: 'error', plain: true})
  }
}

function changeLang(lang) {
  setExtend(lang === 'en' ? 'en' : 'zh-cn')
  settingStore.lang = lang
}

function openNotice() {
  uiStore.showNotice()
}

function openDark(e) {
  const nextIsDark = !uiStore.dark
  const root = document.documentElement

  if (!document.startViewTransition) {
    switchDark(nextIsDark, root);
    return
  }

  const x = e.clientX
  const y = e.clientY
  const maxX = Math.max(x, window.innerWidth - x)
  const maxY = Math.max(y, window.innerHeight - y)
  const endRadius = Math.hypot(maxX, maxY)

  root.setAttribute('data-theme-to', nextIsDark ? 'dark' : 'light')
  root.style.setProperty('--vt-x', `${x}px`)
  root.style.setProperty('--vt-y', `${y}px`)
  root.style.setProperty('--vt-end-radius', `${endRadius + 10}px`)

  const transition = document.startViewTransition(() => {
    switchDark(nextIsDark, root);
  })

  transition.finished.finally(() => {
    root.removeAttribute('data-theme-to')
  })
}

function switchDark(nextIsDark, root) {
  root.setAttribute('class', nextIsDark ? 'dark' : '')
  const metaTag = document.getElementById('theme-color-meta');
  const isMobile = !window.matchMedia("(pointer: fine) and (hover: hover)").matches;
  metaTag.setAttribute('content', nextIsDark ? '#0a0f14' : (isMobile ? '#ffffff' : '#f5f7fa'));
  uiStore.dark = nextIsDark
}

function openSend() {
  uiStore.writerRef.open()
}

function changeAside() {
  uiStore.asideShow = !uiStore.asideShow
}

function clickLogout() {
  logoutLoading.value = true
  logout().then(() => {
    localStorage.removeItem("token")
    router.replace('/login')
  }).finally(() => {
    logoutLoading.value = false
  })
}

function formatName(email) {
  return email?.[0]?.toUpperCase() || ''
}
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: var(--cm-header-h);
  padding: 0 16px 0 18px;
  background: var(--cm-surface);
  border-bottom: 1px solid var(--cm-line);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.heading { min-width: 0; }

.heading-title {
  font-size: 15px;
  font-weight: 640;
  letter-spacing: -.015em;
  color: var(--cm-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 20px;
}

.heading-sub {
  font-size: 11.5px;
  color: var(--cm-text-3);
  line-height: 14px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
}

.compose {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 14px;
  border-radius: 9px;
  background: var(--cm-brand);
  color: var(--cm-brand-ink);
  font-size: 13px;
  font-weight: 620;
  cursor: pointer;
  transition: background-color .16s ease;
  box-shadow: 0 6px 16px -10px rgba(70, 191, 208, 1);

  &:hover { background: var(--cm-brand-hover); }
  &:active { background: var(--cm-brand-press); }
  .iconify { color: currentColor; }
}

.divider {
  width: 1px;
  height: 18px;
  background: var(--cm-line);
  margin: 0 8px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--cm-text-2);
  cursor: pointer;
  transition: background-color .16s ease, color .16s ease;

  &:hover { background: var(--cm-surface-soft); color: var(--cm-text); }
}

.account-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 6px 0 4px;
  border-radius: 10px;
  cursor: pointer;
  margin-left: 6px;
  transition: background-color .16s ease;

  &:hover { background: var(--cm-surface-soft); }
}

.account-avatar {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  background: var(--cm-brand-soft);
  color: var(--cm-brand-strong);
  font-weight: 680;
  font-size: 13px;
  flex: 0 0 28px;
}

.account-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
  max-width: 132px;
}

.account-name {
  font-size: 12.5px;
  font-weight: 580;
  color: var(--cm-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.account-mail {
  font-size: 11px;
  color: var(--cm-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.account-caret { color: var(--cm-text-3); }

@media (min-width: 1025px) {
  .header-hamburger { display: none; }
}

@media (max-width: 960px) {
  .account-meta { display: none; }
  .compose-text { display: none; }
  .compose { padding: 0 10px; }
}

@media (max-width: 767px) {
  .header { padding: 0 8px 0 6px; gap: 6px; }
  .divider { margin: 0 2px; }
  .heading-title { font-size: 14px; }
}

/* dropdown card */
.user-details {
  width: 272px;
  padding: 6px;
  color: var(--cm-text);
}

.details-head {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 10px 12px;
}

.details-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: var(--cm-brand-soft);
  color: var(--cm-brand-strong);
  font-size: 17px;
  font-weight: 700;
  flex: 0 0 40px;
}

.details-id { min-width: 0; }

.user-name {
  font-size: 14px;
  font-weight: 620;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-email {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--cm-text-3);
  cursor: pointer;
  margin-top: 2px;
  max-width: 200px;

  span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  &:hover { color: var(--cm-brand-strong); }
}

.details-role { padding: 0 10px 10px; }

.stat-list {
  border-top: 1px solid var(--cm-line);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12.5px;
}

.stat-label { color: var(--cm-text-3); }
.stat-value { color: var(--cm-text); font-weight: 560; display: flex; align-items: center; gap: 6px; }

.logout {
  width: 100%;
  margin-top: 4px;
  height: 34px;
  border-radius: 9px;
  gap: 7px;
  color: var(--cm-danger);
  border-color: var(--cm-line);
  background: transparent;

  &:hover { background: rgba(212, 81, 75, .08); border-color: rgba(212, 81, 75, .35); color: var(--cm-danger); }
}
</style>
