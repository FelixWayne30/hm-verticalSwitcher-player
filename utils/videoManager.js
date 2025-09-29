// utils/videoManager.js
// 管理播放列表与其视频，持久化到本地 storage（沙箱模式）
// 数据结构：
// playlists: [{ id, name, videos: [{id, name, path, url, size, created}] }]

const STORAGE_KEY = 'VIDEO_MANAGER_PLAYLISTS'

class VideoManager {
  constructor() {
    this.playlists = []
    this.currentIndex = 0
    this.load()
  }

  // load from storage
  load() {
    try {
      const raw = uni.getStorageSync(STORAGE_KEY)
      if (raw) {
        this.playlists = raw
      } else {
        this.playlists = []
      }
    } catch (e) {
      console.error('VideoManager.load error', e)
      this.playlists = []
    }
  }

  // persist to storage
  save() {
    try {
      uni.setStorageSync(STORAGE_KEY, this.playlists)
    } catch (e) {
      console.error('VideoManager.save error', e)
    }
  }

  // generate id
  genId(prefix = '') {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  }

  // 获取所有播放列表
  getPlaylists() {
    return this.playlists.slice()
  }

  // 添加播放列表
  addPlaylist(name) {
    const id = this.genId('pl_')
    const pl = { id, name: name || `列表-${this.playlists.length + 1}`, videos: [] }
    this.playlists.push(pl)
    this.save()
    return pl
  }

  // 删除播放列表（可选是否删除其视频副本 - 这里只移除列表元数据，不删除沙箱文件）
  removePlaylist(listId) {
    const idx = this.playlists.findIndex(p => p.id === listId)
    if (idx !== -1) {
      this.playlists.splice(idx, 1)
      this.save()
      return true
    }
    return false
  }

  // 重命名播放列表
  renamePlaylist(listId, newName) {
    const p = this.playlists.find(x => x.id === listId)
    if (p) {
      p.name = newName
      this.save()
      return true
    }
    return false
  }

  // 获取某列表的视频数组（引用副本）
  getVideos(listId) {
    const p = this.playlists.find(x => x.id === listId)
    return p ? p.videos.slice() : []
  }

  // 添加视频对象到某列表（videoObj: {name, path, url, size}），会为其生成 id & created
  addVideoToPlaylist(listId, videoObj) {
    const p = this.playlists.find(x => x.id === listId)
    if (!p) return false
    const v = {
      id: this.genId('v_'),
      name: videoObj.name || (videoObj.path ? videoObj.path.split('/').pop() : 'video'),
      path: videoObj.path,
      url: videoObj.url || videoObj.path,
      size: videoObj.size || 0,
      created: Date.now()
    }
    p.videos.push(v)
    this.save()
    return v
  }

  // 移除列表中的某个视频（只移除 metadata，不删除沙箱文件）
  removeVideoFromPlaylist(listId, videoId) {
    const p = this.playlists.find(x => x.id === listId)
    if (!p) return false
    const idx = p.videos.findIndex(v => v.id === videoId)
    if (idx !== -1) {
      p.videos.splice(idx, 1)
      this.save()
      return true
    }
    return false
  }

  // 设置当前 index (用于 player)
  setCurrentIndex(index) {
    this.currentIndex = index
  }

  // get current video for a given list
  getCurrentVideo(listId) {
    const videos = this.getVideos(listId)
    if (!videos || videos.length === 0) return null
    const idx = Math.max(0, Math.min(this.currentIndex, videos.length - 1))
    return videos[idx]
  }

  // get next/prev video for given list (also advances internal index)
  getNext(listId) {
    const videos = this.getVideos(listId)
    if (!videos || videos.length === 0) return null
    this.currentIndex = (this.currentIndex + 1) % videos.length
    return videos[this.currentIndex]
  }

  getPrev(listId) {
    const videos = this.getVideos(listId)
    if (!videos || videos.length === 0) return null
    this.currentIndex = (this.currentIndex - 1 + videos.length) % videos.length
    return videos[this.currentIndex]
  }
}

export default new VideoManager()
