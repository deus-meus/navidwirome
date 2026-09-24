import { create } from 'zustand'
import { audioManager } from '../audio/audioManager'
import subsonic from '../api/subsonic'

export const usePlayerStore = create((set, get) => {
  // Bind manager events to store
  audioManager.on('timeupdate', (time) => set({ currentTime: time }))
  audioManager.on('durationchange', (dur) => set({ duration: dur }))
  audioManager.on('playState', (playing) => set({ isPlaying: playing }))
  audioManager.on('volumechange', (vol) => set({ volume: vol }))
  audioManager.on('ended', () => get().playNext())

  return {
    currentTrack: null,
    queue: [],
    queueIndex: -1,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: audioManager.getVolume(),
    isShuffle: false,
    repeatMode: 'off', // 'off' | 'all' | 'one'

    playTrack: async (track, newQueue = null) => {
      const queue = newQueue || get().queue
      const index = queue.findIndex((t) => t.id === track.id)
      const streamUrl = subsonic.getStreamUrl(track.id)

      set({
        currentTrack: track,
        queue: queue.length > 0 ? queue : [track],
        queueIndex: index !== -1 ? index : 0,
        isPlaying: true,
      })

      await audioManager.play(streamUrl)
    },

    togglePlay: async () => {
      const { isPlaying, currentTrack, queue } = get()
      if (!currentTrack && queue.length > 0) {
        await get().playTrack(queue[0])
        return
      }
      if (isPlaying) {
        audioManager.pause()
      } else {
        await audioManager.play()
      }
    },

    seek: (seconds) => {
      audioManager.seek(seconds)
      set({ currentTime: seconds })
    },

    setVolume: (vol) => {
      audioManager.setVolume(vol)
    },

    playNext: async () => {
      const { queue, queueIndex, repeatMode, isShuffle } = get()
      if (queue.length === 0) return

      if (repeatMode === 'one' && get().currentTrack) {
        audioManager.seek(0)
        await audioManager.play()
        return
      }

      let nextIndex = queueIndex + 1
      if (isShuffle) {
        nextIndex = Math.floor(Math.random() * queue.length)
      } else if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0
        } else {
          audioManager.pause()
          set({ isPlaying: false, currentTime: 0 })
          return
        }
      }

      const nextTrack = queue[nextIndex]
      if (nextTrack) {
        await get().playTrack(nextTrack, queue)
      }
    },

    addToQueue: (track) => {
      if (!track) return
      set((state) => ({
        queue: [...state.queue, track],
        queueIndex: state.queueIndex === -1 ? 0 : state.queueIndex,
      }))
    },

    removeFromQueue: (index) =>
      set((state) => {
        const newQueue = state.queue.filter((_, i) => i !== index)
        let newIndex = state.queueIndex
        if (index < state.queueIndex) {
          newIndex = Math.max(0, state.queueIndex - 1)
        } else if (newIndex >= newQueue.length) {
          newIndex = Math.max(0, newQueue.length - 1)
        }
        return { queue: newQueue, queueIndex: newIndex }
      }),

    clearQueue: () =>
      set((state) => ({
        queue: state.currentTrack ? [state.currentTrack] : [],
        queueIndex: state.currentTrack ? 0 : -1,
      })),

    playPrev: async () => {
      const { queue, queueIndex, currentTime } = get()
      if (currentTime > 3) {
        audioManager.seek(0)
        return
      }
      const prevIndex = queueIndex - 1
      if (prevIndex >= 0 && queue[prevIndex]) {
        await get().playTrack(queue[prevIndex], queue)
      } else {
        audioManager.seek(0)
      }
    },

    toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),

    toggleRepeat: () =>
      set((state) => {
        const modes = ['off', 'all', 'one']
        const next = modes[(modes.indexOf(state.repeatMode) + 1) % modes.length]
        return { repeatMode: next }
      }),
  }
})
