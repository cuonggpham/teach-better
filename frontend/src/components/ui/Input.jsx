import './Input.css';

/**
 * Input Component - Reusable input với validation states
 */
const Input = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const { as, type, ...inputProps } = props;
  const isTextarea = as === 'textarea' || type === 'textarea';

  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      {isTextarea ? (
        <textarea
          id={inputId}
          className={`input-field ${error ? 'input-error' : ''}`}
          {...inputProps}
        />
      ) : (
        <input
          id={inputId}
          className={`input-field ${error ? 'input-error' : ''}`}
          {...inputProps}
        />
      )}
      {error && <span className="input-error-message">{error}</span>}
      {helperText && !error && (
        <span className="input-helper-text">{helperText}</span>
      )}
    </div>
  );
};

export default Input;

