import './Card.css';

/**
 * Card Component - Container component với shadow và border radius
 */
const Card = ({
  children,
  className = '',
  variant = 'default',
  padding = 'medium',
  ...props
}) => {
  const classes = [
    'card',
    `card-${variant}`,
    `card-padding-${padding}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;

