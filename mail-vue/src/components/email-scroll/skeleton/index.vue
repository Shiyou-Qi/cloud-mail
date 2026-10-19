<template>
  <div class="skeleton-list">
    <div class="skeleton-row" v-for="i in rows" :key="i" :class="{ 'is-wide': type === 'all-email' }">
      <span class="sk-block sk-check"></span>
      <span class="sk-block sk-star" v-if="showStar"></span>
      <span class="sk-star" v-else></span>

      <span class="sk-main">
        <span class="sk-sender">
          <span class="sk-block" v-if="showStatus"></span>
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="text" style="width: 96px; height: 12px"/>
            </template>
          </el-skeleton>
        </span>
        <span class="sk-subject">
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="text" style="width: 42%; height: 12px"/>
              <el-skeleton-item variant="text" style="flex: 1; height: 12px"/>
            </template>
          </el-skeleton>
        </span>
      </span>

      <span class="sk-time">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="text" style="width: 46px; height: 11px"/>
          </template>
        </el-skeleton>
      </span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  rows: {type: Number, default: 1},
  showStar: {type: Boolean, default: true},
  accountShow: {type: Boolean, default: false},
  showStatus: {type: Boolean, default: false},
  showUserInfo: {type: Boolean, default: false},
  type: {type: String, default: ''}
})
</script>

<style scoped lang="scss">
.skeleton-list {
  padding: 4px;
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 10px 0 8px;
  border-radius: 8px;

  &.is-wide { height: 72px; }
}

.sk-block {
  display: block;
  border-radius: 4px;
  background: var(--cm-surface-sunken);
}

.sk-check { width: 16px; height: 16px; border-radius: 4px; flex: 0 0 16px; }
.sk-star { width: 16px; height: 16px; flex: 0 0 16px; display: block; }

.sk-main {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: 196px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
}

.sk-sender { display: flex; align-items: center; gap: 6px; }

.sk-subject {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  :deep(.el-skeleton) { display: flex; gap: 8px; align-items: center; flex: 1; min-width: 0; }
  :deep(.el-skeleton__template) { display: flex; gap: 10px; align-items: center; width: 100%; }
}

.sk-time { flex: 0 0 70px; display: flex; justify-content: flex-end; }

:deep(.el-skeleton) { width: 100%; }

@media (max-width: 1366px) {
  .skeleton-row { height: 84px; &.is-wide { height: 132px; } }
  .sk-main { grid-template-columns: 1fr; gap: 6px; align-items: start; }
  .sk-time { display: none; }
}
</style>
