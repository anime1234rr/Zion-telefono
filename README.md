# Zion 🚀

Zion es la app móvil para comunidades y chat en tiempo real: servidores, canales, voz, foros, roles con permisos granulares y bots propios, todo desde el celular.

## Funcionalidades

### Servidores y estructura
- Servidores con categorías y canales de texto, voz y foro.
- Plantillas de servidor para replicar una estructura ya armada.
- Creación de canales directamente desde una categoría, heredando su configuración.
- Directorio de comunidades públicas con búsqueda y filtros por categoría (Explorar).

### Roles y permisos
- Roles personalizados con color propio y plantillas rápidas (Moderador, Administrador).
- Motor de permisos granular: permisos generales por rol con overrides específicos por canal o categoría, con jerarquía y precedencia estrictas.
- Reordenamiento de la jerarquía de roles.

### Canales de foro
- Publicaciones con título y cuerpo, organizadas en hilos.
- Etiquetas para clasificar publicaciones.
- Fijar, bloquear y eliminar hilos según permisos.

### Mensajería
- Formato enriquecido, fragmentos de código, respuestas, reenvío de mensajes, mensajes fijados y búsqueda.
- Reacciones, menciones y autocompletado de emojis.
- Adjuntos de imagen y video, con visor de imágenes con zoom.
- Emojis y stickers propios por servidor (Expresiones).
- Crear un hilo a partir de un mensaje.

### Voz
- Canales de voz con micrófono, silenciar y ensordecer.

### Miembros y moderación
- Gestión de miembros y roles del servidor.
- Niveles de moderación configurables por servidor y AutoMod: filtro de palabras, modo lento, control de cuentas nuevas y límite anti-raid.
- Registro de auditoría de las acciones realizadas en el servidor.
- Zona de peligro: transferir titularidad o eliminar el servidor.

### Mensajes directos y social
- Conversaciones directas y panel de amigos, con solicitudes de amistad.
- Notificaciones dentro de la app.
- Perfiles personalizables: avatar, banner, biografía, color y estado.
- Estados de presencia (en línea, ausente, ocupado, desconectado).
- Mensajes guardados como marcadores personales.

### Apps y Webhooks
- Webhooks atados a un canal fijo para integraciones simples.
- Apps con token propio atado a un rol: cada app crea un bot con identidad real (miembro del servidor, con insignia "BOT", nombre y avatar personalizables), limitado exactamente a los permisos de su rol.

### Seguridad
- Verificación en dos pasos (TOTP) para la cuenta.

### Actualizaciones
- Actualización automática en segundo plano (OTA), con aviso dentro de Zion cuando hay una versión nueva lista para instalar.

### Todavía no disponible en la app móvil
- Cámara y compartir pantalla en los canales de voz.
- Notas de voz.
- Guardar en la galería las imágenes recibidas.
- Personalización de tema y otros idiomas (i18n).

## Cómo funciona

Zion combina dos capas:

- **En la nube**: el contenido de las comunidades (mensajes, servidores, roles, canales, archivos) se sincroniza en tiempo real entre todos tus dispositivos apenas se envía o se modifica, sin que tengas que actualizar nada manualmente.
- **En el dispositivo**: la app corre de forma nativa en tu celular, con integración al sistema operativo (notificaciones, selector de fotos, enlaces de invitación directos, actualizaciones en segundo plano). La personalización local solo está disponible a través de los archivos y herramientas oficiales que provee el desarrollador — nunca modificando el código o los binarios por cuenta propia.

> **Plataformas**: Zion para móvil está disponible para Android.


## Licencia

Zion es una app de código propietario. Ver [LICENSE](./LICENSE) para los términos completos de uso, distribución y modificación.

© 2026 @anime1234rr. Todos los derechos reservados.
