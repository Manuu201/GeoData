# Proyecto React Native con Expo y SQLite

Este proyecto es una aplicación móvil desarrollada con React Native y Expo, que utiliza SQLite como base de datos local. Permite gestionar notas, fotos con ubicación y tablas dinámicas.

## 📁 Estructura del Proyecto

```bash
/my-app
│── /assets              # Imágenes y recursos estáticos
│── /components          # Componentes reutilizables
│── /database            # Lógica de la base de datos SQLite
│── /screens             # Pantallas principales de la app
│   ├── HomeScreen.tsx         # Listado de tablas y CRUD
│   ├── ProfileScreen.tsx      # CRUD de notas
│   ├── SettingsScreen.tsx     # Gestión de fotos y mapa
│   ├── TableEditorScreen.tsx  # Editor de tablas dinámicas
│── /navigation          # Configuración de la navegación
│── App.tsx              # Entrada principal de la app
│── database.ts          # Archivo principal de la base de datos
│── package.json         # Dependencias del proyecto
│── README.md            # Documentación del proyecto
```

### 2. **REQUISITOS.md** (Requisitos y ejecución del proyecto)

# Requisitos y Ejecución del Proyecto React Native con Expo y SQLite

## 🚀 Requisitos para ejecutar el proyecto

- **Node.js** (versión recomendada: >= 16)
- **Expo CLI** instalado globalmente:

### 3. **BASE_DE_DATOS.md** (Base de datos SQLite)

# Base de Datos SQLite

La base de datos se maneja en `database/database.ts`.  
Se crean y gestionan las siguientes tablas:

- `notes` → CRUD de notas.
- `photos` → Almacena fotos con coordenadas.
- `tables` → Permite gestionar tablas dinámicas.

# Funcionalidades Principales

- **Gestión de notas** en `ProfileScreen.tsx`.
- **Captura de fotos con ubicación** en `SettingsScreen.tsx`.
- **Visualización de fotos en un mapa** con `react-native-maps`.
- **Creación y edición de tablas dinámicas** en `HomeScreen.tsx` y `TableEditorScreen.tsx`.
- **Persistencia de datos** con SQLite.

# Dependencias Clave

- `react-navigation` → Manejo de navegación entre pantallas.
- `expo-sqlite` → Base de datos local.
- `expo-image-picker` → Selección de imágenes.
- `react-native-maps` → Visualización de mapas.
- `expo-location` → Obtención de coordenadas.

# Configuración de la Navegación

La navegación entre pantallas se gestiona mediante `react-navigation`.  
La configuración se encuentra en la carpeta `/navigation`.

# Componentes Reutilizables

Los componentes reutilizables se encuentran en la carpeta `/components`.  
Estos componentes son utilizados en las diferentes pantallas de la aplicación.


# Recursos Estáticos

La carpeta `/assets` contiene imágenes y otros recursos estáticos utilizados en la aplicación.

# Lógica de la Base de Datos

La lógica de la base de datos SQLite se encuentra en `/database/database.ts`.  
Este archivo contiene las funciones para crear, leer, actualizar y eliminar datos en las tablas `notes`, `photos` y `tables`.

## ▶️ Cómo ejecutar la aplicación

1. **Clonar el repositorio**

```sh
git clone https://github.com/Manuu201/GeoData.git
cd my-app
```
2. **Instalar las dependencias**
```sh
npm install
```
3. **Ejecutar Expo**
```sh
npx expo start
```
4. **Abrir la aplicación:**
En un emulador: Asegúrate de tener un emulador de Android o iOS configurado y en ejecución. Luego, presiona a (para Android) o i (para iOS) en la terminal donde se ejecuta Expo.


En un dispositivo físico: Escanea el código QR que aparece en la terminal con la app Expo Go (disponible en Android o iOS).


¡Listo! La aplicación se ejecutará en tu emulador o dispositivo físico.


### Notas adicionales:
- Asegúrate de tener **Node.js** instalado (versión recomendada >= 16).
- Si es la primera vez que usas Expo, instala **Expo CLI** globalmente con:
```sh
npm install -g expo-cli
```