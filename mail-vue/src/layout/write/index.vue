<template>
  <div class="send" v-show="show">
    <div class="write-box">
      <div class="title">
        <div class="title-left">
          <span class="compose-mark">
            <Icon icon="lucide:pen-line" width="15" height="15"/>
          </span>
          <div class="compose-meta">
            <span class="compose-label">{{ $t('compose') }}</span>
            <span class="compose-from">{{ form.name }} <em>&lt;{{ form.sendEmail }}&gt;</em></span>
          </div>
        </div>
        <button class="close-btn" type="button" :title="$t('close')" @click="close">
          <Icon icon="lucide:x" width="17" height="17"/>
        </button>
      </div>
      <div class="container">
        <el-input-tag  @add-tag="addTagChange" tag-type="primary" @input="inputChange" size="default" v-model="form.receiveEmail" >
          <template #prefix>
            <div class="item-title" >{{ $t('recipient') }}</div>
            <el-select
                ref="mySelect"
                class="write-select"
                popper-class="write-select"
                :show-arrow="false"
                :no-match-text="' '"
                :no-data-text="' '"
                @visible-change="selectStatusChange"
                @change="selectChange"
            >
              <el-option
                  v-for="item in selectRecipientList"
                  :key="item"
                  :label="item"
                  :value="item"
                  class="write-hint"
              />
            </el-select>
          </template>
          <template #suffix>
            <div style="display: flex;margin-right: 3px;">
              <Icon icon="lucide:user-plus" width="20" height="20" class="add-contact" @click.stop="openContacts" />
            </div>
          </template>
        </el-input-tag>
        <el-input v-model="form.subject" :placeholder="t('subject')" />
        <tinyEditor :def-value="defValue" ref="editor" @change="change" @focus="focusChange" />
        <div class="button-item">
          <div class="att-add" @click="chooseFile" :title="$t('attachments')">
            <Icon icon="lucide:paperclip" width="18" height="18"/>
          </div>
          <div class="att-clear" @click="clearContent" :title="$t('clearFormat')">
            <Icon icon="lucide:eraser" width="18" height="18"/>
          </div>
          <div class="att-list">
            <div class="att-item" v-for="(item,index) in form.attachments" :key="index">
              <Icon v-bind="getIconByName(item.filename)"/>
              <span class="att-filename">{{ item.filename }}</span>
              <span class="att-size">{{ formatBytes(item.size) }}</span>
              <Icon style="cursor: pointer;" icon="lucide:x" @click="delAtt(index)"
                    width="22" height="22"/>
            </div>
          </div>
          <div class="send-actions">
            <el-button type="primary" is-brand @click="sendEmail" v-if="form.sendType === 'reply'">{{ $t('reply') }}</el-button>
            <el-button type="primary" is-brand @click="sendEmail" v-else-if="form.sendType === 'forward'">{{ $t('forward') }}</el-button>
            <el-button type="primary" is-brand @click="sendEmail" v-else>{{ $t('send') }}</el-button>
          </div>
        </div>
      </div>
    </div>
    <el-dialog top="10vh" v-model="showContacts" @closed="clearSelectContact" :title="t('recentContacts')">
      <el-table ref="contactsTabRef" row-key="email" :data="contacts" style="height: 445px">
        <el-table-column type="selection" width="32" />
        <el-table-column property="email" :label="t('emailAccount')" >
          <template #default="props">
            <div class="email-row">{{ props.row.email }}</div>
          </template>
        </el-table-column>
        <el-table-column width="55" label="" >
          <template #default>
            <div style="display: flex;">
              <Icon icon="lucide:user" width="20" height="20" style="color: var(--cm-text-3)"/>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="contacts-bottom">
        <el-button type="default" @click="deleteContact">{{t('clear')}}</el-button>
        <el-button type="primary" @click="chooseContact">{{t('selectContacts')}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script setup>
import tinyEditor from '@/components/tiny-editor/index.vue'
import {h, nextTick, onMounted, onUnmounted, reactive, ref, toRaw, computed} from "vue";
import {Icon} from "@iconify/vue";
import {useUserStore} from "@/store/user.js";
import {emailSend} from "@/request/email.js";
import {isEmail} from "@/utils/verify-utils.js";
import {useAccountStore} from "@/store/account.js";
import {useEmailStore} from "@/store/email.js";
import {fileToBase64, formatBytes} from "@/utils/file-utils.js";
import {getIconByName} from "@/utils/icon-utils.js";
import sendPercent from "@/components/send-percent/index.vue"
import {toOssDomain} from "@/utils/convert.js";
import {formatDetailDate} from "@/utils/day.js";
import {useSettingStore} from "@/store/setting.js";
import {userDraftStore} from "@/store/draft.js";
import {useWriterStore} from "@/store/writer.js";
import db from "@/db/db.js";
import dayjs from "dayjs";
import {useI18n} from "vue-i18n";
import router from "@/router/index.js";
import {ElMessageBox} from "element-plus";

defineExpose({
  open,
  openReply,
  openForward,
  openDraft
})

const {t} = useI18n()
const writerStore = useWriterStore();
const draftStore = userDraftStore()
const settingStore = useSettingStore()
const emailStore = useEmailStore();
const accountStore = useAccountStore()
const editor = ref({})
const userStore = useUserStore();
const show = ref(false);
const percent = ref(0)
let percentMessage = null
let sending = false
const defValue = ref('')
const contactsTabRef = ref({})
const showContacts = ref(false)
const mySelect = ref()
let selectStatus = false
const backReply = reactive({
  receiveEmail: [],
  subject: '',
  content: '',
  sendType: ''
})
const form = reactive({
  sendEmail: '',
  receiveEmail: [],
  accountId: -1,
  name: '',
  subject: '',
  content: '',
  sendType: '',
  text: '',
  emailId: 0,
  attachments: [],
  draftId: null,
})

const selectRecipientList = ref([])

const contacts = computed(() => writerStore.sendRecipientRecord.map(item => ({email: item})))

function openContacts() {
  showContacts.value = true
  nextTick(() => {
    form.receiveEmail.forEach(item => {
      if (writerStore.sendRecipientRecord.includes(item)) {
        contactsTabRef.value.toggleRowSelection({email: item});
      }
    })
  })
}

function deleteContact() {
  ElMessageBox.confirm(t('confirmDeletionOfContacts'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    const contactList = contactsTabRef.value.getSelectionRows().map(item => item.email);
    form.receiveEmail = form.receiveEmail.filter(item => !contactList.includes(item));
    writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.filter(item => !contactList.includes(item));
  })
}

function chooseContact() {

  const contactList = contactsTabRef.value.getSelectionRows().map(item => item.email);
  contactList.forEach(item => {
    if (!form.receiveEmail.includes(item)) {
      form.receiveEmail.push(item);
    }
  })

  form.receiveEmail = form.receiveEmail.filter(item => {
    return contactList.includes(item) || !writerStore.sendRecipientRecord.includes(item);
  });

  showContacts.value = false
}

function clearSelectContact() {
  contactsTabRef.value.clearSelection();
}

function selectChange(value) {
  form.receiveEmail.push(value)
}

function selectStatusChange(status) {
  selectStatus = status
}

const openSelect = () => {
  mySelect.value.toggleMenu()
}

function inputChange(value) {

  selectRecipientList.value = writerStore.sendRecipientRecord.filter(item => value && !form.receiveEmail.includes(item) && item.startsWith(value)).slice(0, 10);

  if (!selectStatus && selectRecipientList.value.length > 0) {
    openSelect()
  }

  if (selectStatus && selectRecipientList.value.length === 0) {
    openSelect()
  }

}

function addTagChange(val) {

  const emails = Array.from(new Set(
      val.split(/[,，]/).map(item => item.trim()).filter(item => item)
  ));

  form.receiveEmail.splice(form.receiveEmail.length - 1, 1)

  let has = false
  emails.forEach(email => {
    if (isEmail(email) && !form.receiveEmail.includes(email)) {
      form.receiveEmail.push(email)
      has = true
    }
  })
  if (selectStatus && has) openSelect()
}

function clearContent() {
  ElMessageBox.confirm(t('clearContentConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    resetForm()
  })

}

function delAtt(index) {
  form.attachments.splice(index, 1);
}

function chooseFile() {
  const doc = document.createElement("input")
  doc.setAttribute("type", "file")
  doc.multiple = true;
  doc.click()
  doc.onchange = async (e) => {

    const fileList = e.target.files;

    for (const file of fileList) {

      const size = file.size
      const filename = file.name
      const contentType = file.type

      const content = await fileToBase64(file)
      form.attachments.push({content, filename, size, contentType})

    }

  }
}

async function sendEmail() {

  if (form.receiveEmail.length === 0) {
    ElMessage({
      message: t('emptyRecipientMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (!form.subject) {
    ElMessage({
      message: t('emptySubjectMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (!form.content) {
    form.content = editor.value.getContent();
  }

  if (!form.content) {
    ElMessage({
      message: t('emptyContentMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (form.manyType === 'divide' && form.attachments.length > 0) {
    ElMessage({
      message: t('noSeparateSendMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (sending) {
    ElMessage({
      message: t('sendingErrorMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  percentMessage = ElMessage({
    message: () => h(sendPercent, {value: percent.value, desc: t('sending')}),
    dangerouslyUseHTMLString: true,
    plain: true,
    duration: 0,
    customClass: 'message-bottom'
  })

  sending = true

  show.value = false

  emailSend(form, (e) => {
    percent.value = Math.round((e.loaded * 98) / e.total)
  }).then(emailList => {
    const email = emailList[0]
    emailList.forEach(item => {
      emailStore.sendScroll?.addItem(item)
    })

    ElNotification({
      title: t('sendSuccessMsg'),
      type: "success",
      message: h('span', {style: 'color: teal'}, email.subject),
      position: 'bottom-right'
    })

    userStore.refreshUserInfo();

    addRecipientRecord();

    if (form.draftId) {
      form.subject = ''
      form.content = ''
      form.receiveEmail = []
      draftStore.setDraft = {...toRaw(form)}
    }

    show.value = false
    resetForm();
  }).catch((e) => {
    ElNotification({
      title: t('sendFailMsg'),
      type: e.code === 403 ? 'warning' : 'error',
      message: h('span', {style: 'color: teal'}, e.message),
      position: 'bottom-right'
    })
    if (e.code === 401) {
      localStorage.removeItem('token');
      router.replace('/login');
    }
    show.value = true
    addRecipientRecord();
  }).finally(() => {
    percentMessage.close()
    percent.value = 0
    sending = false
  })
}

function addRecipientRecord() {
  writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.filter(
      email => !form.receiveEmail.includes(email)
  );

  writerStore.sendRecipientRecord.unshift(...form.receiveEmail);
  writerStore.sendRecipientRecord = writerStore.sendRecipientRecord.slice(0, 500);
}

function resetForm() {
  form.receiveEmail = []
  form.subject = ''
  form.content = ''
  form.manyType = null
  form.attachments = []
  form.sendType = ''
  form.emailId = 0
  form.draftId = null
  backReply.content = ''
  backReply.subject = ''
  backReply.receiveEmail = []
  backReply.sendType = ''
  editor.value.clearEditor()
}

function change(content, text) {
  form.content = content;
  form.text = text
}

function focusChange() {
  if (selectStatus) openSelect()
}

function openForward(email) {
  resetForm();

  email.subject = email.subject || ''

  form.subject = email.subject
  form.sendType = 'forward'

  defValue.value = ''

  setTimeout(() => {
    defValue.value = `
      ${formatImage(email.content) || `<pre style="font-family: inherit;word-break: break-word;white-space: pre-wrap;margin: 0">${email.text}</pre>`}
    `
    open()

    nextTick(() => {
      backReply.content = editor.value.getContent()
      backReply.subject = form.subject
      backReply.receiveEmail = form.receiveEmail
      backReply.sendType = form.sendType
    })

  });
}

function openReply(email) {

  resetForm();

  email.subject = email.subject || ''

  form.receiveEmail.push(email.sendEmail)
  form.subject = (
      email.subject.startsWith('Re:') ||
      email.subject.startsWith('Re：') ||
      email.subject.startsWith('回复：') ||
      email.subject.startsWith('回复:')) ? email.subject : 'Re: ' + email.subject
  form.sendType = 'reply'
  form.emailId = email.emailId

  defValue.value = ''

  setTimeout(() => {
    defValue.value = `
    <div></div>
    <div>
    <br>
        ${formatDetailDate(email.createTime)} ${email.name} &lt${email.sendEmail}&gt ${t('wrote')}:
    </div>
    <blockquote class="mceNonEditable" style="margin: 0 0 0 0.8ex;border-left: 1px solid rgb(204,204,204);padding-left: 1ex;">
      <articl>
          ${formatImage(email.content) || `<pre style="font-family: inherit;word-break: break-word;white-space: pre-wrap;margin: 0">${email.text}</pre>`}
      </article>
    </blockquote>`
    open()

    nextTick(() => {
      backReply.content = editor.value.getContent()
      backReply.subject = form.subject
      backReply.receiveEmail = form.receiveEmail
      backReply.sendType = form.sendType
    })
  })

}

function formatImage(content) {
  content = content || '';
  const domain = settingStore.settings.r2Domain;
  return content.replace(/{{domain}}/g, toOssDomain(domain) + '/');
}

function open() {
  if (!accountStore.currentAccount.email) {
    form.sendEmail = userStore.user.email;
    form.accountId = userStore.user.account.accountId;
    form.name = userStore.user.name;
  } else {
    form.sendEmail = accountStore.currentAccount.email;
    form.accountId = accountStore.currentAccount.accountId;
    form.name = accountStore.currentAccount.name;
  }
  show.value = true;
  editor.value.focus()
}

function openDraft(draft) {
  Object.assign(form, {...draft})
  defValue.value = ''
  setTimeout(() => defValue.value = form.content)
  show.value = true;
  editor.value.focus()
}

const handleKeyDown = (event) => {
  if (event.key === 'Escape') {
    close()
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

function close() {

  if (selectStatus) openSelect();

  if (!form.content) {
    form.content = editor.value.getContent();
  }

  if (form.draftId) {
    draftStore.setDraft = {...toRaw(form)}
    show.value = false
    resetForm()
    return;
  }

  if (!(form.content || form.subject || form.receiveEmail.length > 0)) {
    show.value = false
    resetForm()
    return;
  }

  if (backReply.sendType === 'reply' || backReply.sendType === 'forward') {
    let subjectFlag = form.subject === backReply.subject
    let contentFlag = editor.value.getContent() === backReply.content
    let receiveFlag = form.receiveEmail.length === 1 && form.receiveEmail[0] === backReply.receiveEmail[0]
    if (backReply.sendType === 'forward' && form.receiveEmail.length === 0) {
      receiveFlag = true;
    }
    if (subjectFlag && contentFlag && receiveFlag) {
      resetForm();
      close()
      return;
    }
  }

  ElMessageBox.confirm(t('saveDraftConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning',
    distinguishCancelAndClose: true
  }).then(async () => {
    const formData = {...toRaw(form)};
    delete formData.draftId
    delete formData.attachments
    formData.createTime = dayjs().utc().format('YYYY-MM-DD HH:mm:ss');
    const draftId = await db.value.draft.add({...formData})
    db.value.att.add({draftId, attachments: toRaw(form.attachments)})
    draftStore.refreshList++
    show.value = false
    await nextTick(() => {
      resetForm()
    })
  }).catch((action) => {
    if (action === 'cancel') {
      show.value = false
      resetForm()
    }
  })

}

</script>
<style>
.write-select .el-select-dropdown__list {
  padding: 4px 4px !important;
}
.write-select .el-select-dropdown__item {
  padding: 0 10px 0 10px;
}

.write-select .el-select-dropdown {
  min-width: 0 !important;
}
</style>
<style scoped lang="scss">
.send {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--cm-overlay);
  backdrop-filter: blur(2px);

  .write-box {
    background: var(--cm-surface);
    width: min(1040px, 100%);
    height: min(780px, calc(100vh - 48px));
    display: grid;
    grid-template-rows: auto 1fr;
    overflow: hidden;
    border-radius: var(--cm-radius-lg);
    border: 1px solid var(--cm-line);
    box-shadow: var(--cm-shadow-2);

    @media (max-width: 1024px) {
      width: 100%;
      height: 100%;
      border-radius: 0;
      border: 0;
    }

    .title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px 14px 18px;
      border-bottom: 1px solid var(--cm-line);
    }

    .title-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }

    .compose-mark {
      width: 28px;
      height: 28px;
      border-radius: 9px;
      display: grid;
      place-items: center;
      background: var(--cm-brand-soft);
      color: var(--cm-brand-strong);
      flex: 0 0 28px;
    }

    .compose-meta {
      display: flex;
      flex-direction: column;
      line-height: 1.3;
      min-width: 0;
    }

    .compose-label {
      font-size: 13.5px;
      font-weight: 620;
      color: var(--cm-text);
    }

    .compose-from {
      font-size: 11.5px;
      color: var(--cm-text-3);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      em { font-style: normal; opacity: .8; }
    }

    .close-btn {
      width: 30px;
      height: 30px;
      display: grid;
      place-items: center;
      border-radius: 8px;
      color: var(--cm-text-3);
      cursor: pointer;
      flex: 0 0 30px;

      &:hover { background: var(--cm-surface-soft); color: var(--cm-text); }
    }

    .container {
      height: 100%;
      min-height: 0;
      display: grid;
      grid-template-rows: auto auto 1fr auto;
      gap: 10px;
      padding: 14px 16px 16px;
      overflow: hidden;

      .item-title {
        font-size: 12.5px;
        color: var(--cm-text-3);
        padding-right: 8px;
        border-right: 1px solid var(--cm-line);
        margin-right: 8px;
      }

      .button-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--cm-line);

        .att-add,
        .att-clear {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          color: var(--cm-text-3);
          cursor: pointer;

          &:hover { background: var(--cm-surface-soft); color: var(--cm-text); }
        }

        .att-list {
          flex: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          max-height: 76px;
          overflow-y: auto;
          min-width: 0;

          .att-item {
            display: flex;
            align-items: center;
            gap: 6px;
            height: 30px;
            font-size: 12.5px;
            padding: 0 8px;
            background: var(--cm-surface-soft);
            border: 1px solid var(--cm-line);
            border-radius: 8px;
            max-width: 240px;

            .att-filename {
              white-space: nowrap;
              text-overflow: ellipsis;
              overflow: hidden;
              min-width: 0;
            }

            .att-size { color: var(--cm-text-3); font-size: 11.5px; }
          }
        }

        .send-actions { margin-left: auto; }

        .el-button {
          height: 34px;
          padding: 0 18px;
          border-radius: 9px;
        }
      }
    }

    :deep(.el-input__wrapper) { min-height: 34px; }

    :deep(.tox-tinymce) {
      border-radius: 10px !important;
      border: 1px solid var(--cm-line) !important;
      overflow: hidden;
    }

    :deep(.tox .tox-editor-header) { box-shadow: none !important; }
    :deep(.tox .tox-toolbar-overlord),
    :deep(.tox .tox-toolbar__primary) { background: var(--cm-surface-soft) !important; }
  }
}

.write-hint { color: var(--cm-text-3); font-size: 12.5px; }

.email-row {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.el-dialog) {
  width: 420px !important;
  @media (max-width: 460px) {
    width: calc(100% - 40px) !important;
    margin-right: 20px !important;
    margin-left: 20px !important;
  }
}

.contacts-bottom {
  display: flex;
  justify-content: end;
  margin-top: 10px;
}

.add-contact { color: var(--cm-text-3); cursor: pointer; &:hover { color: var(--cm-text); } }

.write-select {
  position: absolute;
  width: 300px;
  left: 60px;
  z-index: 0;
  opacity: 0;
  pointer-events: none;
}

:deep(.el-input-tag__suffix) { padding-right: 4px; }

.icon { cursor: pointer; }
</style>
