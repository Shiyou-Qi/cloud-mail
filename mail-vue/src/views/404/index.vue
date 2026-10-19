<template>
  <div class="box-404">
    <div class="not-found">
      <div class="code">404</div>
      <div class="icon-wrap">
        <Icon icon="lucide:mail-search" width="26" height="26"/>
      </div>
      <h1 class="title">{{ $t('error404') }}</h1>
      <p class="desc">{{ $t('notFoundDesc') }}</p>
      <el-button type="primary" @click="router.replace({name: 'layout'})">{{ $t('home') }}</el-button>
    </div>
  </div>
</template>

<script lang="js" setup>
import router from "@/router/index.js";
import {Icon} from "@iconify/vue";
</script>

<style scoped lang="scss">
.box-404 {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  background: var(--cm-canvas);
  padding: 24px;
}

.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  max-width: 420px;
}

.code {
  font-size: 64px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -.04em;
  color: var(--cm-line-strong);
}

.icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: var(--cm-brand-soft);
  color: var(--cm-brand-strong);
  margin: 6px 0 4px;
}

.title {
  margin: 0;
  font-size: 17px;
  font-weight: 620;
  color: var(--cm-text);
}

.desc {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--cm-text-3);
}
</style>
