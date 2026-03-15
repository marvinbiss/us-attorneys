'use client'

import { useState, useRef, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

export interface VideoPlayerProps {
  src: string
  poster?: string
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  className?: string
  onEnded?: () => void
}

export default function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  muted = false,
  loop = false,
  className,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(muted)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return

    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }, [isMuted])

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return

    const current = videoRef.current.currentTime
    const total = videoRef.current.duration
    setProgress((current / total) * 100)
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (!videoRef.current) return

    setDuration(videoRef.current.duration)
    setIsLoading(false)
  }, [])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    videoRef.current.currentTime = percentage * videoRef.current.duration
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen()
    }
  }, [])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative group bg-black rounded-2xl overflow-hidden',
        className
      )}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={onEnded}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Play button overlay (when paused) */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
        >
          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Controls */}
      <div
        className={clsx(
          'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4',
          'transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Progress bar */}
        <div
          className="h-1 bg-white/30 rounded-full cursor-pointer mb-3"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" fill="currentColor" />
            ) : (
              <Play className="w-5 h-5 text-white" fill="currentColor" />
            )}
          </button>

          <button
            onClick={toggleMute}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>

          <div className="text-sm text-white/90 font-medium">
            {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
          </div>

          <div className="flex-1" />

          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Fullscreen"
          >
            <Maximize className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
