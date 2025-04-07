# ATOM FE CHALLENGE - ANGULAR

Este proyecto es una robusta aplicación basada en Angular 17.3.6 para el desafío técnico de Atom. Implementa una aplicación moderna y segura de gestión de tareas con autenticación de usuarios completa y una interfaz de usuario limpia y responsive.

## Características

### Autenticación y Seguridad
- **Autenticación con Google**: Inicio de sesión fluido a través de cuentas de Google utilizando Firebase Authentication
- **Autenticación por correo electrónico**: Registro e inicio de sesión tradicional basado en correo electrónico
- **Implementación JWT**: Autenticación segura basada en tokens
- **Guards de Rutas**: Rutas protegidas para garantizar acceso autenticado
- **Interceptores**: Inclusión automática de tokens para solicitudes API autorizadas

### Integración con Firebase
- **Hosting de Firebase**: Aplicación desplegada y alojada en Firebase
- **Autenticación de Firebase**: Servicios de autenticación de usuarios seguros

### Características de UI/UX
- **Angular Material**: Componentes de UI modernos con Material Design
- **Diseño Responsive**: Diseño totalmente responsive que funciona en todos los tamaños de dispositivos
- **Temas personalizados**: Esquema de colores indigo-pink con estilos globales
- **Notificaciones Toast**: Feedback amigable para el usuario mediante notificaciones snackbar

### Optimización SEO
- **Gestión de Metadatos**: Servicio SEO completo para actualizaciones dinámicas de metadatos
- **Soporte para Open Graph**: Experiencia mejorada de compartir en redes sociales con etiquetas OG
- **Twitter Cards**: Experiencia optimizada para compartir en Twitter
- **URLs Canónicas**: Gestión adecuada de URLs para evitar problemas de contenido duplicado

### Arquitectura y Organización
- **Módulos por Características**: Código organizado por áreas de funcionalidad (auth, tasks)
- **Servicios Core**: Servicios centralizados para autenticación y manejo de datos
- **Modelos Compartidos**: Interfaces con tipado seguro para estructuras de datos
- **Configuración de Entornos**: Configuraciones separadas para desarrollo y producción

### Gestión de Tareas
- **Operaciones CRUD para Tareas**: Funcionalidad completa de Crear, Leer, Actualizar y Eliminar
- **Filtrado de Tareas**: Capacidad para filtrar tareas por estado
- **Priorización de Tareas**: Soporte para niveles de prioridad en tareas

## Estructura del Proyecto

```
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/         # Guardias de rutas para autenticación
│   │   │   ├── interceptors/   # Interceptores HTTP para tokens de auth
│   │   │   └── services/       # Servicios core (auth, seo)
│   │   ├── features/
│   │   │   ├── auth/           # Componentes de la funcionalidad de autenticación
│   │   │   │   ├── components/ # Componentes de login, registro
│   │   │   │   └── pages/      # Páginas relacionadas con auth
│   │   │   └── tasks/          # Funcionalidad de gestión de tareas
│   │   │       ├── components/ # Componentes de tareas (lista, item, formulario)
│   │   │       ├── pages/      # Páginas de tareas (dashboard, detalles)
│   │   │       └── services/   # Servicios de datos de tareas
│   │   ├── shared/
│   │   │   └── models/         # Interfaces/modelos compartidos
│   │   ├── app.component.ts    # Componente raíz
│   │   ├── app.config.ts       # Configuración de la app
│   │   └── app.routes.ts       # Enrutamiento de la app
│   ├── assets/                 # Activos estáticos (imágenes, iconos)
│   ├── environments/           # Archivos de configuración de entorno
│   ├── styles.scss             # Estilos globales
│   └── index.html              # Archivo HTML principal
├── dist/                       # Salida de compilación
├── .firebase/                  # Caché de despliegue de Firebase
├── firebase.json               # Configuración de Firebase
├── .firebaserc                 # Configuración del proyecto Firebase
├── angular.json                # Configuración del workspace de Angular
├── package.json                # Dependencias y scripts
└── tsconfig.json               # Configuración de TypeScript
```

## Variables Globales y Configuración
La aplicación utiliza archivos de entorno para la configuración:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  firebase: {
    apiKey: "...",
    authDomain: "atom-backend-396e7.firebaseapp.com",
    projectId: "atom-backend-396e7",
    // Configuración adicional de Firebase
  },
  jwtLocalStorageKey: 'auth_token'
};
```

## Entorno de Desarrollo

### Servidor de desarrollo

Ejecuta `ng serve` para un servidor de desarrollo. Navega a `http://localhost:4200/`. La aplicación se recargará automáticamente si cambias cualquiera de los archivos fuente.

### Generación de código

Ejecuta `ng generate component nombre-componente` para generar un nuevo componente. También puedes usar `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Compilación

Ejecuta `ng build` para compilar el proyecto. Los artefactos de compilación se almacenarán en el directorio `dist/`.

### Ejecución de tests unitarios

Ejecuta `ng test` para ejecutar los tests unitarios vía [Karma](https://karma-runner.github.io).

## Despliegue

La aplicación está configurada para un fácil despliegue en Firebase:

1. Compilar la versión de producción: `ng build`
2. Desplegar en Firebase: `firebase deploy`

## Decisiones Técnicas

### Arquitectura

El proyecto sigue una arquitectura modular con clara separación de responsabilidades:

- **Módulo Core**: Contiene servicios, interceptores y guards que se cargan una sola vez
- **Módulo Compartido**: Contiene componentes, directivas y pipes reutilizables
- **Módulos de Características**: Módulos de gestión de tareas y autenticación con sus propios componentes

### Gestión de Estado

La aplicación utiliza BehaviorSubjects de RxJS para una gestión simple del estado, lo cual es suficiente para este tamaño de aplicación, evitando la complejidad de bibliotecas adicionales de gestión de estado.

### Integración con API

La aplicación se comunica con una API RESTful para operaciones de gestión de tareas y usuarios. 