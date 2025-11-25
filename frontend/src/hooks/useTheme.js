import { useContext } from 'react';
import ThemeContext from '../contexts/ThemeContext';

/**
 * Custom hook to use ThemeContext
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
