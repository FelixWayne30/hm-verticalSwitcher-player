<template>
  <view class="player-container">
    <!-- 视频滑动容器 -->
    <swiper
      class="video-swiper"
      vertical
      :current="currentIndex"
      @change="onChange"
      :indicator-dots="false"
      :circular="false"
      :autoplay="false"
      :duration="300"
    >
      <swiper-item 
        v-for="(v, idx) in videos" 
        :key="v.id" 
        class="swiper-item"
      >
        <video
          :id="'video_' + v.id"
          :src="v.url"
          :autoplay="idx === currentIndex"
          :loop="true"
          :show-center-play-btn="false"
          :controls="false"
          :enable-progress-gesture="false"
          object-fit="cover"
          class="video-element"
          @play="onVideoPlay(idx)"
          @pause="onVideoPause(idx)"
          @ended="onVideoEnded(idx)"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        />

        <!-- 手势提示遮罩 -->
        <view 
          class="gesture-overlay"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
          <!-- 左侧慢速区域 -->
          <view class="speed-zone left" :class="{ active: isLeftPressed }">
            <view class="zone-hint" v-if="isLeftPressed">
              <view class="hint-arrows left-arrows">
                <view class="arrow-item"></view>
                <view class="arrow-item"></view>
              </view>
              <text class="hint-text">慢速</text>
              <text class="hint-speed">{{ currentSpeed }}×</text>
            </view>
          </view>

          <!-- 右侧倍速区域 -->
          <view class="speed-zone right" :class="{ active: isRightPressed }">
            <view class="zone-hint" v-if="isRightPressed">
              <text class="hint-speed">{{ currentSpeed }}×</text>
              <text class="hint-text">快速</text>
              <view class="hint-arrows right-arrows">
                <view class="arrow-item"></view>
                <view class="arrow-item"></view>
              </view>
            </view>
          </view>
        </view>

        <!-- 简化的倍速指示器 - 只显示圆形和倍速值 -->
        <view class="speed-indicator" v-if="currentSpeed !== 1">
          <view class="speed-circle">
            <text class="speed-value">{{ currentSpeed }}</text>
            <text class="speed-unit">×</text>
          </view>
        </view>

        <!-- 播放/暂停中心按钮 -->
        <view 
          class="play-pause-btn" 
          v-show="showPlayBtn && !isPressing"
          @click="togglePlay"
        >
          <view class="play-pause-icon" :class="{ playing: isPlaying }"></view>
        </view>
      </swiper-item>
    </swiper>
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
      isPlaying: false,
      showPlayBtn: false,
      
      // 手势控制
      touchStartX: 0,
      touchStartY: 0,
      touchStartTime: 0,
      isPressing: false,
      isLeftPressed: false,
      isRightPressed: false,
      longPressTimer: null,
      
      // 倍速控制
      currentSpeed: 1,
      allSpeedSteps: [0.25, 0.5, 1, 2, 3, 4],
      currentSpeedIndex: 2,
      speedMode: null,
      
      // 控制栏自动隐藏
      playBtnTimer: null
    }
  },
  onLoad(options) {
    this.listId = options.listId
    const start = parseInt(options.start || '0')
    this.loadList()
    this.currentIndex = isNaN(start) ? 0 : Math.max(0, Math.min(start, this.videos.length - 1))
    
    // 设置全屏和隐藏状态栏
    this.setFullScreen()
  },
  onReady() {
    this.setFullScreen()
  },
  onShow() {
    this.loadList()
    this.$nextTick(() => {
      this.playVideo(this.currentIndex)
    })
    this.setFullScreen()
  },
  onHide() {
    this.pauseAllVideos()
    this.restoreStatusBar()
  },
  onUnload() {
    this.restoreStatusBar()
  },
  methods: {
    setFullScreen() {
      // #ifdef APP-PLUS
      try {
        const currentWebview = plus.webview.currentWebview()
        if (currentWebview) {
          // 设置全屏沉浸式窗口
          currentWebview.setStyle({
            statusbar: {
              background: '#000000'
            },
            // 隐藏标题栏
            titleNView: false
          })
        }
        
        // 鸿蒙和Android平台设置全屏
        if (plus.navigator) {
          // 设置全屏模式
          if (plus.navigator.setFullscreen) {
            plus.navigator.setFullscreen(true)
          }
          
          // 设置状态栏为深色模式（白色图标和文字）
          if (plus.navigator.setStatusBarStyle) {
            plus.navigator.setStatusBarStyle('dark')
          }
          
          // 设置状态栏背景为黑色
          if (plus.navigator.setStatusBarBackground) {
            plus.navigator.setStatusBarBackground('#000000')
          }
        }
      } catch (e) {
        console.log('setFullScreen error:', e)
      }
      // #endif
    },
    
    restoreStatusBar() {
      // #ifdef APP-PLUS
      try {
        // 取消全屏
        if (plus.navigator && plus.navigator.setFullscreen) {
          plus.navigator.setFullscreen(false)
        }
        
        // 恢复状态栏样式为浅色（深色图标和文字）
        if (plus.navigator && plus.navigator.setStatusBarStyle) {
          plus.navigator.setStatusBarStyle('light')
        }
        
        // 恢复状态栏背景为白色
        if (plus.navigator && plus.navigator.setStatusBarBackground) {
          plus.navigator.setStatusBarBackground('#FFFFFF')
        }
      } catch (e) {
        console.log('restoreStatusBar error:', e)
      }
      // #endif
    },
    
    loadList() {
      this.videos = videoManager.getVideos(this.listId)
    },

    onChange(e) {
      const idx = e.detail.current
      if (idx !== this.currentIndex) {
        this.pauseAllVideos()
        this.currentIndex = idx
        this.$nextTick(() => {
          this.playVideo(idx)
        })
      }
    },

    playVideo(idx) {
      if (idx < 0 || idx >= this.videos.length) return
      
      const v = this.videos[idx]
      const ctx = uni.createVideoContext(`video_${v.id}`, this)
      
      setTimeout(() => {
        ctx.play()
        this.isPlaying = true
      }, 100)
    },

    pauseAllVideos() {
      this.videos.forEach((v) => {
        try {
          const ctx = uni.createVideoContext(`video_${v.id}`, this)
          ctx.pause()
        } catch (e) {
          console.error('pause error', e)
        }
      })
      this.isPlaying = false
    },

    togglePlay() {
      const v = this.videos[this.currentIndex]
      if (!v) return
      
      const ctx = uni.createVideoContext(`video_${v.id}`, this)
      if (this.isPlaying) {
        ctx.pause()
        this.isPlaying = false
      } else {
        ctx.play()
        this.isPlaying = true
      }
      this.showPlayBtn = !this.isPlaying
      this.resetPlayBtnTimer()
    },

    handleTouchStart(e) {
      const touch = e.touches[0]
      this.touchStartX = touch.pageX
      this.touchStartY = touch.pageY
      this.touchStartTime = Date.now()
      this.isPressing = false
      
      const screenWidth = uni.getSystemInfoSync().windowWidth
      const zone = this.touchStartX < screenWidth / 2 ? 'left' : 'right'
      
      this.longPressTimer = setTimeout(() => {
        this.startSpeedControl(zone)
      }, 200)
      
      this.showPlayBtn = false
    },

    handleTouchMove(e) {
      const touch = e.touches[0]
      const deltaX = touch.pageX - this.touchStartX
      const deltaY = touch.pageY - this.touchStartY
      
      if (Math.abs(deltaY) > 50) {
        this.cancelSpeedControl()
        return
      }
      
      if (this.isPressing && Math.abs(deltaX) > 40) {
        if (deltaX < 0) {
          this.switchSpeedGear(-1)
        } else {
          this.switchSpeedGear(1)
        }
        this.touchStartX = touch.pageX
      }
    },

    handleTouchEnd(e) {
      clearTimeout(this.longPressTimer)
      
      const touchDuration = Date.now() - this.touchStartTime
      
      if (touchDuration < 200 && !this.isPressing) {
        this.showPlayBtn = true
        this.togglePlay()
      }
      
      this.endSpeedControl()
    },

    startSpeedControl(zone) {
      this.isPressing = true
      this.speedMode = zone
      
      if (zone === 'left') {
        this.isLeftPressed = true
        this.currentSpeedIndex = 1
      } else {
        this.isRightPressed = true
        this.currentSpeedIndex = 3
      }
      
      this.currentSpeed = this.allSpeedSteps[this.currentSpeedIndex]
      this.setVideoSpeed(this.currentSpeed)
      this.vibrate()
    },

    switchSpeedGear(direction) {
      const newIndex = this.currentSpeedIndex + direction
      
      if (newIndex >= 0 && newIndex < this.allSpeedSteps.length) {
        if (this.speedMode === 'left' && newIndex <= 1) {
          this.currentSpeedIndex = newIndex
          this.currentSpeed = this.allSpeedSteps[newIndex]
          this.setVideoSpeed(this.currentSpeed)
          this.vibrate()
        }
        else if (this.speedMode === 'right' && newIndex >= 3 && newIndex <= 5) {
          this.currentSpeedIndex = newIndex
          this.currentSpeed = this.allSpeedSteps[newIndex]
          this.setVideoSpeed(this.currentSpeed)
          this.vibrate()
        }
      }
    },

    endSpeedControl() {
      if (this.isPressing) {
        this.currentSpeed = 1
        this.currentSpeedIndex = 2
        this.setVideoSpeed(1)
        this.isPressing = false
        this.isLeftPressed = false
        this.isRightPressed = false
        this.speedMode = null
      }
    },

    cancelSpeedControl() {
      clearTimeout(this.longPressTimer)
      this.endSpeedControl()
    },

    setVideoSpeed(speed) {
      const v = this.videos[this.currentIndex]
      if (!v) return
      
      const ctx = uni.createVideoContext(`video_${v.id}`, this)
      ctx.playbackRate(speed)
    },

    vibrate() {
      try {
        if (uni.vibrateShort) {
          uni.vibrateShort({ type: 'light' })
        }
      } catch (e) {
        console.log('vibrate not supported')
      }
    },

    resetPlayBtnTimer() {
      clearTimeout(this.playBtnTimer)
      this.playBtnTimer = setTimeout(() => {
        this.showPlayBtn = false
      }, 2000)
    },

    onVideoPlay(idx) {
      if (idx === this.currentIndex) {
        this.isPlaying = true
      }
    },

    onVideoPause(idx) {
      if (idx === this.currentIndex) {
        this.isPlaying = false
      }
    },

    onVideoEnded(idx) {
      if (idx === this.currentIndex && idx < this.videos.length - 1) {
        setTimeout(() => {
          this.currentIndex = idx + 1
          this.playVideo(this.currentIndex)
        }, 300)
      }
    }
  },
  
  beforeDestroy() {
    clearTimeout(this.longPressTimer)
    clearTimeout(this.playBtnTimer)
    this.restoreStatusBar()
  }
}
</script>

<style scoped>
.player-container {
  width: 100vw;
  height: 100vh;
  background: #000;
  position: relative;
  overflow: hidden;
}

.video-swiper {
  width: 100%;
  height: 100%;
}

.swiper-item {
  width: 100%;
  height: 100%;
  position: relative;
}

.video-element {
  width: 100%;
  height: 100%;
  background: #000;
}

/* 手势遮罩层 */
.gesture-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  z-index: 10;
  pointer-events: auto;
}

.speed-zone {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}

.speed-zone.left {
  justify-content: flex-start;
  padding-left: 80rpx;
}

.speed-zone.right {
  justify-content: flex-end;
  padding-right: 80rpx;
}

.speed-zone.active {
  background: rgba(0, 0, 0, 0.3);
}

.zone-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

.hint-arrows {
  display: flex;
  gap: 8rpx;
}

.arrow-item {
  width: 24rpx;
  height: 24rpx;
  position: relative;
}

.arrow-item::before {
  content: '';
  position: absolute;
  width: 20rpx;
  height: 20rpx;
  border-left: 4rpx solid #FFFFFF;
  border-bottom: 4rpx solid #FFFFFF;
  top: 50%;
  left: 50%;
}

.left-arrows .arrow-item::before {
  transform: translate(-30%, -50%) rotate(45deg);
}

.right-arrows .arrow-item::before {
  transform: translate(-70%, -50%) rotate(-135deg);
}

.hint-text {
  font-size: 24rpx;
  color: #FFFFFF;
  font-weight: 500;
}

.hint-speed {
  font-size: 40rpx;
  color: #FFFFFF;
  font-weight: 700;
}

/* 简化的倍速指示器 - 只保留圆形显示 */
.speed-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 20;
  pointer-events: none;
  animation: scaleIn 0.2s ease;
}

@keyframes scaleIn {
  from { 
    opacity: 0; 
    transform: translate(-50%, -50%) scale(0.8); 
  }
  to { 
    opacity: 1; 
    transform: translate(-50%, -50%) scale(1); 
  }
}

.speed-circle {
  width: 180rpx;
  height: 180rpx;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(30rpx);
  border-radius: 90rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.5);
}

.speed-value {
  font-size: 56rpx;
  font-weight: 700;
  color: #FFFFFF;
}

.speed-unit {
  font-size: 32rpx;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  margin-left: 4rpx;
}

/* 播放/暂停按钮 */
.play-pause-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140rpx;
  height: 140rpx;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  border-radius: 70rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 15;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
}

.play-pause-icon {
  position: relative;
  width: 48rpx;
  height: 48rpx;
}

.play-pause-icon::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-40%, -50%);
  width: 0;
  height: 0;
  border-left: 36rpx solid #000;
  border-top: 24rpx solid transparent;
  border-bottom: 24rpx solid transparent;
}

.play-pause-icon.playing::before {
  border: none;
  width: 10rpx;
  height: 40rpx;
  background: #000;
  border-radius: 2rpx;
  transform: translate(-200%, -50%);
}

.play-pause-icon.playing::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 10rpx;
  height: 40rpx;
  background: #000;
  border-radius: 2rpx;
  transform: translate(100%, -50%);
}
</style>