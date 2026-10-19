<template>
  <div class="box">
    <div class="cm-toolbar mail-actions">
      <button class="cm-icon-btn" type="button" @click="handleBack" :title="$t('back')">
        <Icon icon="lucide:arrow-left" width="17" height="17"/>
      </button>
      <span class="cm-toolbar__sep"></span>
      <button class="cm-icon-btn" type="button" @click="changeStar"
              v-if="emailStore.contentData.showStar"
              :class="{ 'is-starred': email.isStar }"
              :title="$t('star')">
        <Icon icon="lucide:star" width="16" height="16"/>
      </button>

      <div class="cm-toolbar__spacer"></div>

      <button class="cm-icon-btn" type="button" v-if="emailStore.contentData.showReply" v-perm="'email:send'"
              @click="openReply" :title="$t('reply')">
        <Icon icon="lucide:reply" width="16" height="16"/>
      </button>
      <button class="cm-icon-btn" type="button" v-if="emailStore.contentData.showReply" v-perm="'email:send'"
              @click="openForward" :title="$t('forward')">
        <Icon icon="lucide:forward" width="16" height="16"/>
      </button>
      <button class="cm-icon-btn is-danger" type="button" v-perm="'email:delete'"
              @click="handleDelete" :title="$t('delete')">
        <Icon icon="lucide:trash-2" width="16" height="16"/>
      </button>
    </div>

    <el-scrollbar class="reader-scroll">
      <article class="reader">
        <header class="reader-head">
          <h1 class="subject">{{ subjectText }}</h1>

          <div class="meta-row">
            <div class="sender-avatar">{{ senderInitial }}</div>

            <div class="meta-main">
              <div class="sender-line">
                <span class="sender-name">{{ email.name || email.sendEmail }}</span>
                <button class="addr-btn" type="button" :title="$t('copy')" @click="copyAddress">
                  <span class="addr">&lt;{{ email.sendEmail }}&gt;</span>
                  <Icon icon="lucide:copy" width="12" height="12"/>
                </button>
              </div>

              <div class="recipient-line">
                <span class="meta-label">{{ $t('recipient') }}</span>
                <span class="meta-value">{{ recipientSummary }}</span>
                <button v-if="recipientMore > 0" class="more-btn" type="button" @click="recipientsExpanded = !recipientsExpanded">
                  {{ recipientsExpanded ? $t('collapse') : $t('recipientsMore', {total: recipientMore}) }}
                </button>
              </div>
            </div>

            <time class="meta-date">{{ formatDetailDate(email.createTime) }}</time>
          </div>

          <el-alert v-if="email.status === 3" :closable="false" :title="toMessage(email.message)" class="email-msg" type="error" show-icon />
          <el-alert v-if="email.status === 4" :closable="false" :title="$t('complained')" class="email-msg" type="warning" show-icon />
          <el-alert v-if="email.status === 5" :closable="false" :title="$t('delayed')" class="email-msg" type="warning" show-icon />
        </header>

        <div class="reader-body">
          <div class="sheet" v-if="email.content">
            <ShadowHtml :html="formatImage(email.content)"/>
          </div>
          <pre v-else-if="email.text" class="plain-body">{{ email.text }}</pre>
          <div v-else class="empty-body">
            <Icon icon="lucide:file-text" width="22" height="22"/>
            <span>{{ $t('emptyBody') }}</span>
          </div>
        </div>

        <section class="attach" v-if="email.attList?.length">
          <div class="attach-head">
            <span class="attach-title">{{ $t('attachments') }}</span>
            <span class="attach-meta">{{ $t('fileCount', {total: email.attList.length}) }} · {{ attachmentSize }}</span>
          </div>

          <div class="attach-grid">
            <div class="attach-card" v-for="att in email.attList" :key="att.attId">
              <span class="attach-icon" @click="showImage(att.key)">
                <Icon v-bind="getIconByName(att.filename)"/>
              </span>
              <span class="attach-info" @click="showImage(att.key)">
                <span class="attach-name" :title="att.filename">{{ att.filename }}</span>
                <span class="attach-size">{{ formatBytes(att.size) }}</span>
              </span>
              <span class="attach-actions">
                <button v-if="isImage(att.filename)" class="cm-icon-btn" type="button"
                        :title="$t('preview')" @click.stop="showImage(att.key)">
                  <Icon icon="lucide:eye" width="15" height="15"/>
                </button>
                <a class="cm-icon-btn" :href="cvtR2Url(att.key)" download :title="$t('download')" @click.stop>
                  <Icon icon="lucide:download" width="15" height="15"/>
                </a>
              </span>
            </div>
          </div>
        </section>

        <footer class="reader-foot" v-if="emailStore.contentData.showReply">
          <el-button v-perm="'email:send'" type="primary" is-brand @click="openReply">
            <Icon icon="lucide:reply" width="15" height="15"/>
            <span>{{ $t('reply') }}</span>
          </el-button>
          <el-button v-perm="'email:send'" @click="openForward">
            <Icon icon="lucide:forward" width="15" height="15"/>
            <span>{{ $t('forward') }}</span>
          </el-button>
          <span class="foot-spacer"></span>
          <el-button v-perm="'email:delete'" text type="danger" @click="handleDelete">
            <Icon icon="lucide:trash-2" width="14" height="14"/>
            <span>{{ $t('delete') }}</span>
          </el-button>
        </footer>
      </article>
    </el-scrollbar>

    <el-image-viewer
        v-if="showPreview"
        :url-list="srcList"
        show-progress
        @close="showPreview = false"
    />
  </div>
</template>

<script setup>
import ShadowHtml from '@/components/shadow-html/index.vue'
import {computed, reactive, ref, watch, onMounted, onUnmounted} from "vue";
import {useRouter} from 'vue-router'
import {ElMessage, ElMessageBox} from 'element-plus'
import {emailDelete, emailRead} from "@/request/email.js";
import {Icon} from "@iconify/vue";
import {useEmailStore} from "@/store/email.js";
import {useAccountStore} from "@/store/account.js";
import {formatDetailDate} from "@/utils/day.js";
import {starAdd, starCancel} from "@/request/star.js";
import {getExtName, formatBytes} from "@/utils/file-utils.js";
import {cvtR2Url,toOssDomain} from "@/utils/convert.js";
import {getIconByName} from "@/utils/icon-utils.js";
import {useSettingStore} from "@/store/setting.js";
import {allEmailDelete} from "@/request/all-email.js";
import {useUiStore} from "@/store/ui.js";
import {useI18n} from "vue-i18n";
import {EmailUnreadEnum} from "@/enums/email-enum.js";

const uiStore = useUiStore();
const settingStore = useSettingStore();
const accountStore = useAccountStore();
const emailStore = useEmailStore();
const router = useRouter()
const email = computed(() => emailStore.contentData.email || {
  emailId: 0,
  attList: [],
  content: '',
  text: '',
  recipient: '[]',
})
const showPreview = ref(false)
const recipientsExpanded = ref(false)

const subjectText = computed(() => email.value.subject || t('noSubject'))

const senderInitial = computed(() => {
  const src = email.value.name || email.value.sendEmail || '?'
  return src.trim().charAt(0).toUpperCase() || '?'
})

const recipients = computed(() => {
  const raw = email.value.recipient
  if (!raw) return []
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
})

const recipientList = computed(() =>
    recipients.value.map(item => item?.address || item).filter(Boolean))

const recipientMore = computed(() => Math.max(0, recipientList.value.length - 2))

const recipientSummary = computed(() => {
  const list = recipientList.value
  if (!list.length) return '—'
  if (recipientsExpanded.value || list.length <= 2) return list.join(', ')
  return list.slice(0, 2).join(', ')
})

const attachmentSize = computed(() => {
  const list = email.value.attList || []
  return formatBytes(list.reduce((sum, att) => sum + (att.size || 0), 0))
})

watch(() => email.value.emailId, () => {
  recipientsExpanded.value = false
})

async function copyAddress() {
  const address = email.value.sendEmail
  if (!address) return
  try {
    await navigator.clipboard.writeText(address)
    ElMessage({message: t('copySuccessMsg'), type: 'success', plain: true})
  } catch {
    ElMessage({message: t('copyFailMsg'), type: 'error', plain: true})
  }
}
const srcList = reactive([])

const { t } = useI18n()
watch(() => accountStore.currentAccountId, () => {
  handleBack()
})

let readRequesting = false

function tryMarkRead() {
  if (!emailStore.contentData.showUnread || readRequesting) return
  const current = email.value
  if (!current?.emailId || current.unread !== EmailUnreadEnum.UNREAD) return

  // 等详情数据就绪（detailMap 已写入，或正文已有内容）再标已读
  const full = emailStore.detailMap[current.emailId]
  const detailReady = !!full || !!(current.content || current.text)
  if (!detailReady) return

  readRequesting = true
  const emailId = current.emailId
  current.unread = EmailUnreadEnum.READ
  if (emailStore.detailMap[emailId]) {
    emailStore.detailMap[emailId].unread = EmailUnreadEnum.READ
  }
  emailStore.markListRead(emailId)
  emailRead([emailId]).finally(() => {
    readRequesting = false
  })
}

watch(
  () => [
    email.value?.emailId,
    email.value?.content,
    email.value?.text,
    emailStore.detailMap[email.value?.emailId]
  ],
  () => tryMarkRead(),
  { flush: 'post' }
)

onMounted(() => {
  tryMarkRead()
  window.addEventListener('keydown', handleKeyDown);
})

onUnmounted(() => {
  emailStore.contentData.showUnread = false;
  readRequesting = false
  window.removeEventListener('keydown', handleKeyDown);
})

function handleKeyDown(event) {
  if (event.key !== 'Escape') return;
  if (showPreview.value) return;
  if (document.querySelector('.el-message-box')) return;
  const writeBox = document.querySelector('.write-box');
  if (writeBox && writeBox.offsetParent !== null) return;
  handleBack();
}

function openReply() {
  uiStore.writerRef.openReply(email.value)
}

function openForward() {
  uiStore.writerRef.openForward(email.value)
}

function toMessage(message) {
  return  message ? JSON.parse(message).message : '';
}

function formatImage(content) {
  content = content || '';
  const domain = settingStore.settings.r2Domain;
  return  content.replace(/{{domain}}/g, toOssDomain(domain) + '/');
}

function showImage(key) {
  if (!isImage(key)) return;
  const url = cvtR2Url(key)
  srcList.length = 0
  srcList.push(url)
  showPreview.value = true
}

function isImage(filename) {
  return ['png', 'jpg', 'jpeg', 'bmp', 'gif','jfif'].includes(getExtName(filename))
}

function changeStar() {
  if (email.value.isStar) {
    email.value.isStar = 0;
    starCancel(email.value.emailId).then(() => {
      email.value.isStar = 0;
      emailStore.cancelStarEmailId = email.value.emailId
      setTimeout(() => emailStore.cancelStarEmailId = 0)
      emailStore.starScroll?.deleteEmail([email.value.emailId])
    }).catch((e) => {
      console.error(e)
      email.value.isStar = 1;
    })
  } else {
    email.value.isStar = 1;
    starAdd(email.value.emailId).then(() => {
      email.value.isStar = 1;
      emailStore.addStarEmailId = email.value.emailId
      setTimeout(() => emailStore.addStarEmailId = 0)
      emailStore.starScroll?.addItem(email.value)
    }).catch((e) => {
      console.error(e)
      email.value.isStar = 0;
    })
  }
}

const handleBack = () => {
  router.back()
}

const handleDelete = () => {
  ElMessageBox.confirm(t('delEmailConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    if (emailStore.contentData.delType === 'logic') {
      emailDelete(email.value.emailId).then(() => {
        ElMessage({
          message: t('delSuccessMsg'),
          type: 'success',
          plain: true,
        })
        emailStore.deleteIds = [email.value.emailId]
      })
    } else  {

      allEmailDelete(email.value.emailId).then(() => {
        ElMessage({
          message: t('delSuccessMsg'),
          type: 'success',
          plain: true,
        })
        emailStore.deleteIds = [email.value.emailId]
      })
    }

    router.back()
  })
}
</script>
<style scoped lang="scss">
.box {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--cm-gap);
  padding: var(--cm-page-pad-y) var(--cm-page-pad-x);
  background: var(--cm-canvas);
  overflow: hidden;
}

.mail-actions { flex: 0 0 auto; }

:deep(.cm-icon-btn.is-starred) {
  color: var(--cm-warning);

  .iconify path { fill: currentColor; }

  &:hover { background: rgba(201, 138, 27, .1); }
}

.reader-scroll {
  flex: 1 1 auto;
  min-height: 0;

  :deep(.el-scrollbar__view) { padding-bottom: 8px; }
}

/* ---------- reading sheet ---------- */
.reader {
  width: min(920px, 100%);
  margin: 0 auto;
  background: var(--cm-surface);
  border: 1px solid var(--cm-line);
  border-radius: var(--cm-radius);
  box-shadow: var(--cm-shadow-1);
  overflow: hidden;
}

.reader-head {
  padding: 24px 30px 18px;
  border-bottom: 1px solid var(--cm-line);
}

.subject {
  margin: 0 0 18px;
  font-size: 22px;
  line-height: 1.42;
  font-weight: 640;
  letter-spacing: -.015em;
  color: var(--cm-text);
  overflow-wrap: anywhere;
}

.meta-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.sender-avatar {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: var(--cm-brand-soft);
  color: var(--cm-brand-strong);
  font-size: 15px;
  font-weight: 680;
}

.meta-main {
  flex: 1 1 auto;
  min-width: 0;
}

.sender-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.sender-name {
  font-size: 14px;
  font-weight: 620;
  color: var(--cm-text);
}

.addr-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  color: var(--cm-text-3);
  cursor: pointer;
  border-radius: 6px;
  padding: 1px 4px;
  margin-left: -4px;
  transition: color .14s ease, background-color .14s ease;

  &:hover { color: var(--cm-brand-strong); background: var(--cm-brand-soft); }

  .iconify { opacity: .35; transition: opacity .14s ease; }
  &:hover .iconify { opacity: 1; }
}

.addr {
  max-width: min(420px, 52vw);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.recipient-line {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 5px;
  font-size: 12.5px;
  color: var(--cm-text-3);
  line-height: 1.5;
}

.meta-label { flex: 0 0 auto; }

.meta-value {
  color: var(--cm-text-2);
  overflow-wrap: anywhere;
}

.more-btn {
  font-size: 12px;
  color: var(--cm-brand-strong);
  cursor: pointer;
  white-space: nowrap;

  &:hover { text-decoration: underline; }
}

.meta-date {
  flex: 0 0 auto;
  padding-top: 2px;
  font-size: 12.5px;
  color: var(--cm-text-3);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.email-msg {
  margin-top: 14px;
  max-width: 460px;
  width: fit-content;
}

/* ---------- body ---------- */
.reader-body {
  padding: 22px 30px 24px;
}

.sheet {
  background: #ffffff;
  border-radius: 10px;
  padding: 18px 20px;
  border: 1px solid var(--cm-line);
}

html.dark .sheet {
  border-color: transparent;
  box-shadow: var(--cm-shadow-1);
}

.plain-body {
  margin: 0;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.75;
  color: var(--cm-text-2);
  white-space: pre-wrap;
  word-break: break-word;
}

.empty-body {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 28px 0;
  color: var(--cm-text-3);
  font-size: 13px;
}

/* ---------- attachments ---------- */
.attach {
  padding: 0 30px 22px;
}

.attach-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--cm-line);
  margin-bottom: 12px;
}

.attach-title {
  font-size: 13px;
  font-weight: 620;
  color: var(--cm-text);
}

.attach-meta {
  font-size: 12px;
  color: var(--cm-text-3);
  font-variant-numeric: tabular-nums;
}

.attach-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 8px;
}

.attach-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border: 1px solid var(--cm-line);
  border-radius: 10px;
  background: var(--cm-surface-soft);
  transition: border-color .15s ease, background-color .15s ease;
  min-width: 0;

  &:hover {
    border-color: var(--cm-brand);
    background: var(--cm-surface);
  }
}

.attach-icon {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: var(--cm-surface);
  border: 1px solid var(--cm-line);
  cursor: pointer;
}

.attach-info {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.35;
  cursor: pointer;
}

.attach-name {
  font-size: 13px;
  color: var(--cm-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attach-size {
  font-size: 11.5px;
  color: var(--cm-text-3);
  font-variant-numeric: tabular-nums;
}

.attach-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: .55;
  transition: opacity .15s ease;

  .cm-icon-btn { width: 28px; height: 28px; }
  a.cm-icon-btn { color: var(--cm-text-2); text-decoration: none; }
}

.attach-card:hover .attach-actions { opacity: 1; }

/* ---------- footer ---------- */
.reader-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 30px;
  border-top: 1px solid var(--cm-line);
  background: var(--cm-surface-soft);

  .el-button {
    height: 34px;
    gap: 6px;
    border-radius: 9px;
  }

  .foot-spacer { flex: 1 1 auto; }
}

@media (max-width: 767px) {
  .box { padding: 10px; gap: 8px; }

  .reader { border-radius: var(--cm-radius); }

  .reader-head { padding: 18px 16px 14px; }
  .subject { font-size: 19px; margin-bottom: 14px; }

  .meta-row { flex-wrap: wrap; row-gap: 0; }
  .sender-avatar { width: 34px; height: 34px; flex: 0 0 34px; font-size: 13px; }
  .meta-main { flex: 1 1 0; }
  .sender-line { gap: 6px; }
  .addr { max-width: 60vw; }
  .meta-date {
    order: 3;
    flex: 1 1 100%;
    padding-left: 46px;
    padding-top: 8px;
    white-space: normal;
  }

  .reader-body { padding: 16px; }
  .sheet { padding: 14px; }

  .attach { padding: 0 16px 16px; }
  .attach-grid { grid-template-columns: 1fr; }

  .reader-foot {
    padding: 10px 16px;
    flex-wrap: wrap;
  }
}
</style>
