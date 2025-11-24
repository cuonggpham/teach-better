import { useState } from 'react';
import './NotificationIcon.css';

const NotificationIcon = () => {
  const [unreadCount] = useState(3); // Mock data for testing
  const [isOpen, setIsOpen] = useState(false);

  console.log('NotificationIcon rendering...'); // Debug log

  const handleToggle = () => {
    console.log('Button clicked!'); // Debug log
    setIsOpen(!isOpen);
  };

  return (
    <div className="notification-container">
      <button 
        className="notification-button"
        onClick={handleToggle}
        aria-label="Notifications"
        style={{
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          position: 'relative',
          zIndex: 100,
          fontSize: '24px'
        }}
      >
        <span style={{ color: '#fbbf24', fontSize: '28px', lineHeight: 1 }}>🔔</span>
        
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            minWidth: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'white',
            background: '#ef4444',
            borderRadius: '10px',
            border: '2px solid white'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          width: '300px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          border: '1px solid #ccc',
          zIndex: 1000,
          marginTop: '8px',
          padding: '16px'
        }}>
          <h3 style={{ margin: '0 0 12px 0' }}>Thông báo</h3>
          <p style={{ margin: 0, color: '#666' }}>Chưa có thông báo nào</p>
        </div>
      )}
    </div>
  );
};

export default NotificationIcon;
