import * as eva from '@eva-design/eva';

export const lightTheme = {
  ...eva.light,
  colors: {
    ...eva.light.colors,
    primary: '#3366FF', // Color primario
    background: '#FFFFFF', // Fondo claro
    text: '#000000', // Texto oscuro
  },
};

export const darkTheme = {
  ...eva.dark,
  colors: {
    ...eva.dark.colors,
    primary: '#3366FF', // Color primario
    background: '#121212', // Fondo oscuro
    text: '#FFFFFF', // Texto claro
  },
};