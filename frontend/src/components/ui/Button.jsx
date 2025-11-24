import './Button.css';

/**
 * Button Component - Reusable button với nhiều variants
 * @param {string} variant - 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'
 * @param {string} size - 'small' | 'medium' | 'large'
 * @param {boolean} disabled - Trạng thái disabled
 * @param {boolean} loading - Hiển thị loading state
 * @param {React.ReactNode} children - Nội dung button
 * @param {React.ComponentType} as - Component hoặc element để render (ví dụ: Link)
 */
const Button = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  children,
  className = '',
  as: Component = 'button',
  ...props
}) => {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    loading && 'btn-loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const isButton = Component === 'button';
  const buttonProps = isButton
    ? { disabled: disabled || loading, type: props.type || 'button' }
    : {};

  return (
    <Component
      className={classes}
      {...buttonProps}
      {...props}
    >
      {loading && <span className="btn-spinner"></span>}
      <span className={loading ? 'btn-content-loading' : ''}>{children}</span>
    </Component>
  );
};

export default Button;

