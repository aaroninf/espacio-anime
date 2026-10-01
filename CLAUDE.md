# ESPACIO ANIME — INSTRUCCIONES PERMANENTES

## IDENTIDAD DEL PROYECTO

Nombre: espacio_anime

Espacio Anime es una plataforma web en español para descubrir y seguir anime.

El producto se centra actualmente en cuatro pilares:

- Descubrir
- Franquicias
- Afinidad
- Mi espacio

Los cuatro pilares están construidos y funcionando, y la web está publicada en GitHub Pages. La fase actual es el lanzamiento (pulido, dominio, SEO): la hoja de ruta está en la sección 5 del documento principal.

El proyecto está desarrollado con HTML, CSS y JavaScript. NO se debe rehacer desde cero: se debe conservar la identidad visual existente y aprovechar todo lo que ya está bien construido.

El objetivo es convertir Espacio Anime en una experiencia coherente que permita:

- descubrir anime;
- explorar franquicias;
- recibir recomendaciones personalizadas;
- saber dónde ver una obra;
- llevar el seguimiento personal del usuario.

Este proyecto contiene el código real de Espacio Anime y debe evolucionarse de forma progresiva, evitando sobreingeniería y cambios visuales innecesarios.

---

# CONTEXTO DEL PROYECTO

Antes de realizar cambios importantes, consulta los documentos de contexto disponibles dentro del proyecto.

Documento principal:

- documentos/ESPACIO_ANIME_DOCUMENTACION_COMPLETA.md

Este documento contiene la visión de producto, el estado actual del proyecto, el detalle técnico de cómo funciona todo por dentro (filtros, extractor, datos) y los frentes de trabajo abiertos. Antes fusionaba cuatro archivos independientes (MASTER_CONTEXT, CURRENT_STATE, GUIA_TECNICA y EXTRACTOR_FILTROS_Y_LOGICA); ahora es uno solo, mantenlo así — actualízalo cuando cambie algo relevante, sin volver a fragmentarlo.

Si existe alguna discrepancia entre una suposición y el código real del proyecto, inspecciona primero el código real y no inventes información.

---

# REGLAS PRINCIPALES

1. No rehacer Espacio Anime desde cero.

2. Mantener la identidad visual existente salvo que exista una razón clara para modificarla.

3. Priorizar:

   - funcionamiento;
   - UX;
   - arquitectura limpia;
   - mantenibilidad;
   - simplicidad;
   - escalabilidad.

4. El núcleo actual del producto es exclusivamente:

   - Descubrir
   - Franquicias
   - Afinidad
   - Mi espacio

5. No introducir frameworks o dependencias nuevas sin una razón técnica clara.

6. Mantener HTML + CSS + JavaScript siempre que sea suficiente.

7. No crear backend ficticio ni sistemas de autenticación simulados.

8. Mi espacio guarda los datos en almacenamiento local (`localStorage`). Las cuentas de usuario con contraseña y la sincronización son una fase futura: no adelantarlas sin que se pida.

9. No convertir Mi espacio en una red social.

10. No añadir funcionalidades simplemente porque sean posibles. Cada funcionalidad debe ayudar a descubrir, elegir, entender o seguir anime.

11. No eliminar archivos o datos sin comprobar previamente sus dependencias.

12. Antes de una modificación importante:

    - analizar;
    - explicar;
    - proponer;
    - modificar;
    - comprobar.

13. Cuando una decisión pueda afectar a la estética existente, priorizar conservarla.

14. Cuando existan varias soluciones técnicas, preferir la más sencilla que cumpla correctamente el objetivo.

---

# FORMA DE TRABAJAR

No quiero respuestas genéricas.

Cuando analices código, referencia siempre los archivos reales del proyecto.

Cuando modifiques código, explica brevemente qué has cambiado y por qué.

Si detectas un problema que no pertenece a la tarea actual pero puede ser importante, indícalo como:

"Pendiente"

No lo modifiques sin autorización.

Antes de modificar archivos importantes, comprueba sus dependencias y cómo interactúan con el resto del proyecto.

No supongas que una funcionalidad está obsoleta simplemente por su nombre: comprueba primero su uso real.

No elimines código, datos, componentes o archivos importantes sin comprobar previamente qué dependencias tienen.

---

# PRINCIPIO GENERAL

El objetivo no es añadir cada vez más funcionalidades.

El objetivo es hacer Espacio Anime más coherente, limpio y útil.

Cada cambio debe contribuir a ese objetivo.