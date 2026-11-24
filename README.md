# React + TypeScript + Vite

## Demo con backend local

Para desplegar solamente el frontend en Vercel, configure la variable de entorno
`VITE_API_BASE_URL` con la URL HTTPS del backend expuesto desde el PC. La URL debe
terminar en `/api`, por ejemplo:

```env
VITE_API_BASE_URL=https://your-tunnel-domain.trycloudflare.com/api
```

Vercel ejecuta `npm run build` y publica `dist`. El archivo `vercel.json` incluye
el rewrite necesario para las rutas del `BrowserRouter`.

Para una demo con backend local:

1. Iniciar el backend en el puerto `8080`.
2. Exponer `http://localhost:8080` mediante Cloudflare Tunnel.
3. Configurar `VITE_API_BASE_URL` en Vercel con la URL HTTPS del túnel seguida de `/api`.
4. Volver a desplegar el frontend después de cambiar la variable.
5. Mantener el PC, el backend y el túnel activos mientras se usa la demo.

## Modelos del superadministrador

La opcion Modelos del SUPER_ADMIN (`/admin/models`) lista cuentas MODEL usando
`GET /api/v1/superadmin/accounts/models`, con filtro opcional `status`.
La respuesta contiene `data: [{ id, name, lastname, email, status, created_at }]`.
Este listado es exclusivo de SUPER_ADMIN; no se habilita en sesiones ADMIN o MODEL.

La pantalla comparte diseno y manejo de errores con Administradores.
Suspender solicita confirmacion y ejecuta `PATCH /api/v1/admin/accounts/models/{id}/suspend`
sin cuerpo, solo para cuentas ACTIVE. Quitar suspension usa `.../{id}/unsuspend`
solo para SUSPENDED. El backend exige correo verificado y la ultima verificacion
de identidad APPROVED; si rechaza la operacion, se muestra el error sin cambiar
el estado local. Tras un cambio aplicado, se vuelve a consultar el listado
conservando el filtro. No se eliminan cuentas.

El endpoint de listado es una ampliacion del backend; requiere reiniciarlo o
recargarlo tras compilar. Las reglas existentes de suspension y autenticacion
no se modificaron.

## Gestion de administradores

En SUPER_ADMIN > Administradores > Ver administradores (`/superadmin/admins`):

- Listado con filtro opcional por estado mediante `GET /api/v1/superadmin/accounts/admins`.
- Detalle de permisos mediante `GET /api/v1/superadmin/accounts/admins/{id}`.
- Asignacion y revocacion mediante `PATCH .../{id}/permissions/assign` y
  `PATCH .../{id}/permissions/revoke`, con cuerpo `{ "permissions": [...] }`.
- Se seleccionan tareas completas del catalogo. Para asignar se envian solo
  permisos faltantes; para revocar, solo los que la cuenta tiene actualmente.
  Las tareas parcialmente asignadas pueden completarse o revocarse.
- La revocacion requiere confirmacion y se permite dejar al admin sin permisos.
- Tras cada cambio se vuelve a consultar el detalle. Si falla esa consulta,
  se muestra un error y se bloquean nuevas operaciones hasta reintentar.

El backend invalida las sesiones del administrador afectado en ambos PATCH.
Debe volver a iniciar sesion para recibir sus permisos actualizados. La pagina
no modifica la autenticacion ni requiere cambios en el backend.

En el mismo listado, Suspender y Quitar suspension solicitan confirmacion y usan
`PATCH /api/v1/admin/accounts/admins/{id}/suspend` y `.../{id}/unsuspend`, sin cuerpo.
El codigo actual del backend permite suspender estados ACTIVE y PENDING_VERIFICATION
(aunque Swagger solo menciona ACTIVE). Quitar suspension solo se ofrece para
SUSPENDED; el backend comprueba ademas que el correo este verificado.
Las cuentas INACTIVE no muestran estas acciones. No se eliminan cuentas ni permisos.
Despues de cada operacion se consulta de nuevo el listado conservando el filtro;
los rechazos del backend se notifican sin cambiar el estado mostrado.

## Navbar de administradores

El ADMIN ve Cuenta y solo los modulos implementados para los que tiene permiso:

- Administracion anuncios: `POST_REVIEW_LIST_VIEW`.
- Verificacion de identidad: `MODEL_REGISTRATION_LIST_VIEW`.

Los permisos de aprobar o rechazar controlan las acciones dentro de cada modulo.
Al crear un administrador, el selector muestra tareas, no acciones individuales.
Elegir Verificacion de identidad envia todos los permisos `MODEL_REGISTRATION_*`
disponibles en el catalogo; elegir Revision de anuncios envia los `POST_REVIEW_*`.
Pagos, Cuentas de administrador y Cuentas de modelo agrupan sus respectivos
permisos del mismo modo. No se inventan permisos ausentes del catalogo.
El catalogo de permisos asignables no representa los permisos del usuario conectado.
Los permisos sin pantalla implementada no agregan opciones al menu.
Posicionamientos y el listado de Modelos quedan reservados al
SUPER_ADMIN, que conserva su menu actual. Las rutas aplican las mismas restricciones.
Si no se reciben permisos, no se habilitan modulos administrativos y se muestra
un aviso para volver a iniciar sesion. El backend debe validar los permisos
en cada peticion; ocultar opciones no sustituye esa validacion.

Ejemplo: desde Administradores > Crear administrador, registrar a Ana Revision
con `ana.revision@example.com`, una contrasena segura y estos permisos:
`POST_REVIEW_LIST_VIEW`, `POST_REVIEW_VIEW`, `POST_REVIEW_APPROVE`,
`POST_REVIEW_REJECT`. Tras verificar su correo e iniciar sesion, Ana vera
unicamente Cuenta y Administracion anuncios. No vera Verificacion de identidad,
Posicionamientos, Modelos ni Administradores.

El login debe devolver los permisos asignados en `permissions` (lista o texto
separado por espacios/comas), o incluirlos en los claims del JWT.
La prueba `tests/e2e/admin-navbar.spec.ts` simula la creacion y el login de este
ejemplo sin crear cuentas reales.

## Verificacion del correo de administradores

Despues de crear un administrador, el primer inicio de sesion con correo pendiente
de verificacion utiliza la misma vista `/verify-email` que las demas cuentas.
El login debe indicar en su mensaje que el correo no esta verificado; un HTTP 409
por cuenta inactiva o suspendida no abre esta vista.
Si el mensaje de error del login indica que la cuenta esta suspendida
(`suspendida`, `suspendido` o `suspended`), se muestra un aviso de suspension
en lugar de un error generico.

El codigo se envia mediante `POST /api/v1/models/accounts/email/verify?token=...`.
Si la verificacion es exitosa, se vuelve al login con el correo precargado, sin
guardar la contrasena ni iniciar una sesion antes de autenticar nuevamente.
Un codigo rechazado mantiene abierta la vista y muestra el error para reintentar.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
