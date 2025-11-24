import './Container.css';

/**
 * Container Component - Layout wrapper với max-width
 */
const Container = ({
  children,
  className = '',
  size = 'large',
  ...props
}) => {
  const classes = ['container', `container-${size}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Container;

