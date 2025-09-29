<template>
  <view class="player-container">
    <video
      v-if="current"
      id="videoPlayer"
      :src="current.url"
      controls
      autoplay
      style="width:100%;height:100%;background:#000;"
    ></video>

    <view v-else class="empty">未选择视频</view>

    <!-- 控制栏 -->
    <view class="controls" v-if="current">
      <button @click="playPrev">上一个</button>
      <button @click="playNext">下一个</button>
    </view>
  </view>
</template>

<script>
import videoManager from '@/utils/videoManager.js'

export default {
  data() {
    return { current: null }
  },
  onShow() {
    this.current = videoManager.getCurrentVideo()
  },
  methods: {
    playNext() {
      this.current = videoManager.getNextVideo()
    },
    playPrev() {
      this.current = videoManager.getPreviousVideo()
    }
  }
}
</script>

<style>
.player-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.controls {
  display: flex;
  justify-content: space-around;
  padding: 20rpx;
}
.empty {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #888;
}
</style>
