<template>
  <div id="login-box" class="login-page" v-loading="oauthLoading" element-loading-text="登录中..."
       :class="{ 'has-background': !!settingStore.settings.background }">
    <div class="login-bg" v-if="settingStore.settings.background" :style="background"></div>
    <div class="login-grid" aria-hidden="true"></div>

    <main class="login-card">
      <div class="card-brand">
        <span class="brand-mark">
          <Icon icon="lucide:mail" width="17" height="17"/>
        </span>
        <span class="brand-name">{{ settingStore.settings.title }}</span>
      </div>

      <div class="form-head">
        <h1 class="form-title">{{ show === 'login' ? $t('loginTitle') : $t('regTitle') }}</h1>
        <p class="form-desc">{{ show === 'login' ? $t('loginSubtitle') : $t('regSubtitle') }}</p>
      </div>

        <div v-show="show === 'login'">
          <el-input :class="!hideLoginDomain ? 'email-input' : ''" v-model="form.email"
                    type="text" :placeholder="$t('emailAccount')" autocomplete="off" @keyup.enter="submit">
            <template #append v-if="!hideLoginDomain">
              <div @click.stop="openSelect">
                <el-select
                    v-if="show === 'login'"
                    ref="mySelect"
                    v-model="suffix"
                    :placeholder="$t('select')"
                    class="select"
                    popper-class="login-domain-options"
                >
                  <el-option
                      v-for="item in domainList"
                      :key="item"
                      :label="item"
                      :value="item"
                  />
                </el-select>
                <div class="domain-suffix">
                  <span>{{ suffix || domainList[0] }}</span>
                  <Icon class="setting-icon" icon="lucide:chevron-down" width="20" height="20"/>
                </div>
              </div>
            </template>
          </el-input>
          <el-input v-model="form.password" :placeholder="$t('password')" type="password" show-password
                    autocomplete="off" @keyup.enter="submit">
          </el-input>
          <el-button class="btn" type="primary" @click="submit" :loading="loginLoading"
          >{{ $t('loginBtn') }}
          </el-button>
          <el-button v-for="p in oauthProviders" :key="p.key" class="btn" style="margin-top: 10px" @click="oauthLogin(p.key)">
            <el-avatar v-if="p.iconType === 'image'" :src="p.icon" :size="18" style="margin-right: 10px" />
            <Icon v-else :icon="p.icon" width="18" height="18" style="margin-right: 10px" />
            {{ p.label }}
          </el-button>
        </div>
        <div v-show="show !== 'login'">
          <el-input :class="!hideLoginDomain ? 'email-input' : ''" v-model="registerForm.email" type="text" :placeholder="$t('emailAccount')"
                    autocomplete="off" @keyup.enter="submitRegister">
            <template #append v-if="!hideLoginDomain">
              <div @click.stop="openSelect">
                <el-select
                    v-if="show !== 'login'"
                    ref="mySelect"
                    v-model="suffix"
                    :placeholder="$t('select')"
                    class="select"
                    popper-class="login-domain-options"
                >
                  <el-option
                      v-for="item in domainList"
                      :key="item"
                      :label="item"
                      :value="item"
                  />
                </el-select>
                <div>
                  <span>{{ suffix || domainList[0] }}</span>
                  <Icon class="setting-icon" icon="lucide:chevron-down" width="20" height="20"/>
                </div>
              </div>
            </template>
          </el-input>
          <el-input v-model="registerForm.password" :placeholder="$t('password')" type="password" show-password
                    autocomplete="off" @keyup.enter="submitRegister"/>
          <el-input v-model="registerForm.confirmPassword" :placeholder="$t('confirmPwd')" type="password" show-password
                    autocomplete="off" @keyup.enter="submitRegister"/>
          <el-input v-if="settingStore.settings.regKey === 0" v-model="registerForm.code" :placeholder="$t('regKey')"
                    type="text" autocomplete="off" @keyup.enter="submitRegister"/>
          <el-input v-if="settingStore.settings.regKey === 2" v-model="registerForm.code"
                    :placeholder="$t('regKeyOptional')" type="text" autocomplete="off" @keyup.enter="submitRegister"/>
          <div v-show="verifyShow"
               class="register-turnstile"
               :data-sitekey="settingStore.settings.siteKey"
               data-callback="onTurnstileSuccess"
               data-error-callback="onTurnstileError"
               data-after-interactive-callback="loadAfter"
               data-before-interactive-callback="loadBefore"
          >
            <span style="font-size: 12px;color: #F56C6C" v-if="botJsError">{{ $t('verifyModuleFailed') }}</span>
          </div>
          <el-button class="btn" style="margin: 0" type="primary" @click="submitRegister" :loading="registerLoading"
          >{{ $t('regBtn') }}
          </el-button>
          <el-button v-for="p in oauthProviders" :key="p.key" class="btn" style="margin-top: 10px" @click="oauthLogin(p.key)">
            <el-avatar v-if="p.iconType === 'image'" :src="p.icon" :size="18" style="margin-right: 10px" />
            <Icon v-else :icon="p.icon" width="18" height="18" style="margin-right: 10px" />
            {{ p.label }}
          </el-button>
        </div>
        <template v-if="settingStore.settings.register === 0">
          <div class="switch" @click="show = 'register'" v-if="show === 'login'">{{ $t('noAccount') }}
            <span>{{ $t('regSwitch') }}</span></div>
          <div class="switch" @click="show = 'login'" v-else>{{ $t('hasAccount') }} <span>{{ $t('loginSwitch') }}</span>
          </div>
        </template>
    </main>

    <el-dialog class="bind-dialog" v-model="showBindForm"  title="注册邮箱" >
      <div class="bind-container">
        <el-input :class="!hideLoginDomain ? 'email-input' : ''" v-model="bindForm.email" type="text" :placeholder="$t('emailAccount')" autocomplete="off" @keyup.enter="bind">
          <template #append v-if="!hideLoginDomain">
            <div @click.stop="openSelect">
              <el-select
                  ref="mySelect"
                  v-model="suffix"
                  :placeholder="$t('select')"
                  class="select"
              >
                <el-option
                    v-for="item in domainList"
                    :key="item"
                    :label="item"
                    :value="item"
                />
              </el-select>
              <div>
                <span>{{ suffix || domainList[0] }}</span>
                <Icon class="setting-icon" icon="lucide:chevron-down" width="20" height="20"/>
              </div>
            </div>
          </template>
        </el-input>
        <el-input v-if="settingStore.settings.regKey === 0" v-model="bindForm.code" :placeholder="$t('regKey')"
                  type="text" autocomplete="off" @keyup.enter="bind"/>
        <el-input v-if="settingStore.settings.regKey === 2" v-model="bindForm.code"
                  :placeholder="$t('regKeyOptional')" type="text" autocomplete="off" @keyup.enter="bind"/>
        <el-button class="btn" type="primary" @click="bind" :loading="bindLoading"
        >绑定
        </el-button>
      </div>
    </el-dialog>
    <a v-show="settingStore.settings.projectLink" class="github" href="https://github.com/maillab/cloud-mail">
      <Icon icon="lucide:github" width="18" height="18"/>
    </a>
  </div>
</template>

<script setup>
import router from "@/router";
import {useRoute} from "vue-router";
import {computed, nextTick, reactive, ref, watch} from "vue";
import {login} from "@/request/login.js";
import {register} from "@/request/login.js";
import {websiteConfig} from "@/request/setting.js";
import {isEmail} from "@/utils/verify-utils.js";
import {useSettingStore} from "@/store/setting.js";
import {useAccountStore} from "@/store/account.js";
import {useUserStore} from "@/store/user.js";
import {useUiStore} from "@/store/ui.js";
import {Icon} from "@iconify/vue";
import {cvtR2Url} from "@/utils/convert.js";
import {loginUserInfo} from "@/request/my.js";
import {permsToRouter} from "@/perm/perm.js";
import {useI18n} from "vue-i18n";
import {oauthBindUser, oauthLinuxDoLogin, oauthGithubLogin, oauthGoogleLogin} from "@/request/ouath.js";

const {t} = useI18n();
const accountStore = useAccountStore();
const userStore = useUserStore();
const uiStore = useUiStore();
const settingStore = useSettingStore();
const route = useRoute();
const loginLoading = ref(false)
const bindLoading = ref(false)
const oauthLoading = ref(false);
const showBindForm = ref(false);
const show = ref('login')

const oauthKeys = ['linuxdo', 'github', 'google']

const oauthProvider = computed(() => {
  const fromState = route.query.state
  if (oauthKeys.includes(fromState)) return fromState
  const fromStore = sessionStorage.getItem('oauthProvider')
  return oauthKeys.includes(fromStore) ? fromStore : null
})

const oauthProviders = computed(() => {
  const allProviders = [
    { key: 'google', label: 'Google', icon: 'logos:google-icon', iconType: 'iconify' },
    { key: 'github', label: 'GitHub', icon: 'lucide:github', iconType: 'iconify' },
    { key: 'linuxdo', label: 'LinuxDo', icon: '/image/linuxdo.webp', iconType: 'image' },
  ]
  return allProviders.filter(p => settingStore.settings[p.key + 'Switch'] === 0)
})

const bindForm = reactive({
  email: '',
  oauthUserId: '',
  code: ''
})

const form = reactive({
  email: '',
  password: '',

});
const mySelect = ref()
const suffix = ref('')
const registerForm = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  code: null
})
const domainList = computed(() => settingStore.domainList)
const registerLoading = ref(false)
suffix.value = domainList.value[0] || ''

watch(domainList, (list) => {
  if (!suffix.value && list?.length) suffix.value = list[0]
}, {immediate: true})
const verifyShow = ref(false)
let verifyToken = ''
let turnstileId = null
let botJsError = ref(false)
let verifyErrorCount = 0

window.onTurnstileSuccess = (token) => {
  verifyToken = token;
};

window.onTurnstileError = (e) => {
  if (verifyErrorCount >= 4) {
    return
  }
  verifyErrorCount++
  console.warn('人机验加载失败', e)
  setTimeout(() => {
    nextTick(() => {
      if (!turnstileId) {
        turnstileId = window.turnstile.render('.register-turnstile')
      } else {
        window.turnstile.reset(turnstileId);
      }
    })
  }, 1500)
};

window.loadAfter = (e) => {
  console.log('loadAfter')
}

window.loadBefore = (e) => {
  console.log('loadBefore')
}

const loginOpacity = computed(() => {
  const opacity = settingStore.settings.loginOpacity
  return uiStore.dark ? `rgba(0, 0, 0, ${opacity})` : `rgba(255, 255, 255, ${opacity})`
})

const hideLoginDomain = computed(() => settingStore.settings.loginDomain === 1)

const background = computed(() => {

  return settingStore.settings.background ? {
    'background-image': `url(${cvtR2Url(settingStore.settings.background)})`,
    'background-repeat': 'no-repeat',
    'background-size': 'cover',
    'background-position': 'center'
  } : ''
})

const openSelect = () => {
  mySelect.value.toggleMenu()
}

const getFullEmail = (email) => {
  return hideLoginDomain.value ? email : email + suffix.value
}

const getEmailName = (email) => {
  return email.split('@')[0]
}

function oauthLogin(provider) {
  const clientId = settingStore.settings[provider + 'ClientId']
  const redirectUri = encodeURIComponent(window.location.origin + '/login')
  sessionStorage.setItem('oauthProvider', provider)
  const authorizeUrls = {
    linuxdo: `https://connect.linux.do/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid+profile+email&state=${provider}`,
    github: `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email&state=${provider}`,
    google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid+profile+email&state=${provider}`,
  }
  window.location.href = authorizeUrls[provider]
}

const loginFns = {
  linuxdo: oauthLinuxDoLogin,
  github: oauthGithubLogin,
  google: oauthGoogleLogin,
}

oauthGetUser();

async function oauthGetUser() {

  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  if (!code || !oauthProvider.value) return

  const provider = oauthProvider.value
  oauthLoading.value = true
  sessionStorage.removeItem('oauthProvider')
  window.history.replaceState({}, '', window.location.origin + window.location.pathname)

  loginFns[provider](code, window.location.origin + '/login').then(data => {

    bindForm.oauthUserId = data.userInfo.oauthUserId;

    if (!data.token) {
      showBindForm.value = true
      oauthLoading.value = false
      ElMessage({
        message: '请注册绑定一个邮箱',
        type: 'warning',
        duration: 4000,
        plain: true,
      })
      return;
    }

    saveToken(data.token);
  }).catch(() => {
    oauthLoading.value = false
  })
}

function bind() {

  if (bindLoading.value) return

  if (!bindForm.email) {
    ElMessage({
      message: t('emptyEmailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }


  if (getEmailName(bindForm.email).length < settingStore.settings.minEmailPrefix) {
    ElMessage({
      message: t('minEmailPrefix', {msg: settingStore.settings.minEmailPrefix}),
      type: 'error',
      plain: true,
    })
    return
  }

  let email = getFullEmail(bindForm.email);


  if (!isEmail(email)) {
    ElMessage({
      message: t('notEmailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (settingStore.settings.regKey === 0) {

    if (!bindForm.code) {

      ElMessage({
        message: t('emptyRegKeyMsg'),
        type: 'error',
        plain: true,
      })
      return
    }

  }

  const form = {email, oauthUserId: bindForm.oauthUserId, code: bindForm.code}

  bindLoading.value = true
  oauthBindUser(form).then(data => {
    saveToken(data.token)
  }).catch(() => {
    bindLoading.value = false
  })
}

const submit = () => {

  if (loginLoading.value) return

  if (!form.email) {
    ElMessage({
      message: t('emptyEmailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  let email = getFullEmail(form.email);

  if (!isEmail(email)) {
    ElMessage({
      message: t('notEmailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (!form.password) {
    ElMessage({
      message: t('emptyPwdMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  loginLoading.value = true
  login(email, form.password).then(async data => {
    await saveToken(data.token)
  }).finally(() => {
    loginLoading.value = false
  })
}

async function saveToken(token) {
  localStorage.setItem('token', token)
  refreshWebsiteConfig()
  const user = await loginUserInfo();
  accountStore.currentAccountId = user.account.accountId;
  accountStore.currentAccount = user.account;
  userStore.user = user;
  const routers = permsToRouter(user.permKeys);
  routers.forEach(routerData => {
    router.addRoute('layout', routerData);
  });
  await router.replace({name: 'layout'})
  uiStore.showNotice()
  oauthLoading.value = false;
  bindLoading.value = false;
}

function refreshWebsiteConfig() {
  websiteConfig().then(setting => {
    settingStore.settings = setting
    settingStore.domainList = setting.domainList
    if (!suffix.value && setting.domainList.length > 0) {
      suffix.value = setting.domainList[0]
    }
    document.title = setting.title
  }).catch(e => {
    console.error(e)
  })
}


function submitRegister() {

  if (registerLoading.value) return

  if (!registerForm.email) {
    ElMessage({
      message: t('emptyEmailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  console.log(registerForm.email)

  if (getEmailName(registerForm.email).length < settingStore.settings.minEmailPrefix) {
    ElMessage({
      message: t('minEmailPrefix', {msg: settingStore.settings.minEmailPrefix}),
      type: 'error',
      plain: true,
    })
    return
  }

  const email = getFullEmail(registerForm.email);

  if (!isEmail(email)) {
    ElMessage({
      message: t('notEmailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (!registerForm.password) {
    ElMessage({
      message: t('emptyPwdMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (registerForm.password.length < 6) {
    ElMessage({
      message: t('pwdLengthMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (registerForm.password !== registerForm.confirmPassword) {

    ElMessage({
      message: t('confirmPwdFailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (settingStore.settings.regKey === 0) {

    if (!registerForm.code) {

      ElMessage({
        message: t('emptyRegKeyMsg'),
        type: 'error',
        plain: true,
      })
      return
    }

  }

  if (!verifyToken && (settingStore.settings.registerVerify === 0 || (settingStore.settings.registerVerify === 2 && settingStore.settings.regVerifyOpen))) {
    if (!verifyShow.value) {
      verifyShow.value = true
      nextTick(() => {
        if (!turnstileId) {
          try {
            turnstileId = window.turnstile.render('.register-turnstile')
          } catch (e) {
            botJsError.value = true
            console.log('人机验证js加载失败')
          }
        } else {
          window.turnstile.reset('.register-turnstile')
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

  registerLoading.value = true

  const form = {
    email,
    password: registerForm.password,
    token: verifyToken,
    code: registerForm.code
  }

  register(form).then(({regVerifyOpen}) => {
    show.value = 'login'
    registerForm.email = ''
    registerForm.password = ''
    registerForm.confirmPassword = ''
    registerForm.code = ''
    registerLoading.value = false
    verifyToken = ''
    settingStore.settings.regVerifyOpen = regVerifyOpen
    verifyShow.value = false
    ElMessage({
      message: t('regSuccessMsg'),
      type: 'success',
      plain: true,
    })
  }).catch(res => {

    registerLoading.value = false

    if (res.code === 400) {
      verifyToken = ''
      settingStore.settings.regVerifyOpen = true
      if (turnstileId) {
        window.turnstile.reset(turnstileId)
      } else {
        nextTick(() => {
          turnstileId = window.turnstile.render('.register-turnstile')
        })
      }
      verifyShow.value = true

    }
  });
}

</script>


<style>
.el-select-dropdown__item {
  padding: 0 15px;
}

.no-autofill-pwd {
  .el-input__inner {
    -webkit-text-security: disc !important;
  }
}

.login-domain-options .el-select-dropdown__wrap {
  max-height: 188px !important;
  overflow-y: auto;
  scrollbar-width: thin;
}

.login-domain-options .el-select-dropdown__item {
  min-height: 36px;
}
</style>

<style lang="scss" scoped>
.login-page {
  --grid-line: rgba(22, 32, 42, .05);
  --grid-line-strong: rgba(22, 32, 42, .12);
  --grid-size: 34px;
  --grid-size-major: 170px;
  --glow: rgba(70, 191, 208, .16);

  position: relative;
  height: 100%;
  min-height: 100%;
  display: grid;
  place-items: center;
  padding: 40px 20px;
  overflow: hidden;
  isolation: isolate;
  background: var(--cm-canvas);
}

html.dark .login-page {
  --grid-line: rgba(255, 255, 255, .04);
  --grid-line-strong: rgba(255, 255, 255, .1);
  --glow: rgba(70, 191, 208, .14);
}

/* 网格底纹：中线清晰，四周淡出 */
.login-grid {
  position: absolute;
  inset: -1px;
  z-index: -2;
  background-image:
    linear-gradient(to right, var(--grid-line-strong) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-line-strong) 1px, transparent 1px),
    linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px);
  background-size:
    var(--grid-size-major) var(--grid-size-major),
    var(--grid-size-major) var(--grid-size-major),
    var(--grid-size) var(--grid-size),
    var(--grid-size) var(--grid-size);
  background-position: center center;
  mask-image: radial-gradient(ellipse 78% 68% at 50% 46%, #000 42%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 78% 68% at 50% 46%, #000 42%, transparent 100%);
}

/* 中心品牌光晕 */
.login-page::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: radial-gradient(760px 440px at 50% 36%, var(--glow), transparent 72%);
  pointer-events: none;
}

.login-bg {
  position: absolute;
  inset: 0;
  z-index: -2;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(8, 14, 20, .55);
  }
}

.login-page.has-background {
  .login-grid { display: none; }

  &::after { display: none; }
}

/* ---------- 卡片 ---------- */
.login-card {
  position: relative;
  z-index: 1;
  width: min(420px, 100%);
  padding: 30px 28px 26px;
  display: flex;
  flex-direction: column;
  background: var(--cm-surface);
  border: 1px solid var(--cm-line);
  border-radius: 18px;
  box-shadow: var(--cm-shadow-2);
}

.card-brand {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 22px;
}

.brand-mark {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: var(--cm-brand);
  color: var(--cm-brand-ink);
  box-shadow: 0 6px 16px -8px rgba(70, 191, 208, .95);
}

.brand-name {
  font-size: 14.5px;
  font-weight: 640;
  letter-spacing: -.01em;
  color: var(--cm-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.form-head { margin-bottom: 20px; }

.form-title {
  margin: 0;
  font-size: 23px;
  line-height: 1.3;
  font-weight: 660;
  letter-spacing: -.025em;
  color: var(--cm-text);
}

.form-desc {
  margin: 7px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--cm-text-3);
}

.btn {
  height: 44px;
  width: 100%;
  border-radius: 10px;
  font-weight: 600;
}

.el-input,
:deep(.el-input) {
  height: 44px;
  width: 100%;
  margin-bottom: 12px;
}

:deep(.el-input__wrapper) {
  min-height: 44px;
  padding: 0 13px;
  border-radius: 10px;
  background: var(--cm-surface);
  box-shadow: 0 0 0 1px var(--cm-line-strong) inset;
}

:deep(.el-input__wrapper:hover) { box-shadow: 0 0 0 1px var(--cm-text-3) inset; }

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset, 0 0 0 3px var(--cm-brand-soft);
}

:deep(.el-input__inner) { color: var(--cm-text); }

.email-input :deep(.el-input__wrapper) { border-radius: 10px 0 0 10px; }

:deep(.el-input-group__append) {
  padding: 0 !important;
  padding-left: 10px !important;
  padding-right: 8px !important;
  background: var(--cm-surface-soft);
  box-shadow: 0 0 0 1px var(--cm-line-strong) inset;
  border-radius: 0 10px 10px 0;
  color: var(--cm-text-2);
}

.domain-suffix {
  display: flex;
  align-items: center;
  gap: 2px;
  color: var(--cm-text-2);
  font-size: 13px;
}

.setting-icon { color: var(--cm-text-3); }

:deep(.el-button--primary) {
  --el-button-text-color: var(--cm-brand-ink);
  --el-button-hover-text-color: var(--cm-brand-ink);
  --el-button-bg-color: var(--cm-brand);
  --el-button-border-color: var(--cm-brand);
  --el-button-hover-bg-color: var(--cm-brand-hover);
  --el-button-hover-border-color: var(--cm-brand-hover);
  --el-button-active-bg-color: var(--cm-brand-press);
  --el-button-active-border-color: var(--cm-brand-press);
}

:deep(.el-button + .el-button) { margin: 10px 0 0; }

:deep(.el-button:not(.el-button--primary)) {
  background: var(--cm-surface);
  border-color: var(--cm-line-strong);
  color: var(--cm-text-2);

  &:hover {
    background: var(--cm-surface-soft);
    border-color: var(--cm-brand);
    color: var(--cm-text);
  }
}

.switch {
  margin-top: 18px;
  text-align: center;
  font-size: 13px;
  color: var(--cm-text-3);

  span {
    color: var(--cm-brand-strong);
    cursor: pointer;
    margin-left: 3px;

    &:hover { text-decoration: underline; }
  }
}

:deep(.el-loading-mask) {
  background-color: var(--cm-overlay);
  backdrop-filter: blur(2px);
}

.select {
  position: absolute;
  right: 26px;
  width: 120px;
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
}

.bind-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.register-turnstile { margin-bottom: 14px; }

:deep(.bind-dialog) {
  width: 400px !important;
  @media (max-width: 440px) {
    width: calc(100% - 40px) !important;
    margin-right: 20px !important;
    margin-left: 20px !important;
  }
}

.github {
  position: fixed;
  width: 34px;
  height: 34px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  background: var(--cm-surface);
  bottom: 18px;
  right: 18px;
  z-index: 10;
  border: 1px solid var(--cm-line);
  color: var(--cm-text-3);
  box-shadow: var(--cm-shadow-1);
  cursor: pointer;

  &:hover { color: var(--cm-text); border-color: var(--cm-line-strong); }
}

@media (max-width: 767px) {
  .login-page {
    padding: 24px 16px;
    align-items: center;
  }

  .login-card {
    padding: 24px 20px 22px;
    border-radius: 16px;
  }

  .form-title { font-size: 21px; }

  .github { bottom: 12px; right: 12px; }
}
</style>
