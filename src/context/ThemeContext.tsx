import React, { createContext, useState } from 'react';

export const ThemeContext = createContext({
  theme: 'light', // Tema por defecto
  toggleTheme: () => {}, // Función para alternar el tema
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};