'use client'

import { forwardRef, TextareaHTMLAttributes, useId } from 'react'
import { clsx } from 'clsx'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  containerClassName?: string
  showCount?: boolean
  maxLength?: number
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      containerClassName,
      className,
      disabled,
      required,
      id,
      showCount = false,
      maxLength,
      value,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const textareaId = id || generatedId
    const errorId = textareaId ? `${textareaId}-error` : undefined
    const hintId = textareaId ? `${textareaId}-hint` : undefined
    const currentLength = typeof value === 'string' ? value.length : 0

    return (
      <div className={clsx('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : hint ? hintId : undefined
            }
            maxLength={maxLength}
            value={value}
            className={clsx(
              'w-full rounded-lg border transition-all duration-200',
              'px-4 py-2.5 text-gray-900 placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'resize-none min-h-[120px]',
              error
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
              disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
              className
            )}
            {...props}
          />
          {showCount && maxLength && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {currentLength}/{maxLength}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1 text-sm text-gray-500">{hint}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
