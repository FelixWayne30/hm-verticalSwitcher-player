<template>
  <Page>
    <slot></slot>
  </Page>
</template>

<script>
export default {
  onLaunch() {
    console.log('App Launch')
    // 初始化应用配置
    this.initApp()

    // 设置屏幕方向为竖屏（仅 APP 端生效）
    /* #ifdef APP-PLUS */
    plus.screen.lockOrientation('portrait-primary')
    /* #endif */
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  },
  methods: {
    initApp() {
      console.log('初始化应用配置')
    }
  }
}
</script>

<style>
/* 这里写全局样式 */
</style>
