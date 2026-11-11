import React from 'react';
import styles from './FormField.module.css';

/**
 * Accessible form field: label + input/textarea + error message.
 * type: 'text' | 'email' | 'password' | 'textarea'
 */
export default function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  rows = 6,
  hint,
  ...rest
}) {
  const isTextarea = type === 'textarea';
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            {' '}*
          </span>
        )}
      </label>

      {hint && <p id={`${id}-hint`} className={styles.hint}>{hint}</p>}

      {isTextarea ? (
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          required={required}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          className={[styles.input, error ? styles.inputError : ''].filter(Boolean).join(' ')}
          {...rest}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          className={[styles.input, error ? styles.inputError : ''].filter(Boolean).join(' ')}
          {...rest}
        />
      )}

      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
