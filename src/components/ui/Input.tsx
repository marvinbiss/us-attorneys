'use client'

import { forwardRef, InputHTMLAttributes, ReactNode, useId } from 'react'
import { clsx } from 'clsx'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  containerClassName?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      containerClassName,
      className,
      disabled,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = id || generatedId
    const errorId = inputId ? `${inputId}-error` : undefined
    const hintId = inputId ? `${inputId}-hint` : undefined

    return (
      <div className={clsx('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            className={clsx(
              'w-full rounded-lg border transition-all duration-200',
              'px-4 py-2.5 text-gray-900 placeholder-gray-400 dark:text-gray-100 dark:placeholder-gray-500',
              'bg-white dark:bg-gray-800',
              'focus:outline-none focus:ring-2 focus:ring-offset-0 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-900',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-400',
              disabled && 'cursor-not-allowed bg-gray-100 opacity-60 dark:bg-gray-700',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
