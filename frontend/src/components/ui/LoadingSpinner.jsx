import './LoadingSpinner.css';

/**
 * LoadingSpinner Component
 */
const LoadingSpinner = ({ size = 'medium', className = '' }) => {
  const classes = ['spinner', `spinner-${size}`, className]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}></div>;
};

export default LoadingSpinner;

