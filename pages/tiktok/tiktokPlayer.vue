<template>
  <view class="player-root">
    <swiper
      class="swiper"
      vertical
      :current="currentIndex"
      @change="onChange"
      :indicator-dots="false"
      :disable-touch="false"
      :circular="false"
      :autoplay="false"
      :duration="200"
    >
      <swiper-item v-for="(v, idx) in videos" :key="v.id" class="sw-item">
        <video
          :id="'vid_' + v.id"
          :src="v.url"
          controls
          autoplay
          loop
          objectFit="cover"
          @play="onVideoPlay(idx)"
          @pause="onVideoPause(idx)"
          style="width:100%;height:100%;"
        ></video>
      </swiper-item>
    </swiper>

    <!-- 小按钮：返回/列表名 -->
    <view class="top-ui">
      <button class="back" @click="goBack">返回</button>
      <text class="list-name">{{ listName }}</text>
    </view>
  </view>
</template>

<script>
import videoManager from '@/utils/videoManager.js'

export default {
  data() {
    return {
      listId: null,
      videos: [],
      currentIndex: 0,
      listName: ''
    }
  },
  onLoad(options) {
    this.listId = options.listId
    const start = parseInt(options.start || '0')
    this.loadList()
    this.currentIndex = isNaN(start) ? 0 : start
  },
  onShow() {
    // ensure fresh data
    this.loadList()
    this.$nextTick(() => {
      this.playAtIndex(this.currentIndex)
    })
  },
  methods: {
    loadList() {
      this.videos = videoManager.getVideos(this.listId)
      const pl = videoManager.getPlaylists().find(p => p.id === this.listId)
      this.listName = pl ? pl.name : ''
    },

    onChange(e) {
      // e.detail.current 为当前索引
      const idx = e.detail.current
      this.currentIndex = idx
      // 小延迟确保 swiper 内的 video 元素已挂载
      this.$nextTick(() => {
        this.playAtIndex(idx)
      })
    },

    playAtIndex(idx) {
      // pause all videos except idx
      this.videos.forEach((v, i) => {
        const el = uni.createSelectorQuery().select(`#vid_${v.id}`).exec ? null : null
      })
      // Uni-app 在不同平台选择 video DOM 方式不同。我们尽量用小技巧：
      // 先暂停通过在页面上触发暂停/播放：使用组件引用不稳定，使用 js API 调用 videoContext
      this.videos.forEach((v, i) => {
        try {
          const ctx = uni.createVideoContext(`vid_${v.id}`, this)
          if (i === idx) {
            // play current
            ctx.play && ctx.play()
          } else {
            ctx.pause && ctx.pause()
          }
        } catch (e) {
          // ignore
        }
      })
    },

    onVideoPlay(idx) {
      // 可以根据需要做统计或 UI 更新
    },
    onVideoPause(idx) {
      // ignore
    },

    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style>
.player-root { width:100vw; height:100vh; background:#000; position:relative; }
.swiper { width:100%; height:100%; }
.sw-item { width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#000; }
.top-ui { position: absolute; left: 12rpx; top: 24rpx; display:flex; gap:12rpx; align-items:center; }
.back { background: rgba(255,255,255,0.1); padding:8rpx 12rpx; border-radius:6rpx; color:#fff; }
.list-name { color:#fff; font-size:28rpx; margin-left:8rpx; }
</style>
