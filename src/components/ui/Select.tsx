'use client'

import { forwardRef, SelectHTMLAttributes, ReactNode, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
  leftIcon?: ReactNode
  containerClassName?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder,
      leftIcon,
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
    const selectId = id || generatedId
    const errorId = selectId ? `${selectId}-error` : undefined
    const hintId = selectId ? `${selectId}-hint` : undefined

    return (
      <div className={clsx('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
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
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            className={clsx(
              'w-full appearance-none rounded-lg border transition-all duration-200',
              'px-4 py-2.5 pr-10 text-gray-900 dark:text-gray-100',
              'bg-white dark:bg-gray-800',
              'focus:outline-none focus:ring-2 focus:ring-offset-0 dark:focus:ring-offset-gray-900',
              leftIcon && 'pl-10',
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-400',
              disabled && 'cursor-not-allowed bg-gray-100 opacity-60 dark:bg-gray-700',
              !props.value && 'text-gray-400 dark:text-gray-500',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
            <ChevronDown className="h-5 w-5" />
          </div>
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

Select.displayName = 'Select'

export default Select
