<template>
  <div class="account-panel">
    <div class="panel-head">
      <span class="panel-title">{{ $t('mailboxes') }}</span>
      <span class="panel-count" v-if="accounts.length">{{ accounts.length }}</span>
      <div class="panel-actions">
        <button v-perm="'account:add'" class="cm-icon-btn" type="button" :title="$t('addAccount')" @click="add">
          <Icon icon="lucide:plus" width="17" height="17"/>
        </button>
        <button class="cm-icon-btn" type="button" :title="$t('refresh')" @click="refresh">
          <Icon icon="lucide:refresh-cw" width="15" height="15"/>
        </button>
      </div>
    </div>

    <el-scrollbar class="panel-scroll" ref="scrollbarRef">
      <div class="panel-list" v-infinite-scroll="getAccountList" :infinite-scroll-distance="600"
           :infinite-scroll-immediate="false">

        <div class="account-item"
             :class="{ 'is-active': accountStore.currentAccountId === item.accountId }"
             v-for="(item, index) in accounts" :key="item.accountId"
             tabindex="0"
             @click="changeAccount(item)"
             @keydown.enter="changeAccount(item)">
          <span class="item-avatar">{{ avatarText(item) }}</span>
          <span class="item-main">
            <span class="item-name">{{ item.name || item.email.split('@')[0] }}</span>
            <span class="item-email">{{ item.email }}</span>
          </span>
          <span class="item-flag" v-if="item.allReceive === 1" :title="$t('receiveAll')">
            <Icon icon="lucide:inbox" width="12" height="12"/>
          </span>
          <span class="item-actions" @click.stop>
            <button class="mini-btn" type="button" :title="$t('copy')" @click="copyAccount(item.email)">
              <Icon icon="lucide:copy" width="14" height="14"/>
            </button>
            <el-dropdown trigger="click" @command="cmd => onCommand(cmd, item, index)">
              <button class="mini-btn" type="button" :title="$t('accountMenu')">
                <Icon icon="lucide:settings" width="14" height="14"/>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="hasPerm('email:send')" command="rename">
                    <Icon icon="lucide:pencil" width="15" height="15"/>{{ $t('rename') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="receive">
                    <Icon icon="lucide:inbox" width="15" height="15"/>{{ $t('receiveAll') }}
                    <Icon v-if="item.allReceive === 1" class="menu-check" icon="lucide:check" width="14" height="14"/>
                  </el-dropdown-item>
                  <el-dropdown-item v-if="item.accountId !== userStore.user.account?.accountId" command="pin">
                    <Icon icon="lucide:pin" width="15" height="15"/>{{ $t('pin') }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="item.accountId !== userStore.user.account?.accountId && hasPerm('account:delete')"
                                    command="delete" divided>
                    <Icon icon="lucide:trash-2" width="15" height="15"/>{{ $t('delete') }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </span>
        </div>

        <template v-if="loading">
          <div class="account-skeleton" v-for="i in (skeletonRows || 4)" :key="i">
            <el-skeleton animated>
              <template #template>
                <div class="skeleton-row">
                  <el-skeleton-item variant="rect" style="width: 28px; height: 28px; border-radius: 9px"/>
                  <div class="skeleton-lines">
                    <el-skeleton-item variant="text" style="width: 60%; height: 12px"/>
                    <el-skeleton-item variant="text" style="width: 85%; height: 10px"/>
                  </div>
                </div>
              </template>
            </el-skeleton>
          </div>
        </template>

        <div class="account-skeleton" v-if="accounts.length > 0 && !noLoading">
          <el-skeleton animated :rows="1"/>
        </div>

        <div class="panel-empty" v-if="noLoading && accounts.length === 0">
          <Icon icon="lucide:inbox" width="22" height="22"/>
          <span>{{ $t('noMessagesFound') }}</span>
        </div>
        <div class="panel-end" v-if="noLoading && accounts.length >= 10">{{ $t('noMoreData') }}</div>
      </div>
    </el-scrollbar>

    <el-dialog v-model="showAdd" :title="$t('addAccount')" width="380px">
      <div class="dialog-form">
        <el-input v-model="addForm.email" ref="addRef" type="text" :placeholder="$t('emailAccount')"
                  autocomplete="off" @keyup.enter="submit">
          <template #append>
            <div @click.stop="openSelect" class="suffix-picker">
              <el-select ref="mySelect" v-model="addForm.suffix" :placeholder="$t('select')" class="select">
                <el-option v-for="item in domainList" :key="item" :label="item" :value="item"/>
              </el-select>
              <span>{{ addForm.suffix }}</span>
              <Icon icon="lucide:chevron-down" width="16" height="16"/>
            </div>
          </template>
        </el-input>
        <div class="add-email-turnstile" :class="verifyShow ? 'turnstile-show' : 'turnstile-hide'"
             :data-sitekey="settingStore.settings.siteKey"
             data-callback="onTurnstileSuccess"
             data-error-callback="onTurnstileError">
          <span class="verify-error" v-if="botJsError">{{ $t('verifyModuleFailed') }}</span>
        </div>
        <el-button class="dialog-submit" type="primary" @click="submit" :loading="addLoading">{{ $t('add') }}</el-button>
      </div>
    </el-dialog>

    <el-dialog v-model="setNameShow" :title="$t('changeUserName')" width="380px">
      <div class="dialog-form">
        <el-input v-model="accountName" type="text" :placeholder="$t('username')" autocomplete="off"
                  @keyup.enter="setName"/>
        <el-button class="dialog-submit" type="primary" @click="setName" :loading="setNameLoading">{{ $t('save') }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import {Icon} from "@iconify/vue";
import {computed, nextTick, reactive, ref, watch} from "vue";
import {
  accountList,
  accountAdd,
  accountDelete,
  accountSetName,
  accountSetAllReceive,
  accountSetAsTop
} from "@/request/account.js";
import {sleep} from "@/utils/time-utils.js"
import {isEmail} from "@/utils/verify-utils.js";
import {useSettingStore} from "@/store/setting.js";
import {useAccountStore} from "@/store/account.js";
import {useEmailStore} from "@/store/email.js";
import {useUserStore} from "@/store/user.js";
import {hasPerm} from "@/perm/perm.js"
import {useI18n} from "vue-i18n";
import {AccountAllReceiveEnum} from "@/enums/account-enum.js";

const {t} = useI18n();
const userStore = useUserStore();
const accountStore = useAccountStore();
const settingStore = useSettingStore();
const emailStore = useEmailStore();
const showAdd = ref(false)
const addLoading = ref(false);
const domainList = computed(() => settingStore.domainList)
const accounts = reactive([])
const noLoading = ref(false)
const loading = ref(false)
const followLoading = ref(false);
const verifyShow = ref(false)
const setNameShow = ref(false)
const setNameLoading = ref(false)
const accountName = ref(null)
const addRef = ref({})
const scrollbarRef = ref({})
let account = null
let turnstileId = null
const botJsError = ref(false)
let verifyToken = ''
let verifyErrorCount = 0
let first = true
const addForm = reactive({
  email: '',
  suffix: settingStore.domainList[0]
})
let skeletonRows = 10
const queryParams = {
  size: 30
}

const mySelect = ref()

if (hasPerm('account:query')) {
  getAccountList()
}

watch(() => accountStore.changeUserAccountName, () => {
  accounts[0].name = accountStore.changeUserAccountName
})

watch(() => settingStore.domainList, (list) => {
  if (!addForm.suffix && list.length > 0) {
    addForm.suffix = list[0]
  }
}, {immediate: true})


const openSelect = () => {
  mySelect.value.toggleMenu()
}

window.onTurnstileError = (e) => {
  if (verifyErrorCount >= 4) {
    return
  }
  verifyErrorCount++
  console.warn('人机验加载失败', e)
  setTimeout(() => {
    nextTick(() => {
      if (!turnstileId) {
        turnstileId = window.turnstile.render('.add-email-turnstile')
      } else {
        window.turnstile.reset(turnstileId);
      }
    })
  }, 1500)
};

window.onTurnstileSuccess = (token) => {
  verifyToken = token;
};

function getSkeletonRows() {
  if (accounts.length > 20) return skeletonRows = 20
  if (accounts.length === 0) return skeletonRows = 1
  skeletonRows = accounts.length
}

function setName() {

  if (setNameLoading.value) return

  let name = accountName.value

  if (name === account.name) {
    setNameShow.value = false
    return
  }

  if (!name) {
    ElMessage({
      message: t('emptyUserNameMsg'),
      type: 'error',
      plain: true,
    })
    return;
  }

  setNameLoading.value = true
  accountSetName(account.accountId, name).then(() => {
    account.name = name
    setNameShow.value = false

    if (account.accountId === userStore.user.account.accountId) {
      userStore.user.name = name
    }

    ElMessage({
      message: t('saveSuccessMsg'),
      type: "success",
      plain: true
    })
  }).finally(() => {
    setNameLoading.value = false
  })
}

function openSetName(accountItem) {
  accountName.value = accountItem.name
  account = accountItem
  setNameShow.value = true
}

function setAllReceive(account) {
  let allReceiveAccount = accounts.find(account => account.allReceive === AccountAllReceiveEnum.ENABLED);
  if (allReceiveAccount && allReceiveAccount.accountId !== account.accountId) allReceiveAccount.allReceive = AccountAllReceiveEnum.DISABLED;
  account.allReceive = account.allReceive === AccountAllReceiveEnum.DISABLED ? AccountAllReceiveEnum.ENABLED : AccountAllReceiveEnum.DISABLED;
  accountSetAllReceive(account.accountId).catch(() => {
    account.allReceive = account.allReceive === AccountAllReceiveEnum.DISABLED ? AccountAllReceiveEnum.ENABLED : AccountAllReceiveEnum.DISABLED;
    if (allReceiveAccount) allReceiveAccount.allReceive = AccountAllReceiveEnum.ENABLED;
  }).then(() => {
    if (account.allReceive === AccountAllReceiveEnum.ENABLED) {
      ElMessage({
        message: t('setSuccess'),
        type: 'success',
        plain: true,
      })
    }
    changeAccount(account);
    emailStore.emailScroll?.refreshList();
    emailStore.sendScroll?.refreshList();
  })
}


function showNullSetting(item) {
  return !hasPerm('email:send') && !(item.accountId !== userStore.user.account.accountId && hasPerm('account:delete'))
}

function avatarText(item) {
  const src = item.name || item.email || '?'
  return src.trim()[0]?.toUpperCase() || '?'
}

function onCommand(cmd, item, index) {
  if (cmd === 'rename') openSetName(item)
  else if (cmd === 'receive') setAllReceive(item)
  else if (cmd === 'pin') setAsTop(item, index)
  else if (cmd === 'delete') remove(item)
}

function itemBg(accountId) {
  return accountStore.currentAccountId === accountId ? 'item-choose' : ''
}



function remove(account) {
  ElMessageBox.confirm(t('delConfirm', {msg: account.email}), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    accountDelete(account.accountId).then(() => {
      const index = accounts.findIndex(item => item.accountId === account.accountId);
      accounts.splice(index, 1);
      if (accounts.length < queryParams.size) {
        getAccountList()
      }
      ElMessage({
        message: t('delSuccessMsg'),
        type: 'success',
        plain: true,
      })
    })
  });
}

function refresh() {
  if (loading.value) {
    return
  }
  loading.value = false
  followLoading.value = false
  noLoading.value = false
  queryParams.accountId = 0
  queryParams.lastSort = null
  getSkeletonRows();
  scrollbarRef.value.setScrollTop(0)
  accounts.splice(0, accounts.length)
  getAccountList()
}

function changeAccount(account) {
  accountStore.currentAccountId = account.accountId
  accountStore.currentAccount = account
}

function add() {
  addForm.suffix = addForm.suffix || settingStore.domainList[0]
  showAdd.value = true
  setTimeout(() => {
    addRef.value.focus()
  }, 100)
}

function setAsTop(account, index) {
  accountSetAsTop(account.accountId).then(() => {
    ElMessage({
      message: t('setSuccess'),
      type: 'success',
      plain: true,
    })

    const [item] = accounts.splice(index, 1);
    accounts.splice(1, 0, item);

  });
}

async function copyAccount(account) {
  try {
    await navigator.clipboard.writeText(account);
    ElMessage({
      message: t('copySuccessMsg'),
      type: 'success',
      plain: true,
    })
  } catch (err) {
    console.error(`${t('copyFailMsg')}:`, err);
    ElMessage({
      message: t('copyFailMsg'),
      type: 'error',
      plain: true,
    })
  }
}

function getAccountList() {

  if (loading.value || followLoading.value || noLoading.value) return;

  if (accounts.length === 0) {
    loading.value = true
  } else {
    followLoading.value = true
  }

  let start = Date.now();

  const accountId = accounts.length > 0 ? accounts.at(-1).accountId : 0;
  const lastSort = accounts.length > 0 ? accounts.at(-1).sort : null;

  accountList(accountId, queryParams.size, lastSort).then(async list => {

    let end = Date.now();
    let duration = end - start;
    if (duration < 300) {
      await sleep(300 - duration)
    }

    if (list.length < queryParams.size) {
      noLoading.value = true
    }
    if (accounts.length === 0) {
      accountStore.currentAccount = list[0]
    }

    accounts.push(...list)

    loading.value = false
    followLoading.value = false
    first = false
  }).catch(() => {
    loading.value = false
    followLoading.value = false
  })
}


function submit() {

  if (addLoading.value) return

  if (!addForm.email) {
    ElMessage({
      message: t('emptyEmailMsg'),
      type: "error",
      plain: true
    })
    return
  }

  if (addForm.email.length < settingStore.settings.minEmailPrefix) {
    ElMessage({
      message: t('minEmailPrefix', {msg: settingStore.settings.minEmailPrefix}),
      type: 'error',
      plain: true,
    })
    return
  }

  if (!isEmail(addForm.email + addForm.suffix)) {
    ElMessage({
      message: t('notEmailMsg'),
      type: "error",
      plain: true
    })
    return
  }

  if (!verifyToken && (settingStore.settings.addEmailVerify === 0 || (settingStore.settings.addEmailVerify === 2 && settingStore.settings.addVerifyOpen))) {
    if (!verifyShow.value) {
      verifyShow.value = true
      nextTick(() => {
        if (!turnstileId) {
          try {
            turnstileId = window.turnstile.render('.add-email-turnstile')
          } catch (e) {
            botJsError.value = true
            console.log('人机验证js加载失败')
          }
        } else {
          window.turnstile.reset('.add-email-turnstile')
        }
      })
    } else if (!botJsError.value) {
      ElMessage({
        message: t('botVerifyMsg'),
        type: "error",
        plain: true
      })
    }
    return;
  }

  addLoading.value = true
  accountAdd(addForm.email + addForm.suffix, verifyToken).then(account => {
    addLoading.value = false
    addForm.email = ''
    accounts.push(account)
    verifyToken = ''
    settingStore.settings.addVerifyOpen = account.addVerifyOpen
    ElMessage({
      message: t('addSuccessMsg'),
      type: "success",
      plain: true
    })
    verifyShow.value = false
    showAdd.value = false
    userStore.refreshUserInfo()
  }).catch(res => {
    if (res.code === 400) {
      verifyToken = ''
      if (turnstileId) {
        window.turnstile.reset(turnstileId)
      } else {
        nextTick(() => {
          turnstileId = window.turnstile.render('.add-email-turnstile')
        })
      }
      verifyShow.value = true
    }
    addLoading.value = false
  })
}
</script>
<style scoped lang="scss">
.account-panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--cm-surface);
  border-right: 1px solid var(--cm-line);
  overflow: hidden;
}

.panel-head {
  height: 48px;
  flex: 0 0 48px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 8px 0 16px;
  border-bottom: 1px solid var(--cm-line);
}

.panel-title {
  font-size: 12px;
  font-weight: 620;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--cm-text-3);
}

.panel-count {
  font-size: 11px;
  font-weight: 620;
  color: var(--cm-text-3);
  background: var(--cm-surface-sunken);
  border-radius: 999px;
  padding: 1px 7px;
  line-height: 16px;
}

.panel-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 2px;

  .cm-icon-btn { width: 28px; height: 28px; }
}

.panel-scroll { flex: 1; min-height: 0; }

.panel-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.account-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px;
  border-radius: 9px;
  cursor: pointer;
  position: relative;
  transition: background-color .14s ease;
  outline: none;

  &:hover { background: var(--cm-surface-soft); }
  &:hover .item-email { color: var(--cm-text-2); }

  &.is-active {
    background: var(--cm-brand-soft);
    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 9px;
      bottom: 9px;
      width: 2px;
      border-radius: 0 2px 2px 0;
      background: var(--cm-brand);
    }
    .item-name { color: var(--cm-brand-strong); }
  }
}

.item-avatar {
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  background: var(--cm-surface-sunken);
  color: var(--cm-text-2);
  font-size: 12px;
  font-weight: 640;

  .is-active & { background: var(--cm-surface); color: var(--cm-brand-strong); }
}

.item-main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}

.item-name {
  font-size: 13px;
  font-weight: 540;
  color: var(--cm-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-email {
  font-size: 11.5px;
  color: var(--cm-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-flag {
  flex: 0 0 auto;
  color: var(--cm-brand-strong);
  display: flex;
  align-items: center;
}

.item-actions {
  display: none;
  align-items: center;
  gap: 1px;
  margin-left: 2px;
}
.account-item:hover .item-actions,
.account-item:focus-within .item-actions { display: flex; }
.account-item:hover .item-flag { display: none; }

.mini-btn {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  color: var(--cm-text-3);
  cursor: pointer;
  background: transparent;

  &:hover { background: var(--cm-surface); color: var(--cm-text); }
}

:deep(.menu-check) { margin-left: auto; color: var(--cm-brand-strong); }

.account-skeleton {
  padding: 9px 8px;
  .skeleton-row { display: flex; align-items: center; gap: 9px; }
  .skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 5px; }
}

.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 36px 12px;
  color: var(--cm-text-3);
  font-size: 12.5px;
}

.panel-end {
  text-align: center;
  font-size: 11.5px;
  color: var(--cm-text-3);
  padding: 10px 0 14px;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dialog-submit { width: 100%; height: 38px; }

.suffix-picker {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: var(--cm-text-2);
  cursor: pointer;
}

.select {
  position: absolute;
  right: 20px;
  width: 120px;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
}

.verify-error { font-size: 12px; color: var(--cm-danger); }

.turnstile-show { margin-top: 2px; }
.turnstile-hide { display: none; }

@media (max-width: 767px) {
  .account-panel { border-right: none; }
}
</style>
