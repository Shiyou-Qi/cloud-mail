<template>
  <div class="content-box" ref="contentBox">
    <div ref="container" class="content-html"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  html: {
    type: String,
    required: true
  }
})

const container = ref(null)
const contentBox = ref(null)
let shadowRoot = null
let observer = null
let lastBoxWidth = 0

function updateContent() {
  if (!shadowRoot) return;

  // 1. 提取 <body> 的 style 属性（如果存在）
  const bodyStyleRegex = /<body[^>]*style="([^"]*)"[^>]*>/i;
  const bodyStyleMatch = props.html.match(bodyStyleRegex);
  const bodyStyle = bodyStyleMatch ? bodyStyleMatch[1] : '';

  // 2. 移除 <body> 标签（保留内容）
  const cleanedHtml = props.html.replace(/<\/?body[^>]*>/gi, '');

  // 3. 将 body 的 style 应用到 .shadow-content
  shadowRoot.innerHTML = `
    <style>
      :host {
        all: initial;
        display: block;
        width: 100%;
        font-family: Inter, 'Helvetica Neue', Helvetica, 'PingFang SC',
                    'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #13181D;
        word-break: break-word;
      }

      h1, h2, h3, h4 {
          font-size: 18px;
          font-weight: 700;
      }

      img { max-width: 100% !important; height: auto !important; }

      table { max-width: 100% !important; }

      p {
        margin: 0;
      }

      a {
        text-decoration: none;
        color: #0E70DF;
      }

      .shadow-content {
        background: transparent;
        width: auto;
        max-width: 100%;
        min-width: 100%;
        overflow-wrap: break-word;
        ${bodyStyle ? bodyStyle : ''} /* 注入 body 的 style */
      }

      img:not(table img) {
        max-width: 100%;
        height: auto !important;
      }

    </style>
    <div class="shadow-content">
      ${cleanedHtml}
    </div>
  `;

  // 图片加载完成后重新量一次宽度，避免宽图把正文撑出滚动条
  shadowRoot.querySelectorAll('img').forEach(img => {
    if (!img.complete) img.addEventListener('load', () => autoScale(), {once: true})
  })
}

function autoScale() {
  if (!shadowRoot || !contentBox.value) return

  const parent = contentBox.value
  const shadowContent = shadowRoot.querySelector('.shadow-content')
  const host = shadowRoot.host

  if (!shadowContent) return

  // 先复位，避免上一次的缩放影响测量结果
  host.style.zoom = ''

  const parentWidth = parent.offsetWidth
  const childWidth = shadowContent.scrollWidth

  if (!parentWidth || !childWidth) return

  // 只缩小超宽邮件（如固定 600px 宽的营销邮件），不做放大
  const scale = Math.min(1, parentWidth / childWidth)
  host.style.zoom = scale < 1 ? String(scale) : ''
}

onMounted(() => {
  shadowRoot = container.value.attachShadow({ mode: 'open' })
  updateContent()
  autoScale()

  observer = new ResizeObserver(() => {
    const width = contentBox.value?.offsetWidth || 0
    if (!width || width === lastBoxWidth) return
    lastBoxWidth = width
    autoScale()
  })
  observer.observe(contentBox.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

watch(() => props.html, () => {
  updateContent()
  autoScale()
})
</script>

<style scoped>
.content-box {
  width: 100%;
  overflow: hidden;
  font-family: Inter, "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
}

.content-html {
  width: 100%;
}
</style>
