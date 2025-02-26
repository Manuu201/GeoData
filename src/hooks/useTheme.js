import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as eva from '@eva-design/eva';
import { lightTheme, darkTheme } from '../theme/theme'; // Importa tus temas personalizados

export const useTheme = () => {
  const [theme, setTheme] = useState('light'); // Tema por defecto

  // Cargar el tema guardado al iniciar la app
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme);
      }
    };
    loadTheme();
  }, []);

  // Cambiar el tema y guardarlo en AsyncStorage
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  // Retornar el tema actual y la función para cambiarlo
  return {
    theme: theme === 'light' ? { ...eva.light, ...lightTheme } : { ...eva.dark, ...darkTheme },
    toggleTheme,
    isDark: theme === 'dark',
  };
};