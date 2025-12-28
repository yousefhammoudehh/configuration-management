import './FormField.css'
import { CSSProperties, ReactNode } from 'react'

interface FormFieldProps {
  label?: ReactNode
  required?: boolean
  error?: string
  className?: string
  style?: CSSProperties
  children: ReactNode
}

export function FormField({ label, required = false, error, className = '', style, children }: FormFieldProps) {
  return (
    <div className={`form-field ${className}`} style={style}>
      {label !== undefined && (
        <label className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}
