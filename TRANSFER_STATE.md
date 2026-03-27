# ESTADO DE TRANSFERENCIA - LMS PLATAFORMA

Este documento sirve como proxy de estado del backend para que la IA que construya el cliente en React sepa de qué punto partir y la configuración actual de Supabase.

## 1. Esquema de Base de Datos (18 Tablas en 3FN)
Las siguientes tablas se han desplegado y se encuentran activas en el proyecto de Supabase (`lms-plataforma`):
1. `roles`: Define administradores, docentes y estudiantes.
2. `usuarios`: Perfiles de usuario vinculados por UUID a `auth.users`.
3. `categorias`: Clasificación del catálogo de cursos.
4. `cursos`: Catálogo con las definiciones de clases impartidas por docentes.
5. `inscripciones`: Relación estudiante-curso.
6. `unidades`: Bloques de enseñanza / temario.
7. `materiales`: Tipo de recursos multimedia adjuntos por unidad.
8. `tareas`: Actividades calificables por unidad.
9. `entregas`: Sumisión del trabajo por parte de estudiantes.
10. `cuestionarios`: Examen en línea.
11. `preguntas`: Reactivos dentro de un cuestionario.
12. `opciones_respuesta`: Opciones por inciso.
13. `intentos_cuestionario`: Récord por estudiante realizando un test.
14. `respuestas_estudiante`: Respuestas mapeadas durante cada intento.
15. `calificaciones_finales`: Boleta promedio global 1 a 1 por inscripción.
16. `foros`: Mesa de discusión genérica, un foro por cada curso.
17. `hilos_foro`: Temas publicados dentro del foro por estudiantes o docentes.
18. `mensajes_foro`: Árbol de respuestas de la discusión.

## 2. Trigger de Autenticación
**Estado: ACTIVO**
Se ha configurado un trigger inter-esquema (`on_auth_user_created`) en la tabla de Supabase Auth (`auth.users`).
Cada vez que un usuario se registre en el sistema de Auth (ej. Signup form), la ejecución del trigger inyectará automáticamente un registro en public.usuarios asignándole por default el UUID y el _rol de Estudiante_. No es necesario que el cliente gestione la creación manual de dicho perfil.

## 3. Row Level Security (RLS)
Todas las tablas cuentan con RLS habilitado (Restrictivo por defecto para `anon` y `authenticated`).
A grandes rasgos, estas son las directrices impuestas:
- **Estudiantes:** Permisos de lectura en cursos matriculados (`inscripciones`), lectura en unidades/materiales, inserción restringida a `entregas`, `hilos_foro`, `mensajes_foro`, e `intentos_cuestionario` para sus propios IDs de usuario.
- **Docentes:** Permiso absoluto (CRUD completo) sobre los registros vinculados a sus propios cursos, desde edición de los mismos hasta calificación en las entradas de `entregas`.
- **Administrador:** Rol maestro. Acceso de LECTURA/ESCRITURA absoluto en toda la base de datos sin restricciones de propiedad.
- **Datos Públicos:** Los vocabularios universales como `roles` y `categorias` son de lectura pública para su pintado en UI.

## 4. Siguientes Pasos Frontend para la Integración Auth
Claude, por favor revisa estos 3 archivos elementales en el esquema de React (Vite) para concretar la primera prueba funcional (Inicio de Sesión y Control de Autenticación Ruteada).
Sugiero que su desarrollo se realice en este orden:

1. `src/lib/supabaseClient.js`: Lógica para levantar el cliente de Supabase exportado en toda la App usando el archivo `.env`. ( `createClient()` ).
2. `src/contexts/AuthContext.jsx`: State global que consuma el objeto de Sesión y exponga métodos `signIn`, `signUp`, y `signOut` utilizando las funciones nativas `onAuthStateChange`.
3. `src/components/auth/Login.jsx` (o page auth principal): Componente visual de formulario para enviar el E-Mail/Password a `AuthContext`, que a su vez se comunicará con el backend para la generación de cuenta. (El Auth Trigger de Postgres hará el resto).
