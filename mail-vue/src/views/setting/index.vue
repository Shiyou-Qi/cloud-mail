<template>
  <div class="cm-page-scroll">
    <div class="settings">

      <section class="cm-surface section">
        <header class="section-head">
          <div>
            <h2 class="section-title">{{ $t('profile') }}</h2>
            <p class="section-desc">{{ $t('emailAccount') }} · {{ userStore.user.email }}</p>
          </div>
        </header>
        <div class="rows">
          <div class="row">
            <div class="row-label">{{ $t('username') }}</div>
            <div class="row-value">
              <span v-if="setNameShow" class="edit-name-input">
                <el-input v-model="accountName" @keyup.enter="setName"/>
                <el-button type="primary" @click="setName">{{ $t('save') }}</el-button>
              </span>
              <span v-else class="user-name">
                <span>{{ userStore.user.name }}</span>
                <el-button text type="primary" @click="showSetName">{{ $t('change') }}</el-button>
              </span>
            </div>
          </div>
          <div class="row">
            <div class="row-label">{{ $t('emailAccount') }}</div>
            <div class="row-value mono">{{ userStore.user.email }}</div>
          </div>
          <div class="row">
            <div class="row-label">{{ $t('password') }}</div>
            <div class="row-value">
              <el-button @click="pwdShow = true">{{ $t('changePwdBtn') }}</el-button>
            </div>
          </div>
        </div>
      </section>

      <section class="cm-surface section">
        <header class="section-head">
          <div>
            <h2 class="section-title">{{ $t('language') }}</h2>
          </div>
        </header>
        <div class="rows">
          <div class="row">
            <div class="row-label">{{ $t('uiLanguage') }}</div>
            <div class="row-value">
              <el-select :model-value="langSelect" class="language-select" @change="changeLang">
                <el-option label="中文" value="zh" @pointerdown.prevent.stop="changeLang('zh')"/>
                <el-option label="English" value="en" @pointerdown.prevent.stop="changeLang('en')"/>
              </el-select>
            </div>
          </div>
        </div>
      </section>

      <section class="cm-surface section is-danger" v-perm="'my:delete'">
        <header class="section-head">
          <div>
            <h2 class="section-title">{{ $t('deleteUser') }}</h2>
            <p class="section-desc">{{ $t('delAccountMsg') }}</p>
          </div>
        </header>
        <div class="rows">
          <div class="row">
            <div class="row-label">{{ $t('delAccount') }}</div>
            <div class="row-value">
              <el-button type="danger" plain @click="deleteConfirm">{{ $t('deleteUserBtn') }}</el-button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <el-dialog v-model="pwdShow" :title="$t('changePassword')" width="360">
      <div class="update-pwd">
        <el-input type="password" show-password :placeholder="$t('newPassword')" v-model="form.password" autocomplete="off"
                  @keyup.enter="submitPwd"/>
        <el-input type="password" show-password :placeholder="$t('confirmPassword')" v-model="form.newPwd" autocomplete="off"
                  @keyup.enter="submitPwd"/>
        <el-button type="primary" :loading="setPwdLoading" @click="submitPwd">{{ $t('save') }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import {reactive, ref, defineOptions} from 'vue'
import {resetPassword, userDelete} from "@/request/my.js";
import {useUserStore} from "@/store/user.js";
import router from "@/router/index.js";
import {accountSetName} from "@/request/account.js";
import {useAccountStore} from "@/store/account.js";
import {useI18n} from "vue-i18n";
import {useSettingStore} from "@/store/setting.js";

const { t } = useI18n()
const accountStore = useAccountStore()
const settingStore = useSettingStore()
const userStore = useUserStore();
const setPwdLoading = ref(false)
const setNameShow = ref(false)
const accountName = ref(null)
const langSelect = ref(settingStore.lang)

defineOptions({
  name: 'setting'
})

function showSetName() {
  accountName.value = userStore.user.name
  setNameShow.value = true
}

function setName() {

  if (!accountName.value) {
    ElMessage({
      message: t('emptyUserNameMsg'),
      type: 'error',
      plain: true,
    })
    return;
  }

  setNameShow.value = false
  let name = accountName.value

  if (name === userStore.user.name) {
    return
  }

  userStore.user.name = accountName.value

  accountSetName(userStore.user.account.accountId,name).then(() => {
    ElMessage({
      message: t('saveSuccessMsg'),
      type: 'success',
      plain: true,
    })

    accountStore.changeUserAccountName = name

  }).catch(() => {
    userStore.user.name = name
  })
}

function changeLang(lang) {
  let setting = {}
  try {
    setting = JSON.parse(localStorage.getItem('setting') || '{}')
  } catch (e) {
    setting = {}
  }
  localStorage.setItem('setting', JSON.stringify({...setting, lang}))
  window.location.reload()
}

const pwdShow = ref(false)
const form = reactive({
  password: '',
  newPwd: '',
})

const deleteConfirm = () => {
  ElMessageBox.confirm(t('delAccountConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    userDelete().then(() => {
      localStorage.removeItem('token');
      router.replace('/login');
      ElMessage({
        message: t('delSuccessMsg'),
        type: 'success',
        plain: true,
      })
    })
  })
}


function submitPwd() {

  if (setPwdLoading.value) return

  if (!form.password) {
    ElMessage({
      message: t('emptyPwdMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (form.password.length < 6) {
    ElMessage({
      message: t('pwdLengthMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (form.password !== form.newPwd) {
    ElMessage({
      message: t('confirmPwdFailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  setPwdLoading.value = true
  resetPassword(form.password).then(() => {
    ElMessage({
      message: t('saveSuccessMsg'),
      type: 'success',
      plain: true,
    })
    pwdShow.value = false
    setPwdLoading.value = false
    form.password = ''
    form.newPwd = ''
  }).catch(() => {
    setPwdLoading.value = false
  })

}

</script>
<style scoped lang="scss">
.settings {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section {
  overflow: hidden;
}

.section-head {
  padding: 16px 20px 14px;
  border-bottom: 1px solid var(--cm-line);
}

.section-title {
  font-size: 14.5px;
  font-weight: 620;
  color: var(--cm-text);
  margin: 0;
}

.section-desc {
  margin: 3px 0 0;
  font-size: 12.5px;
  color: var(--cm-text-3);
  line-height: 1.5;
}

.rows { display: flex; flex-direction: column; }

.row {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  min-height: 54px;

  & + .row { border-top: 1px solid var(--cm-line); }
}

.row-label {
  font-size: 13px;
  color: var(--cm-text-3);
}

.row-value {
  font-size: 13.5px;
  color: var(--cm-text);
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;

  &.mono { font-variant-numeric: tabular-nums; }
}

.user-name { display: flex; align-items: center; gap: 10px; }

.edit-name-input {
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(360px, 100%);
}

.language-select { width: 160px; }

.update-pwd {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .el-button { width: 100%; height: 38px; }
}

.section.is-danger .section-title { color: var(--cm-danger); }

@media (max-width: 640px) {
  .row {
    grid-template-columns: 1fr;
    gap: 6px;
    padding: 12px 16px;
  }
  .section-head { padding: 14px 16px; }
}
</style>
