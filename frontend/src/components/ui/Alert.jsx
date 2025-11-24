import './Alert.css';

/**
 * Alert Component - Hiển thị thông báo
 * @param {string} type - 'success' | 'error' | 'warning' | 'info'
 */
const Alert = ({ type = 'info', children, className = '', ...props }) => {
  const classes = ['alert', `alert-${type}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Alert;

