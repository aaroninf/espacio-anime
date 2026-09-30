# ESPACIO ANIME — INSTRUCCIONES PERMANENTES

## IDENTIDAD DEL PROYECTO

Nombre: espacio_anime

Espacio Anime es una plataforma web en español para descubrir y seguir anime.

El producto se centra actualmente en cuatro pilares:

- Descubrir
- Franquicias
- Mi lista
- Afinidad

El proyecto ya existe y está desarrollado principalmente con HTML, CSS y JavaScript.

NO se debe rehacer desde cero. Se debe conservar la identidad visual existente y aprovechar todo lo que ya está bien construido, mientras se limpia la arquitectura, se eliminan funcionalidades antiguas y se desarrolla Mi lista como nueva pieza central.

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
   - Mi lista
   - Afinidad

5. Colección, España y Actualidad pertenecen a una etapa anterior y deben eliminarse del proyecto actual.

6. No introducir frameworks o dependencias nuevas sin una razón técnica clara.

7. Mantener HTML + CSS + JavaScript siempre que sea suficiente.

8. No crear backend ficticio ni sistemas de autenticación simulados.

9. Para la primera versión de Mi lista, utilizar almacenamiento local si es suficiente, pero diseñar la arquitectura pensando en una futura cuenta de usuario y sincronización.

10. No convertir Mi lista en una red social.

11. No añadir funcionalidades simplemente porque sean posibles. Cada funcionalidad debe ayudar a descubrir, elegir, entender o seguir anime.

12. No eliminar archivos o datos sin comprobar previamente sus dependencias.

13. Antes de una modificación importante:

    - analizar;
    - explicar;
    - proponer;
    - modificar;
    - comprobar.

14. Cuando una decisión pueda afectar a la estética existente, priorizar conservarla.

15. Cuando existan varias soluciones técnicas, preferir la más sencilla que cumpla correctamente el objetivo.

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