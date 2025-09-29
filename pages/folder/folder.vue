<template>
  <view class="page">
    <view class="toolbar">
      <picker mode="selector" :range="playlistNames" :value="pickerIndex" @change="onPick">
        <view class="picker">目标列表: {{ selectedListName || '请选择' }}</view>
      </picker>

      <button @click="openCreateList">新建列表</button>
      <button @click="chooseVideo">从相册导入</button>
      <button @click="chooseFile">从文件导入</button>
      <button @click="refresh">刷新当前列表</button>
    </view>

    <view class="list-area">
      <text class="section-title">列表：{{ selectedListName || '无' }}</text>
      <view v-if="videos.length > 0" class="video-list">
        <view v-for="(v, idx) in videos" :key="v.id" class="video-item">
          <text class="name">{{ v.name }}</text>
          <view class="ops">
            <button @click="playOne(idx)">播放</button>
            <button @click="removeOne(v.id)">删除</button>
          </view>
        </view>
      </view>
      <view v-else class="empty">当前列表为空</view>
    </view>

    <!-- 新建列表弹窗 -->
    <view v-if="showCreate" class="modal">
      <view class="modal-content">
        <text>新建列表</text>
        <input v-model="newListName" placeholder="输入名称" />
        <view class="modal-actions">
          <button @click="doCreateList">确定</button>
          <button @click="showCreate=false">取消</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import videoManager from '@/utils/videoManager.js'

export default {
  data() {
    return {
      playlists: [],
      pickerIndex: 0,
      selectedListId: null,
      selectedListName: '',
      videos: [],
      showCreate: false,
      newListName: ''
    }
  },
  onShow() {
    this.loadPlaylists()
  },
  computed: {
    playlistNames() {
      return this.playlists.map(p => p.name)
    }
  },
  methods: {
    loadPlaylists() {
      this.playlists = videoManager.getPlaylists()
      if (this.playlists.length > 0) {
        // 保持 pickerIndex 在范围内
        if (this.pickerIndex >= this.playlists.length) this.pickerIndex = 0
        this.setSelected(this.pickerIndex)
      } else {
        this.selectedListId = null
        this.selectedListName = ''
        this.videos = []
      }
    },
    setSelected(idx) {
      const p = this.playlists[idx]
      if (p) {
        this.selectedListId = p.id
        this.selectedListName = p.name
        this.pickerIndex = idx
        this.videos = videoManager.getVideos(p.id)
      }
    },
    onPick(e) {
      const idx = e.detail.value
      this.setSelected(idx)
    },
    openCreateList() {
      this.showCreate = true
      this.newListName = ''
    },
    doCreateList() {
      const name = (this.newListName || '').trim()
      if (!name) {
        uni.showToast({ title: '请输入名称', icon: 'none' })
        return
      }
      const p = videoManager.addPlaylist(name)
      this.showCreate = false
      this.loadPlaylists()
      // 选择刚创建的
      const idx = this.playlists.findIndex(x => x.id === p.id)
      if (idx !== -1) this.setSelected(idx)
    },

    // 选择相册导入
    chooseVideo() {
      if (!this.selectedListId) {
        uni.showToast({ title: '请选择目标列表', icon: 'none' })
        return
      }
      uni.chooseVideo({
        sourceType: ['album'],
        success: (res) => this.saveAndAdd(res.tempFilePath),
        fail: (err) => console.error('chooseVideo fail', err)
      })
    },

    // 从文件导入（支持更多来源）
    chooseFile() {
      if (!this.selectedListId) {
        uni.showToast({ title: '请选择目标列表', icon: 'none' })
        return
      }
      uni.chooseFile({
        count: 1,
        type: 'video',
        success: (res) => {
          const file = res.tempFiles[0]
          this.saveAndAdd(file.path)
        },
        fail: (err) => console.error('chooseFile fail', err)
      })
    },

    // 保存到沙箱并加入播放列表
    saveAndAdd(tempPath) {
      uni.showLoading({ title: '导入中...' })
      uni.saveFile({
        tempFilePath: tempPath,
        success: (saveRes) => {
          uni.hideLoading()
          const saved = saveRes.savedFilePath
          const obj = { name: saved.split('/').pop(), path: saved, url: saved }
          const v = videoManager.addVideoToPlaylist(this.selectedListId, obj)
          if (v) {
            uni.showToast({ title: '导入成功', icon: 'success' })
            this.videos = videoManager.getVideos(this.selectedListId)
          } else {
            uni.showToast({ title: '导入失败', icon: 'none' })
          }
        },
        fail: (err) => {
          uni.hideLoading()
          console.error('saveFile fail', err)
          uni.showToast({ title: '保存失败', icon: 'none' })
        }
      })
    },

    refresh() {
      if (!this.selectedListId) return
      this.videos = videoManager.getVideos(this.selectedListId)
    },

    playOne(idx) {
      videoManager.setCurrentIndex(idx)
      uni.navigateTo({ url: `/pages/tiktok/tiktokPlayer?listId=${this.selectedListId}&start=${idx}` })
    },

    removeOne(videoId) {
      uni.showModal({
        title: '删除视频',
        content: '从当前列表删除该视频？（不会删除沙箱文件）',
        success: (res) => {
          if (res.confirm) {
            videoManager.removeVideoFromPlaylist(this.selectedListId, videoId)
            this.videos = videoManager.getVideos(this.selectedListId)
            uni.showToast({ title: '已移除', icon: 'success' })
          }
        }
      })
    }
  }
}
</script>

<style>
.page { padding: 20rpx; }
.toolbar { display:flex; gap:10rpx; flex-wrap:wrap; margin-bottom:12rpx; }
.picker { padding:10rpx; background:#fff; border-radius:6rpx; }
.list-area { margin-top:16rpx; }
.section-title { font-weight:bold; margin-bottom:8rpx; }
.video-list { display:flex; flex-direction:column; gap:10rpx; }
.video-item { padding:10rpx; background:#fff; border-radius:6rpx; display:flex; justify-content:space-between; align-items:center; }
.name { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ops { display:flex; gap:8rpx; }
.empty { color:#888; text-align:center; margin-top:20rpx; }

/* modal */
.modal { position:fixed; left:0; right:0; top:0; bottom:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; }
.modal-content { background:#fff; padding:24rpx; width:86%; border-radius:8rpx; }
.modal-actions { display:flex; justify-content:space-between; margin-top:12rpx; }
</style>
