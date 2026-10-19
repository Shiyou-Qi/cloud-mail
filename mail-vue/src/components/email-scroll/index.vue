<template>
  <div class="email-container">
    <div class="cm-toolbar mail-toolbar">
      <el-checkbox
          v-model="checkAll"
          :indeterminate="isIndeterminate"
          :disabled="!emailList.length || loading"
          @change="handleCheckAllChange"
      />
      <span class="cm-toolbar__sep"></span>

      <div class="cm-toolbar__group">
        <slot name="first"></slot>
        <button class="cm-icon-btn" type="button" :title="$t('refresh')" @click="refresh">
          <Icon icon="lucide:refresh-cw" width="16" height="16"/>
        </button>
        <button class="cm-icon-btn" type="button" :title="$t('markAsRead')"
                v-if="selectedCount && showUnread" @click="handleRead">
          <Icon icon="lucide:mail-open" width="16" height="16"/>
        </button>
        <button class="cm-icon-btn is-danger" type="button" :title="$t('delete')"
                v-perm="'email:delete'" v-if="selectedCount" @click="handleDelete">
          <Icon icon="lucide:trash-2" width="16" height="16"/>
        </button>
      </div>

      <div class="cm-toolbar__filters">
        <slot name="filters"></slot>
      </div>

      <div class="cm-toolbar__spacer"></div>

      <span class="mail-count" v-if="total">{{ $t('emailCount', {total: total}) }}</span>
      <button v-if="showAccountIcon" class="cm-icon-btn" type="button"
              :title="$t('mailboxes')" @click="changeAccountShow">
        <Icon icon="lucide:layout-grid" width="16" height="16"/>
      </button>
    </div>

    <div ref="scroll" class="scroll">
      <UseVirtualList ref="scrollbarRef"
                        @scroll="onScroll"
                        :list="list"
                        :options="{ itemHeight: itemHeight, overscan: 15 }"
                        class="virtual"
                        style="height: 100%"
                        v-if="!loading && emailList.length > 0"
                        :key="keyCount"
        >
          <template #default="{ data: item, index }" >
            <div :class="['email-row', props.type, { 'right-checked': item.rightChecked, 'is-unread': item.unread === EmailUnreadEnum.UNREAD && showUnread }]"
                 :data-checked="item.checked"
                 @click="jumpDetails(item)"
                 v-if="!item.expand"
                 :key="item.emailId"
                 @contextmenu="handleContextmenu($event, item)"
            >
              <el-checkbox :class=" props.type === 'all-email' ? 'all-email-checkbox' : 'checkbox'"
                           v-model="item.checked"
                           :disabled="!item.checked && isSelectMax"
                           @click.stop></el-checkbox>
              <button type="button" class="row-star" :class="{ 'is-star': item.isStar }"
                      v-if="showStar" @click.stop="starChange(item)"
                      :title="t('star')">
                <Icon icon="lucide:star" width="16" height="16"/>
              </button>
              <div class="title" :class="accountShow ? 'title-column' : 'title-column'">

                <div class="email-sender">
                  <div class="email-status" v-if="showStatus">
                    <el-tooltip effect="dark" :content="item.statusIcon.content">
                      <Icon :icon="item.statusIcon.icon" :style="`color: ${item.statusIcon.color}`" width="15" height="15"/>
                    </el-tooltip>
                    <div class="del-status" v-if="item.isDel">
                      <el-tooltip effect="dark" :content="item.isDelContent">
                        <Icon class="icon" icon="lucide:mail-x" width="15" height="15"/>
                      </el-tooltip>
                    </div>
                  </div>
                  <div v-else></div>
                  <span class="name">
                    <span>
                      <div class="unread" v-if="isMobile && (item.unread === EmailUnreadEnum.UNREAD && showUnread) "/>
                      <slot name="name" :email="item"> {{ item.name }}</slot>
                    </span>
                    <span class="inline-star" v-if="item.isStar">
                      <Icon icon="lucide:star" width="12" height="12"/>
                    </span>
                  </span>
                  <span class="phone-time">{{ item.formatCreateTime }}</span>
                </div>
                <div>
                  <div class="email-text">
                    <span class="email-subject">
                      <div class="unread" v-if="!isMobile && (item.unread === EmailUnreadEnum.UNREAD && showUnread) "/>
                      <span v-if="item.code" class="code-tag" @click.stop="copyCode(item.code)">[{{ t('codeLabel') }}{{ item.code }}]</span>
                      <span class="subject-text">
                        <slot name="subject" :email="item" >
                          {{ item.subject || '\u200B' }}
                        </slot>
                      </span>
                    </span>
                    <span class="email-content">{{ item.listText || item.text || '\u200B' }}</span>
                  </div>
                  <div class="user-info" v-if="showUserInfo">
                    <div class="user">
                      <span>
                        <Icon icon="lucide:user" width="13" height="13"/>
                      </span>
                      <span>{{ item.userEmail }}</span>
                    </div>
                    <div class="account">
                      <span>
                        <Icon icon="lucide:mail" width="13" height="13"/>
                      </span>
                      <span>{{ item.type === 0 ? item.toEmail : item.sendEmail }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="email-right" :style="showUserInfo ? 'align-self: start;':''">
                <span class="email-time">{{ item.formatCreateTime }}</span>
              </div>
            </div>
            <skeletonBlock v-else-if="item.expand === 'loading'"
                           :rows="1"
                           :showStar="showStar"
                           :accountShow="accountShow"
                           :showStatus="showStatus"
                           :showUserInfo="showUserInfo"
                           :type="type"/>
            <div class="noLoading" v-else-if="item.expand === 'noMoreData'">
              <div>{{ $t('noMoreData') }}</div>
            </div>
          </template>
        </UseVirtualList>
      <skeletonBlock v-if="firstLoad && showFirstLoading"
                       :rows="20"
                       :showStar="showStar"
                       :accountShow="accountShow"
                       :showStatus="showStatus"
                       :showUserInfo="showUserInfo"
                       :type="type"/>
      <skeletonBlock v-if="loading"
                       :rows="skeletonRows"
                       :showStar="showStar"
                       :accountShow="accountShow"
                       :showStatus="showStatus"
                       :showUserInfo="showUserInfo"
                       :type="type"/>
      <div class="empty" v-if="noLoading && emailList.length === 0 && !loading">
        <div class="empty-state">
          <div class="empty-icon"><Icon icon="lucide:mail" width="30" height="30" /></div>
          <div class="empty-title">{{ $t('noMessagesFound') }}</div>
        </div>
      </div>
    </div>
    <el-dropdown
        ref="dropdownRef"
        @visible-change="visibleChange"
        :virtual-ref="triggerRef"
        :show-arrow="false"
        :popper-options="{
      modifiers: [{ name: 'offset', options: { offset: [0, 0] } }],
    }"
        virtual-triggering
        trigger="contextmenu"
        placement="bottom-start"
    >
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-if="rightClickEmail.code" @click="copyCode(rightClickEmail.code)" >
            <template #default>
              <div class="right-dropdown-item">
                <Icon icon="lucide:clipboard" width="20" height="20" />
                <span>{{t('copyCode')}}</span>
              </div>
            </template>
          </el-dropdown-item>
          <el-dropdown-item v-if="['email'].includes(props.type)" @click="emailRead(rightClickEmail.emailId)" >
            <template #default>
              <div class="right-dropdown-item">
                <Icon icon="lucide:mail-open" width="20" height="20" />
                <span>{{t('markAsRead')}}</span>
              </div>
            </template>
          </el-dropdown-item>
          <el-dropdown-item v-if="['email','star'].includes(props.type)" @click="openReply(rightClickEmail)">
            <template #default>
              <div class="right-dropdown-item">
                <Icon icon="lucide:reply" width="20" height="20"  />
                <span>{{t('reply')}}</span>
              </div>
            </template>
          </el-dropdown-item>
          <el-dropdown-item v-if="['email','send', 'star'].includes(props.type)" @click="openForward(rightClickEmail)">
            <template #default>
              <div class="right-dropdown-item">
                <Icon icon="lucide:forward" width="19" height="19"  />
                <span>{{t('forward')}}</span>
              </div>
            </template>
          </el-dropdown-item>
          <el-dropdown-item v-if="['email','send', 'star'].includes(props.type)" @click="starChange(rightClickEmail)">
            <template #default>
              <div class="right-dropdown-item">
                <Icon icon="lucide:star" width="19" height="19"/>
                <span>{{t('star')}}</span>
              </div>
            </template>
          </el-dropdown-item>
          <el-dropdown-item v-if="props.type === 'all-email'" @click="handleSearch('user', rightClickEmail.userEmail)">
            <template #default>
              <div class="right-dropdown-item">
                <Icon icon="lucide:search" width="20" height="20" />
                <span>{{t('searchUser')}}</span>
              </div>
            </template>
          </el-dropdown-item>
          <el-dropdown-item v-if="props.type === 'all-email' " @click="handleSearch('account', rightClickEmail.toEmail)">
            <template #default>
              <div class="right-dropdown-item">
                <Icon icon="lucide:search" width="20" height="20" />
                <span>{{t('searchEmail')}}</span>
              </div>
            </template>
          </el-dropdown-item>
          <el-dropdown-item v-if="props.type === 'all-email' " @click="handleSearch('name', rightClickEmail.name)">
            <template #default>
              <div class="right-dropdown-item">
                <Icon icon="lucide:search" width="20" height="20" />
                <span>{{t('searchSender')}}</span>
              </div>
            </template>
          </el-dropdown-item>
          <el-dropdown-item @click="rightDelete(rightClickEmail.emailId)">
            <template #default>
              <div class="right-dropdown-item">
                <Icon icon="lucide:trash-2" width="16" height="20" style="margin-left: 1px;margin-right: 3px" />
                <span>{{t('delete')}}</span>
              </div>
            </template>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import {Icon} from "@iconify/vue";
import skeletonBlock from "@/components/email-scroll/skeleton/index.vue"
import {computed, onActivated, reactive, ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import {useEmailStore} from "@/store/email.js";
import {useUiStore} from "@/store/ui.js";
import {useSettingStore} from "@/store/setting.js";
import {sleep} from "@/utils/time-utils.js"
import {fromNow} from "@/utils/day.js";
import {useI18n} from "vue-i18n";
import {EmailUnreadEnum} from "@/enums/email-enum.js";
import { UseVirtualList } from '@vueuse/components'
import { useScroll } from '@vueuse/core'
import {useRoute} from "vue-router";

const props = defineProps({
  getEmailList: Function,
  emailDelete: Function,
  emailRead: Function,
  starAdd: Function,
  starCancel: Function,
  cancelSuccess: Function,
  starSuccess: Function,
  actionLeft: {
    type: String,
    default: '0'
  },
  timeSort: {
    type: Number,
    default: 0,
  },
  showStatus: {
    type: Boolean,
    default: false
  },
  showAccountIcon: {
    type: Boolean,
    default: true,
  },
  showUserInfo: {
    type: Boolean,
    default: false
  },
  showStar: {
    type: Boolean,
    default: true
  },
  allowStar: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    default: 'email'
  },
  showFirstLoading: {
    type: Boolean,
    default: true
  },
  showUnread: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['jump', 'refresh-before', 'delete-draft', 'right-search'])
const {t} = useI18n()
const route = useRoute()
const settingStore = useSettingStore()
const uiStore = useUiStore();
const emailStore = useEmailStore();
const loading = ref(false);
const followLoading = ref(false);
const noLoading = ref(false);
const emailList = reactive([])
const expandList = reactive([])
const total = ref(0);
const checkAll = ref(false);
const isIndeterminate = ref(false);
const scroll = ref(null)
const firstLoad = ref(true)
let scrollTop = 0
const latestEmail = ref(null)
const scrollbarRef = ref(null)
let reqLock = false
let isMobile = ref(innerWidth < 1367)
let skeletonRows = 0
const timePaddingRight = ref('');
const keyCount = ref(0);
const dropdownRef = ref(null);
const dropdownCloseLock = ref(false);
const dropdownShow = ref(false);
const rightClickEmail = ref({});
const MAX_SELECT_COUNT = 95;
const checkedEmailCount = ref(0);
const isSelectMax = computed(() => checkedEmailCount.value >= MAX_SELECT_COUNT);
const selectedCount = computed(() => emailList.filter(item => item.checked).length);
let timer = null
const position = ref(
    DOMRect.fromRect({
      x: 0,
      y: 0,
    })
)

const triggerRef = ref({
  getBoundingClientRect() {
    return position.value;
  }
})

const queryParam = reactive({
  size: 50
});

defineExpose({
  refreshList,
  deleteEmail,
  addItem,
  handleList,
  emailList,
  firstLoad,
  latestEmail,
  noLoading,
  total
})

onActivated(() => {
  requestAnimationFrame(() => {
    const index = scrollTop / itemHeight.value
    scrollbarRef.value?.scrollTo(index);
  })
})

onMounted(() => {
  timer = setInterval(() => {
    emailList.forEach(email => {
      email.formatCreateTime = fromNow(email.createTime);
    })
  }, 1000 * 60);
})

onUnmounted(() => {
  clearInterval(timer)
})

getEmailList()

window.onresize = () => {
  isMobile.value = innerWidth < 1367
}

function onScroll(e) {
  scrollTop = e.target.scrollTop;
}

const { arrivedState } = useScroll(scrollbarRef, {
  offset: { bottom: isMobile.value ? 2200 : 1500 }
})


const list = computed(() => {
  return [...emailList, ...expandList]
})

const itemHeight = computed(() => {
    if (props.type === 'all-email') {
      return isMobile.value ? 132 : 72;
    } else  {
      return isMobile.value ? 84 : 56;
    }
})

watch(emailList, () => {
  updateHasScrollbar();
})

watch(scrollbarRef, () => {
  updateHasScrollbar();
})

// 强制刷新 (itemHeight 更改后虚拟滚动列表不会自己更新)
watch(itemHeight, () => {
  keyCount.value ++
})

watch(followLoading, (isFollowLoading) => {
  if (isFollowLoading) {
    expandList.push({
      emailId: 0,
      expand: 'loading'
    })
  } else {
    const index = expandList.findIndex(item => item.expand === 'loading')
    expandList.splice(index, 1);
  }
});

watch(noLoading, (isNoLoading) => {
  if (isNoLoading) {
    expandList.push({
      emailId: 0,
      expand: 'noMoreData'
    })
  } else {
    const index = expandList.findIndex(item => item.expand === 'noMoreData')
    expandList.splice(index, 1);
  }
})


// 监听是否到达底部
watch(() => arrivedState.bottom, (isBottom) => {
  if (isBottom && !loading.value) {
    loadData();
  }
});

watch(
    () => emailList.map(item => item.checked),
    () => {
      checkedEmailCount.value = emailList.length
      if (emailList.length > 0) {
        updateCheckStatus();
      }
    },
    {deep: true}
);


watch(() => emailStore.deleteIds, () => {
  if (emailStore.deleteIds) {
    deleteEmail(emailStore.deleteIds)
  }
})

watch(() => emailStore.cancelStarEmailId, () => {
  emailList.forEach(email => {
    if (email.emailId === emailStore.cancelStarEmailId) {
      email.isStar = 0
    }
  })
})

watch(() => emailStore.addStarEmailId, () => {
  emailList.forEach(email => {
    if (email.emailId === emailStore.addStarEmailId) {
      email.isStar = 1
    }
  })
})

window.addEventListener('wheel', (event) => {
  if (dropdownShow.value) {
    dropdownRef.value.handleClose();
  }
})

function openReply(email) {
  const fullEmail = emailStore.detailMap[email.emailId]
  if (!fullEmail) return
  uiStore.writerRef.openReply(fullEmail)
}

function openForward(email) {
  const fullEmail = emailStore.detailMap[email.emailId]
  if (!fullEmail) return
  uiStore.writerRef.openForward(fullEmail)
}

function visibleChange(e) {
  dropdownShow.value = e;
  dropdownCloseLock.value = true;
  setTimeout(() => {
    dropdownCloseLock.value = false;
  },1500)

  if (!e && rightClickEmail.value.rightChecked) {
    rightClickEmail.value.rightChecked = false
  }
}

const handleContextmenu = (event, email) => {

  if (props.type === 'draft') {
    return
  }

  if (rightClickEmail.value.rightChecked) {
    rightClickEmail.value.rightChecked = false
  }

  const { clientX, clientY } = event
  position.value = DOMRect.fromRect({
    x: clientX,
    y: clientY,
  })
  event.preventDefault();
  dropdownRef.value?.handleOpen();

  rightClickEmail.value = email;
  rightClickEmail.value.rightChecked = true
}

function updateHasScrollbar() {
  nextTick(() => {
    const doc = document.querySelector('.virtual');
    if (doc) {
      if (doc.scrollHeight > doc.clientHeight) {
        timePaddingRight.value = '5px';
      } else {
        timePaddingRight.value = '15px'
      }
    }
  })
}

function getSkeletonRows() {
  if (emailList.length > 20) return skeletonRows = 20
  if (emailList.length === 0) return skeletonRows = 1
  skeletonRows = emailList.length
}

const accountShow = computed(() => {
  return uiStore.accountShow && settingStore.settings.manyEmail === 0
})

function starChange(email) {

  if (!email.isStar) {

    if (!props.allowStar) return;

    email.isStar = 1;
    props.starAdd(email.emailId).then(() => {
      email.isStar = 1;
      props.starSuccess(email)
    }).catch(e => {
      console.error(e)
      email.isStar = 0
    })
  } else {

    email.isStar = 0;
    props.starCancel(email.emailId).then(() => {
      email.isStar = 0;
      props.cancelSuccess?.(email)
    }).catch(e => {
      console.error(e)
      email.isStar = 1;
    })
  }
}

function changeAccountShow() {
  uiStore.accountShow = !uiStore.accountShow;
}

const handleRead = () => {
  const emailIds = getSelectedMailsIds();
  props.emailRead(emailIds);
  localRead(emailIds);
}

function emailRead(emailId) {
  props.emailRead([emailId])
  localRead([emailId]);
}

function localRead(emailIds) {
  emailIds.forEach(emailId => {
    const index = emailList.findIndex(email => email.emailId === emailId);
    if (index > -1) {
      emailList[index].unread = EmailUnreadEnum.READ;
      emailList[index].checked = false;
    }
  })
}

function rightDelete(emailId) {

  if (props.type === 'all-email') {
    ElMessageBox.confirm(t('delOneEmailConfirm'), {
      confirmButtonText: t('confirm'),
      cancelButtonText: t('cancel'),
      type: 'warning'
    }).then(() => {
      props.emailDelete([emailId]).then(() => {
        ElMessage({
          message: t('delSuccessMsg'),
          type: 'success',
          plain: true
        })
        emailStore.deleteIds = [emailId];
      })
    })
    return;
  }
  props.emailDelete([emailId]).then(() => {
    ElMessage({
      message: t('delSuccessMsg'),
      type: 'success',
      plain: true
    })
    emailStore.deleteIds = [emailId];
  })
}

function handleSearch(type, value) {
  emit('right-search', type, value);
}

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code);
    ElMessage({
      message: t('copySuccessMsg'),
      type: 'success',
      plain: true
    })
  } catch (err) {
    console.error(`${t('copyFailMsg')}:`, err);
    ElMessage({
      message: t('copyFailMsg'),
      type: 'error',
      plain: true
    })
  }
}

function handleDelete() {
  ElMessageBox.confirm(t('delEmailsConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {

    if (props.type === 'draft') {
      const draftIds = getSelectedDraftsIds();
      emit('delete-draft', draftIds);
      return;
    }

    const emailIds = getSelectedMailsIds();
    props.emailDelete(emailIds).then(() => {
      ElMessage({
        message: t('delSuccessMsg'),
        type: 'success',
        plain: true
      })
      emailStore.deleteIds = emailIds;
    })
  })
}

function deleteEmail(emailIds) {
  emailIds.forEach(emailId => {
    emailList.forEach((item, index) => {
      if (emailId === item.emailId) {
        emailList.splice(index, 1);
      }
    })
  })
  if (emailList.length < queryParam.size && !noLoading.value) {
    getEmailList()
  }
}

function addItem(email) {

  const existIndex = emailList.findIndex(item => item.emailId === email.emailId)

  if (existIndex > -1) {
    return false;
  }

  email.formatCreateTime = fromNow(email.formatCreateTime);

  if (props.timeSort) {
    if (noLoading.value) {
      handleList([email]);
      emailList.push(email);
    }

    if (email.emailId > latestEmail.value?.emailId) {
      latestEmail.value = email
    }

    total.value++
    return true;
  }


  const index = emailList.findIndex(item => item.emailId < email.emailId)

  if (index !== -1) {
    handleList([email]);
    emailList.splice(index, 0, email);
  } else {
    if (noLoading.value) {
      handleList([email]);
      emailList.push(email);
    }
  }

  if (email.emailId > latestEmail.value?.emailId) {
    latestEmail.value = email
  }

  total.value++
  return true;
}

function handleCheckAllChange(val) {
  if (val) {
    let count = 0;
    emailList.forEach(item => {
      if (count < MAX_SELECT_COUNT) {
        item.checked = true;
        count++;
      } else {
        item.checked = false;
      }
    });
  } else {
    emailList.forEach(item => item.checked = false);
  }
  isIndeterminate.value = false;
}

// 获取选中的邮件列表id
function getSelectedMailsIds() {
  return emailList.filter(item => item.checked).map(item => item.emailId);
}

function getSelectedDraftsIds() {
  return emailList.filter(item => item.checked).map(item => item.draftId);
}

function updateCheckStatus() {
  const checkedCount = emailList.filter(item => item.checked).length;
  checkedEmailCount.value = checkedCount;
  const atMax = checkedCount >= MAX_SELECT_COUNT;
  checkAll.value = emailList.length > 0 && (checkedCount === emailList.length || atMax);
  isIndeterminate.value = checkedCount > 0 && !checkAll.value;
}

function jumpDetails(email) {

  if (dropdownShow.value) {
    dropdownRef.value.handleClose();
    return;
  }

  if (!dropdownCloseLock.value) {
    const sel = window.getSelection();
    if (sel.toString().trim()) {
      return
    }
  }
  emit('jump', email)
}


function getEmailList(refresh = false) {

  if (reqLock) return;

  let emailId = emailList.length > 0 ? emailList.at(-1).emailId : 0;

  reqLock = true

  if (!refresh) {

    if (loading.value || noLoading.value) {
      reqLock = false
      return
    }

  } else {
    getSkeletonRows()
    emailId = 0
    loading.value = true
    scrollTop = 0
  }

  if (emailList.length === 0) {
    loading.value = true
  } else {
    followLoading.value = !refresh;
  }
  let start = Date.now();

  props.getEmailList(emailId, queryParam.size).then(async data => {
    let end = Date.now();
    let duration = end - start;
    if (duration < 300 && !emailId) {
        await sleep(300 - duration)
    }
    firstLoad.value = false

    let list = data.list.map(item => ({
      ...item,
      checked: false
    }));


    if (refresh) {
      emailList.length = 0
    }

    latestEmail.value = data.latestEmail

    handleList(list);
    emailList.push(...list);
    if (refresh) scrollbarRef.value?.setScrollTop(0);

    noLoading.value = data.list.length < queryParam.size;
    followLoading.value = data.list.length >= queryParam.size;

    total.value = data.total;
  }).finally(() => {
    loading.value = false
    reqLock = false
  })
}

function handleList(list) {
  list.forEach(email => {
    email.formatCreateTime = fromNow(email.createTime);
    email.test = t('received')
    const statusIconMap = {
      0: { icon: 'lucide:mail-open', color: 'var(--cm-success)', content: t('received') },
      1: { icon: 'lucide:send',  color: 'var(--cm-success)', content: t('sent') },
      2: { icon: 'lucide:mail-check',     color: 'var(--cm-success)', content: t('delivered') },
      3: { icon: 'lucide:mail-x',         color: 'var(--cm-danger)', content: t('bounced') },
      8: { icon: 'lucide:mail-x',         color: 'var(--cm-danger)', content: t('bounced') },
      4: { icon: 'lucide:circle-alert', color: 'var(--cm-warning)', content: t('complained') },
      5: { icon: 'lucide:send',  color: 'var(--cm-warning)', content: t('delayed') },
      7: { icon: 'lucide:mail-open', color: 'var(--cm-warning)', content: t('noRecipient') },
    };

    if (email.isDel) {
      email.isDelContent = t('selectDeleted');
    }
    email.statusIcon = statusIconMap[email.status];
  })
}

function refresh() {
  emit('refresh-before')
  if (props.skeleton) {
    scrollbarRef.value.setScrollTop(0)
  }
  refreshList()
}

function refreshList() {
  checkAll.value = false;
  isIndeterminate.value = false;
  getEmailList(true);
}

function loadData() {
  getEmailList()
}

</script>
<style lang="scss" scoped>

.email-container {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--cm-gap);
  padding: var(--cm-page-pad-y) var(--cm-page-pad-x);
  overflow: hidden;
  font-size: 13.5px;
  color: var(--cm-text);
  background: var(--cm-canvas);
}

.mail-toolbar {
  flex: 0 0 auto;
}

.cm-toolbar__filters {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.mail-count {
  font-size: 12.5px;
  color: var(--cm-text-3);
  margin-right: 4px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  background: var(--cm-surface);
  border: 1px solid var(--cm-line);
  border-radius: var(--cm-radius);
  box-shadow: var(--cm-shadow-1);
  padding: 4px;
}

.virtual { will-change: scroll-position; }

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 240px;
}

.empty-state {
  display: grid;
  justify-items: center;
  gap: 12px;
}

.empty-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  color: var(--cm-brand-strong);
  background: var(--cm-brand-soft);
}

.empty-title { color: var(--cm-text-2); font-size: 13.5px; }

.noLoading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 18px 0;
  color: var(--cm-text-3);
  font-size: 12.5px;
}

:deep(.email-row) {
  display: flex;
  align-items: center;
  gap: 0;
  height: 56px;
  padding: 0 10px 0 8px;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  color: var(--cm-text);
  transition: background-color .13s ease;

  &.all-email { height: 72px; }

  @media (pointer: coarse) { user-select: none; }

  &:hover { background: var(--cm-surface-soft); }
  &:hover .email-time { color: var(--cm-text-2); }

  &[data-checked="true"] { background: var(--cm-brand-softer); }

  &.right-checked,
  &.right-checked:hover { background: var(--cm-brand-soft); }

  .checkbox,
  .all-email-checkbox {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 8px 0 4px;
  }

  .title {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: 196px minmax(0, 1fr);
    align-items: center;
    gap: 14px;
  }

  .email-sender {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 6px;
    min-width: 0;
    color: var(--cm-text-2);
    font-size: 13px;
  }

  .email-status {
    display: flex;
    align-items: center;
    gap: 3px;

    .iconify { color: var(--cm-text-3); }
  }

  .name {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    > span:first-child {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }

  .inline-star {
    display: none;
    color: var(--cm-brand-strong);
  }

  .phone-time { display: none; }

  .email-text {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
  }

  .email-subject {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
    max-width: 58%;
    min-width: 0;
    color: var(--cm-text);
    font-weight: 500;
  }

  .subject-text {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .code-tag {
    flex: 0 0 auto;
    font-size: 12px;
    font-weight: 600;
    color: var(--cm-brand-strong);
    background: var(--cm-brand-soft);
    border-radius: 5px;
    padding: 1px 6px;
    cursor: pointer;
    max-width: 170px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .email-content {
    flex: 1 1 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: var(--cm-text-3);
    min-width: 0;
  }

  .email-right {
    flex: 0 0 auto;
    display: flex;
    justify-content: flex-end;
    padding-left: 14px;
    width: 96px;
  }

  .email-time {
    font-size: 12px;
    color: var(--cm-text-3);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .user-info {
    display: flex;
    gap: 14px;
    margin-top: 3px;
    color: var(--cm-text-3);
    font-size: 11.5px;
    min-width: 0;

    .user, .account {
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: 0;
      max-width: 320px;

      .iconify { color: var(--cm-text-3); }
      span:last-child {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
  }
}

/* unread emphasis */
:deep(.email-row.is-unread) {
  .name, .email-subject { color: var(--cm-text); font-weight: 620; }
  .email-time { color: var(--cm-text-2); }
}

.row-star {
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  color: var(--cm-text-3);
  opacity: .55;
  cursor: pointer;
  transition: color .14s ease, opacity .14s ease, background-color .14s ease;

  &:hover { background: var(--cm-surface-sunken); color: var(--cm-warning); opacity: 1; }
  &.is-star { color: var(--cm-warning); opacity: 1; }
  &.is-star .iconify path { fill: currentColor; }
}

.unread {
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: var(--cm-brand);
  display: inline-block;
  margin-right: 6px;
}

.del-status {
  display: flex;
  align-items: center;
  color: var(--cm-danger);
}

.right-dropdown-item {
  display: flex;
  align-items: center;
  gap: 9px;
}

:deep(.el-dropdown-menu__item) {
  padding-left: 10px;
  padding-right: 12px;
}

ul { list-style: none; padding: 0; margin: 0; }

:deep(.el-scrollbar__view) { height: 100%; }

/* ---------- responsive ---------- */
@media (max-width: 1366px) {
  :deep(.email-row) {
    height: 84px;
    align-items: flex-start;
    padding-top: 10px;
    padding-bottom: 10px;

    &.all-email { height: 132px; }

    .title {
      grid-template-columns: 1fr;
      gap: 2px;
      align-items: start;
    }

    .email-sender { grid-template-columns: auto minmax(0, 1fr) auto; }
    .name { font-weight: 500; }
    .phone-time {
      display: block;
      font-size: 11.5px;
      color: var(--cm-text-3);
      font-weight: 400;
    }
    .email-right { display: none; }
    .email-content { padding-left: 0; }
  }

  .row-star { margin-top: 2px; }
}

@media (max-width: 767px) {
  .email-container { padding: 10px; gap: 8px; }
  .scroll { padding: 2px; }

  :deep(.email-row) {
    height: 84px;
    padding: 9px 8px 9px 4px;
    align-items: flex-start;
    gap: 2px;

    .title {
      grid-template-columns: minmax(0, 1fr);
      gap: 1px;
      min-width: 0;
    }

    .email-sender {
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 4px;
    }

    .email-text {
      flex-direction: column;
      align-items: stretch;
      gap: 1px;
      min-width: 0;
      overflow: hidden;
    }

    .email-subject { max-width: 100%; }
    .email-content { width: 100%; flex: 0 0 auto; }
    .phone-time { display: block; }

    .checkbox, .all-email-checkbox { padding: 0 4px 0 0; }
    .user-info { flex-direction: column; gap: 2px; }
  }

  .row-star { width: 24px; flex: 0 0 24px; margin-top: 1px; }
  .mail-count { display: none; }
  .cm-toolbar__filters { flex: 1 1 100%; order: -1; }
  .cm-toolbar__filters:empty { display: none; }
}

</style>
