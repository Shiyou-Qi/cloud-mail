<template>
  <div id="login-box" class="login-page" v-loading="oauthLoading" element-loading-text="登录中..."
       :class="{ 'has-background': !!settingStore.settings.background }">
    <div class="login-bg" v-if="settingStore.settings.background" :style="background"></div>
    <div class="login-glow" v-else></div>

    <main class="login-hero">
      <div class="hero-brand">
        <span class="hero-mark">
          <Icon icon="lucide:mail" width="18" height="18"/>
        </span>
        <span class="hero-name">{{ settingStore.settings.title }}</span>
      </div>

      <h1 class="hero-title">{{ $t('heroTitle') }}</h1>
      <p class="hero-desc">{{ $t('heroDesc') }}</p>

      <ul class="hero-points">
        <li><Icon icon="lucide:inbox" width="15" height="15"/><span>{{ $t('heroPoint1') }}</span></li>
        <li><Icon icon="lucide:paperclip" width="15" height="15"/><span>{{ $t('heroPoint2') }}</span></li>
        <li><Icon icon="lucide:users" width="15" height="15"/><span>{{ $t('heroPoint3') }}</span></li>
      </ul>
    </main>

    <section class="login-panel">
      <div class="container">
        <div class="form-head">
          <h2 class="form-title">{{ show === 'login' ? $t('loginTitle') : $t('regTitle') }}</h2>
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
        </div>
    </section>

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
      <Icon icon="lucide:github" color="#1890ff" width="20" height="20" />
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
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(380px, 0.85fr);
  background: #070d12;
  color: #e6eef4;
  isolation: isolate;
}

.login-bg {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  z-index: -2;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(5, 11, 16, .62);
  }
}

.login-glow {
  position: absolute;
  inset: 0;
  z-index: -2;
  background:
    radial-gradient(900px 600px at 12% -10%, rgba(70, 191, 208, .20), transparent 60%),
    radial-gradient(700px 520px at 78% 108%, rgba(48, 108, 148, .22), transparent 62%),
    linear-gradient(160deg, #081016 0%, #0a131a 55%, #070d12 100%);
}

.login-hero {
  align-self: center;
  padding: 0 clamp(28px, 6vw, 96px);
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.hero-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: clamp(28px, 6vh, 56px);
}

.hero-mark {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: #46bfd0;
  color: #052a31;
  box-shadow: 0 8px 24px -10px rgba(70, 191, 208, .9);
}

.hero-name {
  font-size: 15px;
  font-weight: 620;
  letter-spacing: -.01em;
  color: #e9f3f7;
}

.hero-title {
  margin: 0;
  max-width: 11em;
  text-wrap: balance;
  font-size: clamp(28px, 2.9vw, 40px);
  line-height: 1.18;
  font-weight: 680;
  letter-spacing: -.03em;
  color: #f2f8fb;
}

.hero-desc {
  margin: 16px 0 0;
  max-width: 26em;
  font-size: clamp(14px, 1.15vw, 16px);
  line-height: 1.8;
  color: rgba(206, 224, 233, .72);
  max-width: 30em;
}

.hero-points {
  margin: 34px 0 0;
  display: flex;
  flex-direction: column;
  gap: 13px;

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13.5px;
    color: rgba(198, 218, 228, .8);

    .iconify { color: #6cd3e1; }
  }
}

.login-panel {
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px clamp(20px, 4vw, 56px);
  background: rgba(9, 16, 22, .55);
  border-left: 1px solid rgba(255, 255, 255, .06);
  backdrop-filter: blur(18px);
}

.container {
  width: min(400px, 100%);
  display: flex;
  flex-direction: column;

  .btn {
    height: 44px;
    width: 100%;
    border-radius: 10px;
    font-weight: 600;
  }

  .form-head { margin-bottom: 26px; }

  .form-title {
    margin: 0;
    font-size: 22px;
    font-weight: 660;
    letter-spacing: -.02em;
    color: #f2f8fb;
  }

  .form-desc {
    margin: 7px 0 0;
    font-size: 13px;
    line-height: 1.6;
    color: rgba(190, 210, 220, .62);
  }

  .switch {
    margin-top: 20px;
    text-align: center;
    font-size: 13px;
    color: rgba(190, 210, 220, .6);

    span {
      color: #6cd3e1;
      cursor: pointer;
      margin-left: 3px;

      &:hover { text-decoration: underline; }
    }
  }

  .el-input {
    height: 44px;
    width: 100%;
    margin-bottom: 12px;
  }

  :deep(.el-input__wrapper) {
    min-height: 44px;
    padding: 0 13px;
    border-radius: 10px;
    background: rgba(255, 255, 255, .04);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, .1) inset;
  }

  :deep(.el-input__wrapper:hover) { box-shadow: 0 0 0 1px rgba(255, 255, 255, .2) inset; }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px #46bfd0 inset, 0 0 0 3px rgba(70, 191, 208, .16);
  }

  :deep(.el-input__inner) { color: #e9f3f7; }

  :deep(.el-input__inner::placeholder) { color: rgba(180, 202, 214, .45); }

  .email-input :deep(.el-input__wrapper) { border-radius: 10px 0 0 10px; }

  :deep(.el-input-group__append) {
    padding: 0 !important;
    padding-left: 10px !important;
    padding-right: 8px !important;
    background: rgba(255, 255, 255, .04);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, .1) inset;
    border-radius: 0 10px 10px 0;
    color: #cfe3ea;
  }

  :deep(.el-button--primary) {
    --el-button-text-color: #052a31;
    --el-button-hover-text-color: #052a31;
    --el-button-bg-color: #46bfd0;
    --el-button-border-color: #46bfd0;
    --el-button-hover-bg-color: #63ccdb;
    --el-button-hover-border-color: #63ccdb;
  }

  :deep(.el-button + .el-button) { margin: 10px 0 0; }

  :deep(.el-button:not(.el-button--primary)) {
    background: rgba(255, 255, 255, .04);
    border-color: rgba(255, 255, 255, .12);
    color: #d7e7ee;

    &:hover { background: rgba(255, 255, 255, .08); border-color: rgba(255, 255, 255, .2); }
  }
}

.setting-icon { color: rgba(200, 220, 230, .6); }

.domain-suffix {
  display: flex;
  align-items: center;
  gap: 2px;
  color: #cfe3ea;
  font-size: 13px;
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
  background: rgba(255, 255, 255, .06);
  bottom: 16px;
  right: 16px;
  z-index: 10;
  border: 1px solid rgba(255, 255, 255, .1);
  color: #9fc4d2;
  cursor: pointer;

  &:hover { background: rgba(255, 255, 255, .1); color: #e9f3f7; }
}

@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
    background: #070d12;
  }

  .login-hero { display: none; }

  .login-panel {
    align-self: center;
    background: transparent;
    border-left: 0;
    backdrop-filter: none;
    padding: 20px;
  }

  .container {
    width: min(420px, 100%);
    padding: 26px 22px;
    border-radius: 18px;
    background: rgba(13, 21, 28, .82);
    border: 1px solid rgba(255, 255, 255, .08);
    box-shadow: 0 30px 80px -30px rgba(0, 0, 0, .9);
    backdrop-filter: blur(16px);
  }
}
</style>
