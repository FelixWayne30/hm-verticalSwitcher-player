<template>
  <view class="video-player-container">
    <!-- 视频播放器 -->
    <video
      :id="playerId"
      ref="videoPlayer"
      class="video-element"
      :src="videoUrl"
      :autoplay="autoplay"
      :loop="false"
      :muted="muted"
      :initial-time="initialTime"
      :controls="false"
      :show-center-play-btn="false"
      :show-fullscreen-btn="false"
      :show-progress="false"
      :enable-progress-gesture="false"
      object-fit="contain"
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
      @timeupdate="onTimeUpdate"
      @error="onError"
      @loadedmetadata="onLoadedMetadata"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
    </video>

    <!-- 控制层 -->
    <view class="control-overlay" v-show="showControls">
      <!-- 顶部信息栏 -->
      <view class="top-bar">
        <text class="video-title">{{ videoTitle }}</text>
        <text class="video-time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</text>
      </view>

      <!-- 中间控制按钮 -->
      <view class="center-controls">
        <view class="play-btn" @tap="togglePlay">
          <text class="iconfont">{{ playing ? '⏸' : '▶' }}</text>
        </view>
      </view>

      <!-- 底部进度条 -->
      <view class="bottom-bar">
        <view class="progress-container" @tap="seekTo">
          <view class="progress-bar">
            <view class="progress-played" :style="{ width: progressPercent + '%' }"></view>
            <view class="progress-buffered" :style="{ width: bufferedPercent + '%' }"></view>
          </view>
        </view>
      </view>

      <!-- 手势提示 -->
      <view class="gesture-hint" v-if="gestureHint">
        <text class="hint-text">{{ gestureHint }}</text>
      </view>
    </view>

    <!-- 倍速播放指示器 -->
    <view class="speed-indicator" v-if="playbackRate !== 1">
      <text class="speed-text">{{ playbackRate }}x</text>
    </view>

    <!-- 音量/亮度调节指示器 -->
    <view class="volume-indicator" v-if="adjusting">
      <view class="indicator-bar">
        <view class="indicator-fill" :style="{ height: adjustValue + '%' }"></view>
      </view>
      <text class="indicator-text">{{ adjustType === 'volume' ? '音量' : '亮度' }} {{ adjustValue }}%</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'VideoPlayer',
  props: {
    src: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: ''
    },
    autoplay: {
      type: Boolean,
      default: false
    },
    muted: {
      type: Boolean,
      default: false
    },
    initialTime: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      playerId: 'video_' + Date.now(),
      videoContext: null,
      playing: false,
      currentTime: 0,
      duration: 0,
      buffered: 0,
      showControls: true,
      controlsTimer: null,
      
      // 手势控制
      touchStartX: 0,
      touchStartY: 0,
      touchStartTime: 0,
      touchStartVolume: 0,
      touchStartBrightness: 0,
      gestureType: '', // 'seek', 'volume', 'brightness', 'speed'
      gestureHint: '',
      
      // 倍速控制
      playbackRate: 1,
      speedLongPress: null,
      
      // 音量/亮度调节
      adjusting: false,
      adjustType: '',
      adjustValue: 0,
      
      // 设备信息
      screenWidth: 375,
      screenHeight: 667
    }
  },
  computed: {
    videoUrl() {
      return this.src
    },
    videoTitle() {
      return this.title || '视频播放'
    },
    progressPercent() {
      return this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0
    },
    bufferedPercent() {
      return this.duration > 0 ? (this.buffered / this.duration) * 100 : 0
    }
  },
  mounted() {
    this.initPlayer()
    this.getSystemInfo()
  },
  methods: {
    initPlayer() {
      this.videoContext = uni.createVideoContext(this.playerId, this)
      this.hideControlsDelay()
    },
    
    getSystemInfo() {
      uni.getSystemInfo({
        success: (res) => {
          this.screenWidth = res.windowWidth
          this.screenHeight = res.windowHeight
        }
      })
    },
    
    // 播放控制
    play() {
      this.videoContext.play()
    },
    
    pause() {
      this.videoContext.pause()
    },
    
    togglePlay() {
      if (this.playing) {
        this.pause()
      } else {
        this.play()
      }
    },
    
    seekTo(e) {
      const rect = e.currentTarget.getBoundingClientRect()
      const percent = e.detail.x / rect.width
      const time = this.duration * percent
      this.videoContext.seek(time)
    },
    
    // 手势处理
    handleTouchStart(e) {
      const touch = e.touches[0]
      this.touchStartX = touch.pageX
      this.touchStartY = touch.pageY
      this.touchStartTime = Date.now()
      
      // 判断手势区域
      const screenMid = this.screenWidth / 2
      const edgeThreshold = 30 // 边缘30px内为音量/亮度调节
      
      if (touch.pageX < edgeThreshold || touch.pageX > this.screenWidth - edgeThreshold) {
        // 边缘区域 - 准备音量/亮度调节
        this.gestureType = touch.pageX < edgeThreshold ? 'brightness' : 'volume'
      } else if (touch.pageX < screenMid - 50) {
        // 左半区域 - 长按减速
        this.startSpeedControl(0.5)
      } else if (touch.pageX > screenMid + 50) {
        // 右半区域 - 长按加速
        this.startSpeedControl(2.0)
      }
      
      this.showControlsTemporary()
    },
    
    handleTouchMove(e) {
      const touch = e.touches[0]
      const deltaX = touch.pageX - this.touchStartX
      const deltaY = touch.pageY - this.touchStartY
      
      // 垂直滑动 - 音量/亮度调节
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
        if (this.gestureType === 'volume' || this.gestureType === 'brightness') {
          e.preventDefault()
          this.adjustValue = this.calculateAdjustValue(deltaY)
          this.adjusting = true
          this.adjustType = this.gestureType
          
          if (this.gestureType === 'volume') {
            this.setVolume(this.adjustValue / 100)
          } else {
            this.setBrightness(this.adjustValue / 100)
          }
        }
      }
      
      // 水平滑动 - 进度调节
      else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        if (this.gestureType === '') {
          this.gestureType = 'seek'
          const seekTime = this.currentTime + (deltaX / this.screenWidth) * 60
          this.gestureHint = `快进到 ${this.formatTime(seekTime)}`
        }
      }
    },
    
    handleTouchEnd(e) {
      const touchDuration = Date.now() - this.touchStartTime
      
      // 单击切换控制栏显示
      if (touchDuration < 200 && !this.gestureType) {
        this.showControls = !this.showControls
        if (this.showControls) {
          this.hideControlsDelay()
        }
      }
      
      // 结束倍速播放
      if (this.speedLongPress) {
        this.endSpeedControl()
      }
      
      // 重置手势状态
      setTimeout(() => {
        this.gestureType = ''
        this.gestureHint = ''
        this.adjusting = false
      }, 500)
    },
    
    // 倍速控制
    startSpeedControl(rate) {
      this.speedLongPress = setTimeout(() => {
        this.playbackRate = rate
        this.videoContext.playbackRate(rate)
        this.gestureHint = `${rate}x 倍速播放`
      }, 300)
    },
    
    endSpeedControl() {
      clearTimeout(this.speedLongPress)
      this.speedLongPress = null
      this.playbackRate = 1
      this.videoContext.playbackRate(1)
    },
    
    // 音量/亮度计算
    calculateAdjustValue(deltaY) {
      const percent = (-deltaY / this.screenHeight) * 200
      let value = (this.gestureType === 'volume' ? this.touchStartVolume : this.touchStartBrightness) + percent
      return Math.max(0, Math.min(100, value))
    },
    
    setVolume(value) {
      // #ifdef APP-PLUS
      plus.device.setVolume(value)
      // #endif
    },
    
    setBrightness(value) {
      // #ifdef APP-PLUS
      plus.screen.setBrightness(value)
      // #endif
    },
    
    // 控制栏显示/隐藏
    showControlsTemporary() {
      this.showControls = true
      this.hideControlsDelay()
    },
    
    hideControlsDelay() {
      clearTimeout(this.controlsTimer)
      this.controlsTimer = setTimeout(() => {
        this.showControls = false
      }, 3000)
    },
    
    // 事件处理
    onPlay() {
      this.playing = true
      this.$emit('play')
    },
    
    onPause() {
      this.playing = false
      this.$emit('pause')
    },
    
    onEnded() {
      this.$emit('ended')
    },
    
    onTimeUpdate(e) {
      this.currentTime = e.detail.currentTime
      this.duration = e.detail.duration
      this.$emit('timeupdate', e.detail)
    },
    
    onError(e) {
      console.error('视频播放错误:', e)
      uni.showToast({
        title: '视频播放失败',
        icon: 'none'
      })
      this.$emit('error', e)
    },
    
    onLoadedMetadata(e) {
      this.duration = e.detail.duration
      this.$emit('loadedmetadata', e.detail)
    },
    
    // 工具方法
    formatTime(seconds) {
      if (!seconds || seconds < 0) return '00:00'
      const m = Math.floor(seconds / 60)
      const s = Math.floor(seconds % 60)
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
  },
  beforeDestroy() {
    clearTimeout(this.controlsTimer)
    clearTimeout(this.speedLongPress)
  }
}
</script>

<style scoped>
.video-player-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
}

.video-element {
  width: 100%;
  height: 100%;
}

.control-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, 
    rgba(0,0,0,0.5) 0%, 
    transparent 20%, 
    transparent 80%, 
    rgba(0,0,0,0.5) 100%);
  transition: opacity 0.3s;
}

.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.video-title {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
}

.video-time {
  color: #fff;
  font-size: 14px;
}

.center-controls {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.play-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.play-btn text {
  color: #fff;
  font-size: 24px;
}

.bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
}

.progress-container {
  padding: 10px 0;
}

.progress-bar {
  position: relative;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.progress-played {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #fff;
  border-radius: 2px;
  transition: width 0.1s;
}

.progress-buffered {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}

.speed-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  padding: 10px 20px;
  border-radius: 20px;
}

.speed-text {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}

.volume-indicator {
  position: absolute;
  top: 50%;
  right: 50px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
}

.indicator-bar {
  width: 40px;
  height: 200px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  position: relative;
  overflow: hidden;
}

.indicator-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 20px;
  transition: height 0.1s;
}

.indicator-text {
  color: #fff;
  font-size: 14px;
  margin-left: 10px;
}

.gesture-hint {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  padding: 8px 16px;
  border-radius: 16px;
}

.hint-text {
  color: #fff;
  font-size: 14px;
}
</style>