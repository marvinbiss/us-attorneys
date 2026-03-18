import { ReactNode, useId, cloneElement, isValidElement } from 'react'
import { clsx } from 'clsx'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
  className?: string
  htmlFor?: string
}

export function FormField({
  label,
  required,
  error,
  hint,
  children,
  className,
  htmlFor,
}: FormFieldProps) {
  const generatedId = useId()
  const fieldId = htmlFor || generatedId
  const errorId = `${fieldId}-error`
  const hintId = `${fieldId}-hint`

  // Clone child element to add id and aria attributes if it's a valid element
  const childWithProps = isValidElement(children)
    ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        id: fieldId,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': error ? errorId : hint ? hintId : undefined,
      })
    : children

  return (
    <div className={clsx('space-y-1', className)}>
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {childWithProps}
      {error && <p id={errorId} className="text-sm text-red-600" role="alert">{error}</p>}
      {hint && !error && <p id={hintId} className="text-sm text-gray-500">{hint}</p>}
    </div>
  )
}
