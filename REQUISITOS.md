# Instrucciones

Proyecto integrador: Desarrollo de una plataforma LMS tipo Moodle para gestión académica en línea 

Estimados estudiantes: 

Como proyecto integrador de esta unidad, desarrollarán una plataforma web de gestión del aprendizaje (LMS) inspirada en sistemas como Moodle, en la que deberán aplicar de manera articulada los conocimientos revisados en HTML5, CSS3, JavaScript, React, consumo de APIs y manejo de bases de datos con Supabase. Este proyecto tendrá una duración de dos semanas y representará un reto de desarrollo completo, ya que deberán construir una aplicación web funcional, modular, dinámica y orientada a resolver una necesidad real del ámbito educativo digital. 

El propósito del proyecto es diseñar e implementar un sistema web que permita la administración de cursos, usuarios, materiales, tareas, evaluaciones y comunicación académica, diferenciando perfiles de usuario y simulando el funcionamiento de una plataforma educativa moderna. La intención es que ustedes no desarrollen únicamente páginas visuales, sino una solución integral, con autenticación, persistencia de datos, consumo de servicios externos, interacción entre distintos módulos y una experiencia de usuario coherente. 

La plataforma deberá permitir al menos tres tipos de usuario: administrador, docente y estudiante. Cada uno deberá contar con permisos y funcionalidades diferenciadas dentro del sistema. El administrador podrá gestionar usuarios, cursos y configuraciones generales. El docente podrá crear cursos, publicar contenidos, generar actividades, revisar entregas y asignar calificaciones. El estudiante podrá inscribirse o acceder a cursos, consultar materiales, enviar tareas, responder actividades y visualizar sus resultados. 

La aplicación deberá incluir, como mínimo, los siguientes módulos funcionales obligatorios: 

El primer módulo será el de autenticación y gestión de usuarios. Ustedes deberán implementar registro, inicio de sesión, cierre de sesión y control de acceso por roles utilizando Supabase Authentication. Cada usuario deberá ver únicamente las secciones que correspondan a su perfil. 

El segundo módulo será el de gestión de cursos. El docente o administrador deberá poder crear cursos con nombre, descripción, imagen, categoría, fecha y estado. Cada curso deberá mostrarse en un catálogo o panel principal, con diseño responsivo y presentación clara. 

El tercer módulo será el de unidades, temas o contenidos. Dentro de cada curso, el docente deberá organizar el contenido en bloques o módulos temáticos. En cada bloque podrán integrarse recursos como texto, enlaces, videos, documentos o materiales de consulta. Esta organización deberá recordar la estructura de una plataforma LMS real. 

El cuarto módulo será el de tareas o actividades. El docente deberá poder publicar actividades con título, instrucciones, fecha límite y criterios básicos. El estudiante deberá poder visualizar la actividad y entregar evidencia, ya sea mediante texto, enlace o archivo simulado, dependiendo del alcance que ustedes definan. El docente deberá poder revisar el envío y asignar una calificación. 

El quinto módulo será el de evaluaciones o cuestionarios. La plataforma deberá permitir al menos un sistema básico de cuestionarios con preguntas objetivas de opción múltiple. El estudiante deberá responderlas y el sistema deberá calcular el resultado automáticamente. Esto permitirá integrar lógica con JavaScript y almacenamiento de resultados en Supabase. 

El sexto módulo será el de calificaciones y progreso académico. Cada estudiante deberá contar con una vista donde pueda consultar sus calificaciones, actividades entregadas, evaluaciones respondidas y avance dentro de los cursos en los que participa. 

El séptimo módulo será el de foro o comunicación académica. Cada curso deberá tener un espacio donde los estudiantes y docentes puedan publicar mensajes, dudas o comentarios. Este módulo deberá simular un foro sencillo de interacción, similar al de un LMS. 

El octavo módulo será el de panel o dashboard. Cada usuario deberá visualizar un panel personalizado con información resumida: cursos inscritos o creados, actividades pendientes, próximas fechas de entrega, mensajes recientes y avance académico. 

Adicionalmente, la plataforma deberá integrar el consumo de al menos una API externa que aporte funcionalidad real al sistema. Por ejemplo, podrían integrar una API de calendario, una API de generación o validación de fechas, una API de videoconferencias, una API de citas motivacionales para el panel del estudiante, una API de avatares, una API de noticias académicas o una API de traducción para materiales. La API deberá tener sentido dentro del entorno educativo y no ser un elemento decorativo aislado. 

En cuanto al uso de Supabase, la plataforma deberá contar con una estructura de base de datos bien planeada. Como mínimo, deberán contemplar tablas como las siguientes: usuarios, roles, cursos, inscripciones, módulos o unidades, materiales, tareas, entregas, cuestionarios, preguntas, respuestas, calificaciones, foros y mensajes. No se exige que reproduzcan exactamente toda la complejidad de Moodle, pero sí que construyan una arquitectura coherente, relacional y funcional que refleje el comportamiento esencial de un LMS real. 

Desde el punto de vista técnico, el proyecto deberá cumplir con los siguientes requisitos obligatorios. La interfaz debe ser desarrollada en React, organizada por componentes reutilizables. El diseño debe hacer uso adecuado de HTML5 y CSS3, cuidando jerarquía visual, usabilidad y adaptación a distintos tamaños de pantalla. La lógica implementada con JavaScript deberá evidenciar manejo del estado, validaciones, eventos, renderización dinámica, formularios y comunicación asíncrona con la base de datos y con la API externa. También deberán implementar control básico de errores, protección de rutas o vistas según el rol del usuario y mensajes claros para acciones exitosas o fallidas. 

Para que el proyecto represente realmente un reto, deberán incorporar además cuatro características avanzadas de una plataforma LMS moderna. Algunas opciones válidas son las siguientes: búsqueda de cursos y materiales, filtros por categoría, modo oscuro, recuperación de contraseña, editor enriquecido para publicaciones, barra de progreso por curso, notificaciones internas, calendario académico, subida de archivos, estadísticas para docentes, panel administrativo de usuarios, historial de actividad o insignias digitales. Estas funcionalidades permitirán distinguir un desarrollo funcional de uno sobresaliente.
