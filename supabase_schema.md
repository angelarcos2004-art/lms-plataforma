# Esquema de Base de Datos - LMS Plataforma (Supabase)

Este documento detalla todas las tablas, columnas, relaciones y restricciones de la base de datos `public` de tu proyecto. RLS (Row Level Security) está habilitado en todas las tablas.

## 1. roles
Almacena los roles disponibles para los usuarios en el sistema.

| Columna | Tipo | Restricciones | Default |
| :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | | `nextval('roles_id_seq')` |
| **nombre** | `varchar` | UNIQUE, CHECK (administrador, docente, estudiante) | |
| **descripcion** | `text` | NULLABLE | |

---

## 2. usuarios
Almacena los perfiles de los usuarios y se relaciona con `auth.users` de Supabase.

| Columna | Tipo | Restricciones | Default |
| :--- | :--- | :--- | :--- |
| **id** (PK) | `uuid` | FK a `auth.users(id)` | |
| **nombre_completo** | `varchar` | | |
| **email** | `varchar` | UNIQUE | |
| **avatar_url** | `text` | NULLABLE | |
| **rol_id** | `integer` | FK a `roles(id)` | |
| **activo** | `boolean` | NULLABLE | `true` |
| **created_at** | `timestamp` | NULLABLE | `now()` |
| **updated_at** | `timestamp` | NULLABLE | `now()` |

---

## 3. categorias
Clasificación de los cursos.

| Columna | Tipo | Restricciones | Default |
| :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | | `nextval('categorias_id_seq')` |
| **nombre** | `varchar` | UNIQUE | |

---

## 4. cursos
Cursos creados por docentes.

| Columna | Tipo | Restricciones | Default |
| :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | | `nextval('cursos_id_seq')` |
| **titulo** | `varchar` | | |
| **descripcion** | `text` | NULLABLE | |
| **imagen_url** | `text` | NULLABLE | |
| **categoria_id** | `integer` | NULLABLE, FK a `categorias(id)` | |
| **docente_id** | `uuid` | FK a `usuarios(id)` | |
| **estado** | `varchar` | CHECK (activo, inactivo, borrador) | `'activo'` |
| **fecha_inicio** | `date` | NULLABLE | |
| **fecha_fin** | `date` | NULLABLE | |
| **created_at** | `timestamp` | NULLABLE | `now()` |
| **updated_at** | `timestamp` | NULLABLE | `now()` |

---

## 5. inscripciones
Alumnos inscritos a cursos.

| Columna | Tipo | Restricciones | Default |
| :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | | `nextval('inscripciones_id_seq')` |
| **estudiante_id** | `uuid` | FK a `usuarios(id)` | |
| **curso_id** | `integer` | FK a `cursos(id)` | |
| **fecha_inscripcion**| `timestamp` | NULLABLE | `now()` |
| **estado** | `varchar` | NULLABLE, CHECK (activa, completada, cancelada)| `'activa'` |

---

## 6. unidades
Módulos o unidades dentro de un curso.

| Columna | Tipo | Restricciones | Default |
| :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | | `nextval('unidades_id_seq')` |
| **curso_id** | `integer` | FK a `cursos(id)` | |
| **titulo** | `varchar` | | |
| **descripcion** | `text` | NULLABLE | |
| **orden** | `integer` | | |
| **created_at** | `timestamp` | NULLABLE | `now()` |

---

## 7. materiales
Recursos de aprendizaje para una unidad.

| Columna | Tipo | Restricciones | Default |
| :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | | `nextval('materiales_id_seq')` |
| **unidad_id** | `integer` | FK a `unidades(id)` | |
| **titulo** | `varchar` | | |
| **tipo** | `varchar` | CHECK (texto, enlace, video, documento, otro) | |
| **contenido** | `text` | | |
| **orden** | `integer` | | |
| **created_at** | `timestamp` | NULLABLE | `now()` |

---

## 8. tareas
Asignaciones para los estudiantes en una unidad.

| Columna | Tipo | Restricciones | Default |
| :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | | `nextval('tareas_id_seq')` |
| **unidad_id** | `integer` | FK a `unidades(id)` | |
| **titulo** | `varchar` | | |
| **instrucciones** | `text` | | |
| **fecha_limite** | `timestamp` | NULLABLE | |
| **fecha_cierre** | `timestamp` | NULLABLE | |
| **puntaje_maximo**| `numeric` | | |
| **created_at** | `timestamp` | NULLABLE | `now()` |

> `fecha_limite`: fecha hasta la que las entregas se consideran a tiempo.
> `fecha_cierre`: fecha de corte absoluta (opcional); después de esta fecha el estudiante ya no puede editar ni cancelar su entrega.

---

## 9. entregas
Trabajos entregados por estudiantes para una tarea específica.

| Columna | Tipo | Restricciones | Default |
| :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | | `nextval('entregas_id_seq')` |
| **tarea_id** | `integer` | FK a `tareas(id)` | |
| **estudiante_id** | `uuid` | FK a `usuarios(id)` | |
| **contenido_entrega**|`text` | NULLABLE | |
| **fecha_entrega** | `timestamp` | NULLABLE | `now()` |
| **calificacion** | `numeric` | NULLABLE | |
| **retroalimentacion**|`text` | NULLABLE | |
| **calificado_por**| `uuid` | NULLABLE, FK a `usuarios(id)` | |

---

## 10. cuestionarios
Evaluaciones para una unidad.

| Columna | Tipo | Restricciones | Default |
| :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | | `nextval('cuestionarios_id_seq')` |
| **unidad_id** | `integer` | FK a `unidades(id)` | |
| **titulo** | `varchar` | | |
| **descripcion** | `text` | NULLABLE | |
| **fecha_disponible**| `timestamp` | NULLABLE | |
| **fecha_limite** | `timestamp` | NULLABLE | |
| **tiempo_limite_minutos**|`integer`| NULLABLE | |
| **mostrar_resultados** | `boolean` | NOT NULL | `true` |
| **created_at** | `timestamp` | NULLABLE | `now()` |

---

## 11. preguntas
Preguntas dentro de un cuestionario.

| Columna | Tipo | Restricciones | Default |
| :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | | `nextval('preguntas_id_seq')` |
| **cuestionario_id**| `integer` | FK a `cuestionarios(id)`| |
| **texto_pregunta**| `text` | | |
| **orden** | `integer` | | |
| **puntaje** | `numeric` | | `1` |

---

## 12. opciones_respuesta
Opciones posibles para las preguntas.

| Columna | Tipo | Restricciones | Default |
| :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | | `nextval('opciones_respuesta_id_seq')`|
| **pregunta_id** | `integer` | FK a `preguntas(id)` | |
| **texto_opcion** | `text` | | |
| **es_correcta** | `boolean` | | `false` |
| **orden** | `integer` | | |

---

## 13. intentos_cuestionario
Intentos realizados por estudiantes en un cuestionario.

| Columna | Tipo | Restricciones | Default |
| :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | | `nextval('intentos_cuestionario_id_seq')`|
| **cuestionario_id**| `integer` | FK a `cuestionarios(id)`| |
| **estudiante_id** | `uuid` | FK a `usuarios(id)` | |
| **fecha_inicio** | `timestamp` | NULLABLE | `now()` |
| **fecha_fin** | `timestamp` | NULLABLE | |
| **puntaje_obtenido**| `numeric` | NULLABLE | |
| **puntaje_maximo**| `numeric` | NULLABLE | |

---

## 14. respuestas_estudiante
Respuestas individuales dadas durante un intento.

| Columna | Tipo | Restricciones | Default |
| :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | | `nextval('respuestas_estudiante_id_seq')`|
| **intento_id** | `integer` | FK a `intentos_cuestionario(id)`| |
| **pregunta_id** | `integer` | FK a `preguntas(id)` | |
| **opcion_seleccionada_id**|`integer`| FK a `opciones_respuesta(id)`| |
| **es_correcta** | `boolean` | | |

---

## 15. calificaciones_finales
Calificaciones consolidadas al final de un curso.

| Columna | Tipo | Restricciones | Default |
| :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | | `nextval('calificaciones_finales_id_seq')`|
| **inscripcion_id**| `integer` | UNIQUE, FK a `inscripciones(id)`| |
| **promedio_tareas**| `numeric` | NULLABLE | |
| **promedio_cuestionarios**|`numeric`| NULLABLE | |
| **calificacion_final**|`numeric`| NULLABLE | |
| **porcentaje_avance**|`numeric` | NULLABLE | `0` |
| **updated_at** | `timestamp` | NULLABLE | `now()` |

---

## 16. foros
Espacio de foros asociado a un curso.

| Columna | Tipo | Restricciones | Default |
| :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | | `nextval('foros_id_seq')` |
| **curso_id** | `integer` | UNIQUE, FK a `cursos(id)`| |
| **titulo** | `varchar` | | `'Foro general'` |
| **created_at** | `timestamp` | NULLABLE | `now()` |

---

## 17. hilos_foro
Discusiones dentro de un foro.

| Columna | Tipo | Restricciones | Default |
| :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | | `nextval('hilos_foro_id_seq')`|
| **foro_id** | `integer` | FK a `foros(id)` | |
| **autor_id** | `uuid` | FK a `usuarios(id)` | |
| **titulo** | `varchar` | | |
| **contenido** | `text` | | |
| **created_at** | `timestamp` | NULLABLE | `now()` |

---

## 18. mensajes_foro
Respuestas en un hilo de foro.

| Columna | Tipo | Restricciones | Default |
| :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | | `nextval('mensajes_foro_id_seq')`|
| **hilo_id** | `integer` | FK a `hilos_foro(id)` | |
| **autor_id** | `uuid` | FK a `usuarios(id)` | |
| **contenido** | `text` | | |
| **created_at** | `timestamp` | NULLABLE | `now()` |

---

## 20. mensajes_tarea
Chat privado entre estudiante y profesor/admin para cada tarea.

| Columna | Tipo | Restricciones | Default |
| :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | | `nextval('mensajes_tarea_id_seq')` |
| **tarea_id** | `integer` | FK a `tareas(id)` ON DELETE CASCADE | |
| **autor_id** | `uuid` | FK a `usuarios(id)` | |
| **contenido** | `text` | | |
| **created_at** | `timestamp` | NOT NULL | `now()` |

---

## 19. notificaciones
Sistema de notificaciones para usuarios.

| Columna | Tipo | Restricciones | Default |
| :--- | :--- | :--- | :--- |
| **id** (PK) | `integer` | | `nextval('notificaciones_id_seq')`|
| **usuario_id** | `uuid` | FK a `usuarios(id)` | |
| **titulo** | `varchar` | | |
| **mensaje** | `text` | | |
| **tipo** | `varchar` | NULLABLE, CHECK (tarea, calificacion, foro, sistema, otro) | |
| **leida** | `boolean` | NULLABLE | `false` |
| **url_destino** | `text` | NULLABLE | |
| **created_at** | `timestamp` | NULLABLE | `now()` |
