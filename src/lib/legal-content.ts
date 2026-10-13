export type BloqueLegal = { tipo: 'p'; texto: string } | { tipo: 'lista'; items: string[] }

export interface SeccionLegal {
  id: string
  titulo: string
  bloques: BloqueLegal[]
}

export interface DocumentoLegal {
  titulo: string
  actualizado: string
  intro: string[]
  secciones: SeccionLegal[]
}

const p = (texto: string): BloqueLegal => ({ tipo: 'p', texto })
const lista = (...items: string[]): BloqueLegal => ({ tipo: 'lista', items })

export const LEGAL_ACTUALIZADO = '13 de octubre de 2026'

export const TERMINOS: DocumentoLegal = {
  titulo: 'Términos de servicio',
  actualizado: LEGAL_ACTUALIZADO,
  intro: [
    'Estos Términos de servicio (los "Términos") regulan el uso de Zion: la app de escritorio, la app móvil, el sitio web y cualquier otra forma de acceder al servicio (en conjunto, "Zion" o "el servicio"). Se aplican a toda persona que cree una cuenta, la use o navegue el servicio de cualquier manera.',
    'Es el mismo acuerdo para todas las plataformas, porque es la misma cuenta y el mismo servicio. Leelos completos: al usar Zion aceptás todo lo que dicen. Si no estás de acuerdo con alguna parte, no uses el servicio.',
  ],
  secciones: [
    {
      id: 'aceptacion',
      titulo: 'Aceptación de los términos',
      bloques: [
        p('Zion es un servicio de código propietario desarrollado y operado por @anime1234rr ("nosotros"). Al crear una cuenta, instalar cualquiera de las apps, iniciar sesión o usar el servicio de cualquier forma, declarás que leíste, entendiste y aceptás estos Términos y la Política de privacidad, que forma parte de ellos.'),
        p('Si usás Zion en nombre de una organización, grupo o comunidad, declarás que tenés autoridad para aceptar estos Términos en su nombre, y tanto vos como esa organización quedan obligados por ellos.'),
        p('Además de estos Términos, cada servidor puede tener normas propias. Si una norma de un servidor contradice estos Términos, prevalecen estos Términos.'),
      ],
    },
    {
      id: 'requisitos',
      titulo: 'Quién puede usar Zion',
      bloques: [
        p('Para usar Zion tenés que:'),
        lista(
          'Tener al menos 13 años, o la edad mínima que exija la ley de tu país para usar servicios en línea sin el consentimiento de un adulto, si esa edad es mayor.',
          'Si sos menor de edad según la ley de tu país, contar con el permiso de tu madre, padre o tutor legal, que también acepta estos Términos en tu nombre.',
          'No tener una suspensión permanente vigente en Zion ni estar usando una cuenta nueva para evadir una sanción anterior.',
          'No tener prohibido el uso del servicio por la ley aplicable.',
        ),
        p('Si descubrimos que una cuenta pertenece a alguien que no cumple estos requisitos, podemos suspenderla o cerrarla.'),
      ],
    },
    {
      id: 'cuenta',
      titulo: 'Tu cuenta y su seguridad',
      bloques: [
        p('Tu cuenta es personal e intransferible. No podés venderla, prestarla, compartirla ni cederla. Sos responsable de toda la actividad que ocurra con tu cuenta, la hayas hecho vos o no, salvo que nos avises de un acceso no autorizado apenas lo detectes.'),
        p('Para proteger tu cuenta:'),
        lista(
          'Usá una contraseña única que no uses en otros servicios y no la compartas con nadie, incluido el equipo de Zion: nunca te la vamos a pedir.',
          'Activá la verificación en dos pasos desde Seguridad. Es de la cuenta, no del dispositivo: cuando la activás, todos los dispositivos donde tengas la sesión abierta te piden el código antes de seguir.',
          'Mantené actualizado tu correo electrónico: es la vía para recuperar el acceso y para recibir avisos de seguridad.',
          'Cerrá sesión en los dispositivos que no sean tuyos.',
        ),
        p('La misma cuenta funciona en escritorio, móvil y la web, y los cambios que hacés en una (perfil, estado, seguridad, servidores) se sincronizan con las demás.'),
        p('El nombre de usuario tiene que ser único. No podés elegir uno que suplante a otra persona, a una marca o al equipo de Zion, ni uno ofensivo. Podemos cambiar o recuperar nombres de usuario que infrinjan estas reglas.'),
      ],
    },
    {
      id: 'conducta',
      titulo: 'Normas de conducta',
      bloques: [
        p('Zion es un lugar para comunidades. Para que siga siéndolo, al usar el servicio te comprometés a no:'),
        lista(
          'Acosar, intimidar, amenazar, extorsionar o perseguir a otras personas, ni organizar o alentar que otras personas lo hagan.',
          'Promover el odio o la violencia contra personas o grupos por su origen, etnia, nacionalidad, religión, género, identidad de género, orientación sexual, discapacidad, edad o cualquier otra condición protegida.',
          'Publicar información privada de otras personas (dirección, teléfono, documentos, fotos íntimas, datos financieros) sin su consentimiento.',
          'Suplantar la identidad de otra persona, de un servidor, de una marca o del equipo de Zion, o dar a entender falsamente que tenés una relación con ellos.',
          'Enviar spam: mensajes masivos o repetidos, publicidad no pedida, cadenas, invitaciones masivas a servidores o menciones abusivas.',
          'Estafar, engañar o intentar obtener contraseñas, códigos de verificación, dinero o datos personales de otras personas.',
          'Distribuir malware, enlaces maliciosos o cualquier código diseñado para dañar, espiar o tomar el control de dispositivos o cuentas.',
          'Intentar acceder sin autorización a cuentas, servidores, canales privados, datos de otras personas o a la infraestructura de Zion.',
          'Eludir o intentar eludir la moderación, los baneos, los silencios, los niveles de verificación, el motor de permisos y roles de un servidor o las sanciones de la plataforma, incluido crear cuentas nuevas para eso.',
          'Automatizar acciones por fuera del sistema oficial de Apps y Webhooks: no se permiten clientes modificados, self-bots ni scripts que usen tu cuenta personal.',
          'Sobrecargar, interferir o interrumpir el servicio, incluidos ataques de denegación de servicio y el uso abusivo de la API.',
          'Enviar reportes falsos o abusar del sistema de reportes para perjudicar a alguien.',
          'Animar o ayudar a otras personas a hacer cualquiera de estas cosas.',
        ),
      ],
    },
    {
      id: 'contenido-prohibido',
      titulo: 'Contenido prohibido',
      bloques: [
        p('No podés publicar, enviar, compartir ni almacenar en Zion contenido que:'),
        lista(
          'Muestre, promueva o normalice el abuso o la explotación sexual de menores, en cualquier forma, incluidas imágenes generadas o editadas. Este contenido se elimina de inmediato, la cuenta se suspende de forma permanente y, cuando corresponda, se informa a las autoridades.',
          'Sea sexualmente explícito fuera de canales marcados para ese contenido por el servidor, o que se comparta sin el consentimiento de las personas que aparecen.',
          'Muestre violencia real extrema, gore o crueldad con animales con el fin de impactar o glorificarla.',
          'Promueva, organice o glorifique el terrorismo, el extremismo violento o la violencia contra personas.',
          'Aliente o dé instrucciones para autolesionarse, el suicidio o los trastornos alimentarios.',
          'Ofrezca o facilite la venta de drogas ilegales, armas, bienes robados, cuentas, datos personales u otros bienes o servicios ilegales.',
          'Infrinja derechos de autor, marcas u otros derechos de propiedad intelectual de terceros.',
          'Sea desinformación que pueda causar daño real, por ejemplo sobre salud pública o procesos electorales.',
          'Sea ilegal en el país donde lo publicás o donde vive la persona afectada.',
        ),
      ],
    },
    {
      id: 'servidores',
      titulo: 'Servidores, propietarios y moderadores',
      bloques: [
        p('Cualquier persona puede crear servidores. Quien crea un servidor es su propietario y es responsable de lo que pasa en él: de sus normas, de su configuración, de los roles que asigna y de moderar el contenido que se publica.'),
        lista(
          'Los propietarios y las personas con permisos de administración pueden establecer normas propias, crear canales, asignar roles, silenciar, expulsar o banear miembros, configurar la moderación automática y conectar apps y webhooks.',
          'Las normas propias de un servidor no pueden permitir lo que estos Términos prohíben.',
          'El registro de auditoría de un servidor guarda las acciones de moderación y administración, y lo pueden ver quienes tienen permiso para eso.',
          'El propietario puede transferir la titularidad del servidor a otro miembro. Si elimina el servidor, se borran sus canales, mensajes y configuración, y no se pueden recuperar.',
          'No nos hacemos responsables por las decisiones de moderación que toman los propietarios y moderadores dentro de sus servidores, salvo cuando infringen estos Términos.',
        ),
        p('Podemos intervenir en cualquier servidor que infrinja estos Términos, incluso quitarlo de Explorar, sancionar a sus responsables o eliminarlo.'),
      ],
    },
    {
      id: 'explorar',
      titulo: 'Comunidades y Explorar',
      bloques: [
        p('Explorar muestra servidores públicos que cualquier persona con una cuenta puede descubrir y a los que se puede unir. Un servidor aparece en Explorar de una de estas dos formas:'),
        lista(
          'Su propietario activa la comunidad y el servidor cumple los requisitos: tener un ícono, un canal de bienvenida, un canal de normas, un nivel de verificación medio o alto, y al menos 10 miembros.',
          'El equipo de Zion lo agrega a Explorar a su criterio, aunque todavía no cumpla esos requisitos. Estos servidores se muestran como destacados.',
        ),
        p('Podemos quitar cualquier servidor de Explorar en cualquier momento, sin aviso previo, si deja de cumplir los requisitos, si recibe reportes fundados o si lo consideramos necesario para la seguridad de las personas usuarias. Aparecer en Explorar no implica que respaldemos el contenido del servidor.'),
        p('Explorar también tiene una sección de Personas, donde ves los perfiles de quienes comparten algo con vos: un servidor, una amistad o una conversación. No muestra a personas con las que no tenés relación ni a quienes bloqueaste.'),
      ],
    },
    {
      id: 'reportes',
      titulo: 'Reportes de usuarios',
      bloques: [
        p('Si alguien infringe estos Términos, podés reportarlo desde su perfil. Para que un reporte sea válido, tenés que:'),
        lista(
          'Elegir el motivo: acoso, amenazas, discurso de odio, spam, estafa, contenido sexual, contenido violento, suplantación de identidad, autolesión, contenido ilegal u otro.',
          'Explicar qué pasó con tus propias palabras, en al menos 20 caracteres.',
          'Adjuntar como evidencia entre 1 y 10 mensajes escritos por la persona reportada.',
        ),
        p('La evidencia tiene que ser real. Solo se pueden adjuntar mensajes que existen en Zion, que escribió la persona reportada y que vos podés ver: mensajes de canales de servidores donde sos miembro y tenés acceso al canal, o mensajes directos de una conversación en la que participás. No se aceptan capturas de pantalla ni archivos externos, porque se pueden editar o inventar.'),
        p('En el momento en que enviás el reporte, Zion guarda una copia de cada mensaje (texto, adjunto, fecha y dónde se envió) junto con una huella digital SHA-256. Así, aunque la persona reportada después edite o borre el mensaje, el equipo de moderación puede ver lo que decía y comprobar que la copia no se modificó.'),
        p('Límites para evitar abusos:'),
        lista(
          'Podés enviar como máximo 10 reportes cada 24 horas.',
          'No podés tener más de un reporte abierto contra la misma persona: esperá a que el equipo lo revise.',
          'No podés reportarte a vos mismo.',
        ),
        p('Reportes falsos: si el equipo determina que un reporte es falso, es decir, que la evidencia no respalda lo que dice o que se envió para perjudicar a alguien, se marca como falso. Si acumulás 3 reportes falsos en 30 días, no vas a poder enviar reportes durante 30 días. Los reportes falsos reiterados o de mala fe se consideran una infracción a estas normas y pueden llevar a advertencias, baneos temporales o la suspensión de tu cuenta.'),
        p('Cuando el equipo cierra tu reporte, te avisamos con una notificación si fue resuelto, descartado o marcado como falso. La persona reportada no puede ver quién la reportó.'),
      ],
    },
    {
      id: 'moderacion',
      titulo: 'Moderación y sanciones de la plataforma',
      bloques: [
        p('El equipo de Zion revisa los reportes y puede actuar de oficio cuando detecta una infracción. Según la gravedad, la reincidencia y el contexto, podemos aplicar:'),
        lista(
          'Una advertencia, que vas a ver dentro de la app y que tenés que reconocer para seguir usándola.',
          'Un baneo temporal, que te impide usar Zion hasta la fecha que se indique.',
          'Una suspensión permanente, que cierra el acceso a tu cuenta.',
          'La eliminación de contenido, la quita de un servidor de Explorar o la eliminación de un servidor.',
        ),
        p('Cada sanción guarda el motivo, quién la aplicó y cuándo. El equipo puede revocar una sanción si se aplicó por error. Si creés que una sanción es injusta, podés pedir una revisión desde Ayuda y soporte: indicá tu nombre de usuario y por qué creés que hubo un error.'),
        p('Las infracciones graves, como el contenido de abuso sexual infantil, las amenazas creíbles de violencia o el fraude, pueden llevar a la suspensión permanente inmediata, sin advertencias previas, y a que informemos a las autoridades cuando la ley lo exija o lo permita.'),
        p('Quienes integran el equipo de staff (moderación y desarrollo) tienen permisos limitados según su rol, y no pueden resolver reportes en los que estén involucrados.'),
      ],
    },
    {
      id: 'apps',
      titulo: 'Apps, bots y webhooks',
      bloques: [
        p('Los servidores pueden conectar apps y webhooks con los tokens oficiales que se generan desde la configuración del servidor. Si creás o conectás una app:'),
        lista(
          'Sos responsable de lo que hace y de proteger su token. Si un token se filtra, revocalo y generá uno nuevo.',
          'La app solo puede actuar con los permisos del rol que le asignó el servidor.',
          'La app tiene que respetar estos Términos y no puede recolectar datos de miembros para fines ajenos al servidor.',
          'Podemos revocar tokens, desactivar apps o webhooks y limitar su uso si infringen estos Términos o afectan el servicio.',
        ),
      ],
    },
    {
      id: 'voz',
      titulo: 'Canales de voz, video y pantalla compartida',
      bloques: [
        p('Las llamadas de voz, el video y la pantalla compartida se transmiten de forma directa entre los participantes cuando es posible. Zion no graba ni guarda el audio, el video ni la pantalla de las llamadas.'),
        p('No podés grabar, transmitir ni difundir lo que otras personas dicen o muestran en una llamada sin su consentimiento. Los mensajes de voz que enviás en un chat sí se guardan, como cualquier otro adjunto.'),
      ],
    },
    {
      id: 'contenido',
      titulo: 'Contenido que generás',
      bloques: [
        p('Mantenés la titularidad de los mensajes, imágenes, videos, audios y demás contenido que publicás en Zion ("tu contenido").'),
        p('Al publicarlo, nos das una licencia mundial, no exclusiva, gratuita y limitada para almacenarlo, copiarlo, procesarlo, sincronizarlo entre tus dispositivos y mostrarlo a las personas que pueden verlo según los permisos del servidor, el canal o la conversación donde lo publicaste. Usamos esta licencia solo para operar y mejorar el servicio, y termina cuando borrás el contenido, salvo las copias que se guardaron como evidencia en un reporte o que tengamos que conservar por ley.'),
        p('Sos el único responsable de tu contenido y declarás que tenés los derechos necesarios para publicarlo. Podemos eliminar o restringir cualquier contenido que infrinja estos Términos, aunque no estamos obligados a revisar todo lo que se publica.'),
      ],
    },
    {
      id: 'propiedad',
      titulo: 'Propiedad intelectual de Zion',
      bloques: [
        p('Zion, su nombre, su logotipo, el diseño de sus apps y su sitio web, su código fuente, sus binarios y sus recursos son propiedad de @anime1234rr y están protegidos por las leyes de propiedad intelectual.'),
        p('Te damos una licencia personal, limitada, revocable, no exclusiva e intransferible para instalar y usar las apps oficiales de Zion con el único fin de usar el servicio. No podés copiar, modificar, distribuir, vender, alquilar, descompilar ni hacer ingeniería inversa de ninguna parte de Zion, ni crear obras derivadas, salvo en la medida en que la ley lo permita de forma expresa. Los términos completos de la licencia están en el archivo LICENSE de cada repositorio del proyecto.'),
      ],
    },
    {
      id: 'derechos-autor',
      titulo: 'Denuncias por derechos de autor',
      bloques: [
        p('Si creés que contenido publicado en Zion infringe tus derechos de autor o de marca, escribinos desde Ayuda y soporte indicando: quién sos y cómo contactarte, qué obra o marca se infringe, el enlace o la ubicación exacta del contenido, y una declaración de que la información es correcta y de que sos titular de los derechos o estás autorizado a actuar en su nombre.'),
        p('Vamos a revisar la denuncia y, si corresponde, eliminar el contenido. Las cuentas que infringen derechos de forma reiterada pueden ser suspendidas.'),
      ],
    },
    {
      id: 'actualizaciones',
      titulo: 'Actualizaciones de las apps',
      bloques: [
        p('Las apps de escritorio y móvil pueden descargar e instalar actualizaciones de forma automática para corregir errores, mejorar la seguridad o agregar funciones. Algunas funciones pueden dejar de estar disponibles en versiones antiguas, y podemos exigir que actualices para seguir usando el servicio.'),
      ],
    },
    {
      id: 'cambios-servicio',
      titulo: 'Disponibilidad y cambios del servicio',
      bloques: [
        p('Zion está en desarrollo activo. Podemos agregar, modificar, limitar o discontinuar funciones en cualquier momento. Podemos poner el servicio en mantenimiento cuando sea necesario; durante ese tiempo puede no estar disponible, total o parcialmente.'),
        p('No garantizamos que el servicio esté disponible siempre, ni que funcione sin interrupciones o errores. Podés ver el estado del servicio en nuestra página de estado.'),
      ],
    },
    {
      id: 'suspension',
      titulo: 'Suspensión y cierre de cuentas',
      bloques: [
        p('Podemos suspender o cerrar tu cuenta, con o sin aviso previo, si infringís estos Términos, si tu cuenta representa un riesgo para la seguridad de otras personas o del servicio, si la ley nos lo exige o si la cuenta estuvo inactiva por un tiempo prolongado.'),
        p('Podés dejar de usar Zion cuando quieras. Para eliminar tu cuenta y tus datos, pedilo desde Ayuda y soporte; vamos a confirmar tu identidad antes de borrarla. Al eliminarla, tu perfil deja de ser visible y se borran tus datos personales, salvo lo que tengamos que conservar según la Política de privacidad. Los servidores de los que seas propietario se eliminan, salvo que antes transfieras su titularidad.'),
        p('Las secciones de estos Términos que por su naturaleza deben seguir vigentes después del cierre de la cuenta (por ejemplo, propiedad intelectual, exención de garantías, limitación de responsabilidad e indemnidad) siguen vigentes.'),
      ],
    },
    {
      id: 'garantias',
      titulo: 'Exención de garantías',
      bloques: [
        p('Zion se ofrece "tal cual" y "según disponibilidad". En la medida máxima que permita la ley, no damos garantías de ningún tipo, expresas o implícitas, incluidas las de comerciabilidad, idoneidad para un fin determinado, no infracción, disponibilidad continua, seguridad o ausencia de errores.'),
        p('No controlamos ni respaldamos el contenido que publican las personas usuarias, los servidores ni las apps de terceros, y no somos responsables por ese contenido.'),
      ],
    },
    {
      id: 'responsabilidad',
      titulo: 'Limitación de responsabilidad',
      bloques: [
        p('En la medida máxima que permita la ley, no somos responsables por daños indirectos, incidentales, especiales, consecuentes o punitivos, ni por pérdida de datos, de ganancias, de oportunidades o de reputación, que resulten del uso o de la imposibilidad de usar Zion, del contenido o la conducta de otras personas usuarias, o de accesos no autorizados a tu cuenta o tu contenido.'),
        p('Nada en estos Términos limita la responsabilidad que no se pueda limitar según la ley aplicable, ni los derechos que te correspondan como consumidor.'),
      ],
    },
    {
      id: 'indemnidad',
      titulo: 'Indemnidad',
      bloques: [
        p('Aceptás mantenernos indemnes frente a cualquier reclamo, daño, pérdida o gasto (incluidos honorarios razonables de abogados) que surja de tu contenido, de tu uso del servicio, de las apps que conectes o de tu incumplimiento de estos Términos o de la ley.'),
      ],
    },
    {
      id: 'cambios-terminos',
      titulo: 'Cambios a estos términos',
      bloques: [
        p('Podemos modificar estos Términos. Cuando lo hagamos, vamos a actualizar la fecha de "Última actualización" y, si el cambio es importante, te lo vamos a avisar dentro de la app antes de que entre en vigencia. Si seguís usando Zion después de un cambio, significa que lo aceptás. Si no estás de acuerdo, dejá de usar el servicio y pedí la eliminación de tu cuenta.'),
      ],
    },
    {
      id: 'generales',
      titulo: 'Disposiciones generales',
      bloques: [
        lista(
          'Si alguna parte de estos Términos se considera inválida, el resto sigue vigente.',
          'Que no hagamos cumplir alguna parte de estos Términos en un caso no significa que renunciemos a hacerlo después.',
          'No podés ceder tus derechos u obligaciones según estos Términos sin nuestro consentimiento. Nosotros podemos cederlos si el servicio cambia de titular.',
          'Estos Términos y la Política de privacidad son el acuerdo completo entre vos y nosotros sobre el uso de Zion.',
          'Si hay diferencias entre versiones de estos Términos en distintas plataformas, prevalece la versión más reciente.',
        ),
      ],
    },
    {
      id: 'contacto',
      titulo: 'Contacto',
      bloques: [
        p('Si tenés preguntas sobre estos Términos, querés apelar una sanción, denunciar contenido o pedir la eliminación de tu cuenta, escribinos desde la sección de Ayuda y soporte dentro de la app.'),
      ],
    },
  ],
}

export const PRIVACIDAD: DocumentoLegal = {
  titulo: 'Política de privacidad',
  actualizado: LEGAL_ACTUALIZADO,
  intro: [
    'Esta Política de privacidad explica qué información trata Zion cuando usás la app de escritorio, la app móvil o el sitio web, para qué la usamos, con quién la compartimos, cuánto tiempo la guardamos y qué derechos tenés sobre ella.',
    'Es la misma cuenta y son los mismos datos en todas las plataformas. Esta política forma parte de los Términos de servicio.',
  ],
  secciones: [
    {
      id: 'responsable',
      titulo: 'Quién es responsable de tus datos',
      bloques: [
        p('El responsable del tratamiento de tus datos es @anime1234rr, quien desarrolla y opera Zion. Para cualquier consulta sobre privacidad, escribinos desde Ayuda y soporte dentro de la app.'),
      ],
    },
    {
      id: 'datos-que-das',
      titulo: 'Información que nos das',
      bloques: [
        lista(
          'Datos de la cuenta: tu correo electrónico y tu contraseña (que se guarda cifrada con un algoritmo de hash, nunca en texto plano). Si iniciás sesión con un enlace mágico, solo usamos tu correo.',
          'Verificación en dos pasos: si la activás, se guarda el secreto de tu app de autenticación en nuestro proveedor de autenticación. Nunca guardamos los códigos que generás.',
          'Datos del perfil: nombre de usuario, nombre visible, biografía, avatar, banner, color de acento, fondo de la app y el estado que elegís (en línea, ausente, no molestar o invisible).',
          'Contenido: los mensajes, archivos, imágenes, videos, mensajes de voz, reacciones, hilos y publicaciones de foro que enviás, y los servidores, canales, roles, emojis y stickers que creás.',
          'Relaciones: solicitudes de amistad, amistades y bloqueos.',
          'Reportes: el motivo, la descripción y los mensajes que adjuntás como evidencia cuando reportás a alguien.',
          'Comunicaciones con nosotros: lo que nos escribís desde Ayuda y soporte.',
        ),
      ],
    },
    {
      id: 'datos-de-uso',
      titulo: 'Información que se genera cuando usás Zion',
      bloques: [
        lista(
          'Presencia: si estás conectado y la hora de tu última actividad, que se actualiza cada cierto tiempo mientras la app está abierta.',
          'Dispositivos conectados: mientras tenés Zion abierto, cada dispositivo se anuncia en un canal en tiempo real de tu cuenta para que tu estado sea el mismo en todos. Esa información solo existe mientras el dispositivo está conectado y no se guarda.',
          'Voz: a qué canal de voz estás conectado y si tenés el micrófono silenciado, el audio ensordecido, la cámara activa o la pantalla compartida.',
          'Lectura: qué canales y conversaciones ya leíste y las menciones pendientes, para mostrarte lo que no leíste.',
          'Notificaciones que generamos para vos.',
          'Membresías: a qué servidores pertenecés, desde cuándo y con qué roles.',
          'Registros de moderación: las sanciones de la plataforma y el registro de auditoría de cada servidor.',
          'Datos técnicos: tu dirección IP y la información básica que tu dispositivo envía al conectarse (como el tipo de sistema y la versión de la app), que nuestros proveedores registran para operar y proteger el servicio.',
        ),
      ],
    },
    {
      id: 'datos-locales',
      titulo: 'Información guardada en tu dispositivo',
      bloques: [
        p('Las apps guardan en tu propio dispositivo tu sesión iniciada, una caché de mensajes para que carguen más rápido, los borradores que no enviaste y tus preferencias de apariencia, accesibilidad, audio y notificaciones. Si elegís un fondo local, el archivo queda solo en tu dispositivo. Esta información se borra al cerrar sesión o al desinstalar la app, según el caso.'),
        p('El sitio web no usa cookies de publicidad ni de seguimiento.'),
      ],
    },
    {
      id: 'uso',
      titulo: 'Para qué usamos tu información',
      bloques: [
        lista(
          'Para crear y mantener tu cuenta, autenticarte y protegerla con la verificación en dos pasos.',
          'Para mostrar y sincronizar tus servidores, mensajes, perfil y estado entre tus dispositivos.',
          'Para mostrar tu perfil y tu presencia a las personas con las que compartís algo.',
          'Para que funcionen las llamadas de voz, el video y la pantalla compartida.',
          'Para enviarte notificaciones dentro de la app y, si las activás, notificaciones push.',
          'Para mostrar servidores en Explorar y personas con las que compartís algo en Explorar › Personas.',
          'Para revisar reportes, aplicar las normas, prevenir fraudes, spam y abusos, y mantener la seguridad del servicio.',
          'Para responder a tus consultas y apelaciones.',
          'Para corregir errores y mejorar el rendimiento.',
          'Para cumplir obligaciones legales.',
        ),
        p('No usamos tu información para publicidad, no armamos perfiles publicitarios y no vendemos tus datos.'),
      ],
    },
    {
      id: 'visibilidad',
      titulo: 'Quién puede ver tu información',
      bloques: [
        lista(
          'Tu perfil (nombre, avatar, banner, biografía, estado e insignias) lo ven las personas que comparten un servidor con vos, tus amistades y las personas con las que tenés una conversación.',
          'En Explorar › Personas solo aparecés para quienes comparten un servidor con vos, son tus amistades o tienen una conversación con vos. No aparecés para quienes bloqueaste.',
          'Tus mensajes en un servidor los ven quienes tienen permiso para ver ese canal.',
          'Tus mensajes directos solo los ven las personas que participan en la conversación.',
          'Si elegís el estado invisible, los demás te ven como desconectado.',
          'Los propietarios y administradores de un servidor ven el registro de auditoría de ese servidor.',
          'Los reportes y su evidencia solo los ve el equipo de staff con permiso de moderación. La persona reportada no sabe quién la reportó.',
          'Si reportás a alguien, los mensajes que adjuntás quedan copiados como evidencia. El equipo de staff los ve aunque la persona los borre.',
        ),
      ],
    },
    {
      id: 'reportes',
      titulo: 'Reportes y evidencias',
      bloques: [
        p('Cuando enviás un reporte guardamos: quién reporta, a quién, el motivo, tu descripción, el estado del reporte, quién del equipo lo revisó y la resolución. De cada mensaje que adjuntás guardamos una copia del texto, el enlace del adjunto, la fecha, el servidor y canal (o si fue un mensaje directo) y una huella digital SHA-256 que permite comprobar que la copia no se modificó.'),
        p('Usamos esta información solo para moderar y para resolver apelaciones. La guardamos mientras sea necesaria para esos fines y para la seguridad de la plataforma, incluso después de cerrar el reporte, y la eliminamos cuando deja de serlo.'),
      ],
    },
    {
      id: 'proveedores',
      titulo: 'Proveedores que tratan datos en nuestro nombre',
      bloques: [
        p('Para operar Zion usamos proveedores que tratan datos solo según nuestras instrucciones:'),
        lista(
          'Supabase: base de datos, autenticación, almacenamiento de archivos y mensajería en tiempo real. Ahí se guardan tu cuenta, tu perfil y tu contenido.',
          'Netlify: alojamiento del sitio web.',
          'Expo: distribución de actualizaciones de la app móvil.',
          'GitHub: descarga y actualizaciones de la app de escritorio.',
          'Google (servidor STUN): ayuda a que los dispositivos se conecten en las llamadas de voz y video. Solo recibe las direcciones de red necesarias para establecer la conexión; no recibe el audio ni el video.',
          'Better Stack (Better Uptime): página de estado del servicio.',
        ),
        p('Fuera de estos casos, solo compartimos información si la ley nos obliga, para proteger los derechos, la seguridad o la integridad de las personas usuarias o del servicio, o si el servicio cambia de titular, en cuyo caso esta política sigue aplicándose a tus datos.'),
      ],
    },
    {
      id: 'transferencias',
      titulo: 'Transferencias internacionales',
      bloques: [
        p('Nuestros proveedores pueden almacenar y procesar datos en servidores ubicados fuera de tu país. Al usar Zion, tus datos pueden transferirse a esos países, siempre con las protecciones que ofrecen esos proveedores.'),
      ],
    },
    {
      id: 'conservacion',
      titulo: 'Cuánto tiempo guardamos tu información',
      bloques: [
        lista(
          'La cuenta y el perfil: mientras tengas la cuenta.',
          'Los mensajes de un servidor: hasta que los borres, hasta que los borre la moderación del servidor, hasta que se elimine el servidor o según la retención de historial que configure el servidor.',
          'Los mensajes directos: hasta que los borres o se elimine tu cuenta.',
          'La presencia y el estado de voz: se reemplazan con cada actualización y no se guarda un historial.',
          'Los reportes, las sanciones y los registros de auditoría: mientras sean necesarios para la seguridad de la plataforma y para resolver apelaciones.',
          'Lo que tengamos que conservar por ley: durante el plazo que exija la ley.',
        ),
      ],
    },
    {
      id: 'seguridad',
      titulo: 'Seguridad de los datos',
      bloques: [
        p('Toda la información viaja cifrada entre tus dispositivos y nuestros servidores. Tu contraseña se guarda con un hash y nunca en texto plano. El acceso a cada dato está restringido por reglas en la base de datos que respetan los permisos de cada servidor, canal y conversación. Las acciones de staff exigen permisos específicos y quedan registradas.'),
        p('Ningún sistema es completamente seguro. Si detectamos un incidente que afecte tus datos, te lo vamos a avisar según lo que exija la ley. Si encontrás una vulnerabilidad, avisanos desde Ayuda y soporte.'),
      ],
    },
    {
      id: 'derechos',
      titulo: 'Tus derechos',
      bloques: [
        p('Según la ley de tu país, podés tener derecho a:'),
        lista(
          'Acceder a tus datos y pedir una copia.',
          'Corregir datos incorrectos: la mayoría los podés cambiar vos desde tu perfil y Seguridad.',
          'Pedir la eliminación de tu cuenta y tus datos.',
          'Oponerte a ciertos tratamientos o pedir que los limitemos.',
          'Pedir que te entreguemos tus datos en un formato que puedas llevar a otro servicio.',
          'Retirar tu consentimiento cuando el tratamiento se base en él.',
          'Presentar un reclamo ante la autoridad de protección de datos de tu país.',
        ),
        p('Desde la app podés editar tu perfil, cambiar tu correo y tu contraseña, activar o quitar la verificación en dos pasos, elegir qué avisos de seguridad recibís, bloquear personas y salir de cualquier servidor. Para ejercer los demás derechos, escribinos desde Ayuda y soporte. Vamos a confirmar tu identidad antes de responder.'),
      ],
    },
    {
      id: 'menores',
      titulo: 'Menores de edad',
      bloques: [
        p('Zion no está dirigido a personas menores de 13 años ni de la edad mínima que exija la ley de su país para usar servicios en línea sin el consentimiento de un adulto. No recopilamos a sabiendas datos de esas personas. Si sos madre, padre o tutor y creés que un menor nos dio sus datos, escribinos desde Ayuda y soporte y vamos a eliminar la cuenta.'),
      ],
    },
    {
      id: 'cambios',
      titulo: 'Cambios a esta política',
      bloques: [
        p('Si actualizamos esta política, vamos a cambiar la fecha de "Última actualización". Si el cambio es importante, te lo vamos a avisar dentro de la app antes de que entre en vigencia.'),
      ],
    },
    {
      id: 'contacto',
      titulo: 'Contacto',
      bloques: [
        p('Para cualquier consulta sobre tus datos o esta política, escribinos desde la sección de Ayuda y soporte dentro de la app.'),
      ],
    },
  ],
}
