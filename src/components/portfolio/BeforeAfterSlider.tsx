'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { clsx } from 'clsx'
import Image from 'next/image'

export interface BeforeAfterSliderProps {
  beforeImage: string
  afterImage: string
  beforeAlt?: string
  afterAlt?: string
  initialPosition?: number
  className?: string
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeAlt = 'Before',
  afterAlt = 'After',
  initialPosition = 50,
  className,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setPosition(percentage)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    updatePosition(e.clientX)
  }, [updatePosition])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true)
    updatePosition(e.touches[0].clientX)
  }, [updatePosition])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      updatePosition(e.clientX)
    }

    const handleTouchMove = (e: TouchEvent) => {
      updatePosition(e.touches[0].clientX)
    }

    const handleEnd = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleEnd)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleEnd)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleEnd)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging, updatePosition])

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative w-full aspect-[4/3] rounded-2xl overflow-hidden select-none cursor-ew-resize',
        className
      )}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* After image (background) */}
      <div className="absolute inset-0">
        <Image
          src={afterImage}
          alt={afterAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          draggable={false}
        />
      </div>

      {/* Before image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image
          src={beforeImage}
          alt={beforeAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          draggable={false}
        />
      </div>

      {/* Slider line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        {/* Handle */}
        <div
          className={clsx(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-10 h-10 rounded-full bg-white shadow-lg',
            'flex items-center justify-center',
            'transition-transform duration-150',
            isDragging && 'scale-110'
          )}
        >
          <div className="flex items-center gap-0.5">
            <svg
              className="w-3 h-3 text-gray-600 rotate-180"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <svg
              className="w-3 h-3 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/70 text-white text-sm font-medium rounded-lg">
        Before
      </div>
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 text-white text-sm font-medium rounded-lg">
        After
      </div>
    </div>
  )
}
