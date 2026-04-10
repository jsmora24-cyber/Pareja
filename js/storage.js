/* ==========================================
   STORAGE - MANEJO DE PERSISTENCIA EN LOCALSTORAGE
   ========================================== */

const STORAGE_KEY = 'pareja_app';

// Estructura inicial de datos
const ESTRUCTURA_INICIAL = {
    proyectos: [],
    ahorros: [],
    retos: [],
    experiencias: []
};

/**
 * Obtiene todos los datos del localStorage
 * @returns {Object} Objeto con todas las secciones de datos
 */
function obtenerTodosDatos() {
    try {
        const datos = localStorage.getItem(STORAGE_KEY);
        return datos ? JSON.parse(datos) : clonar(ESTRUCTURA_INICIAL);
    } catch (error) {
        console.error('Error al obtener datos:', error);
        return clonar(ESTRUCTURA_INICIAL);
    }
}

/**
 * Guarda los datos completos en localStorage
 * @param {Object} datos - Datos a guardar
 */
function guardarTodosDatos(datos) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
        return true;
    } catch (error) {
        console.error('Error al guardar datos:', error);
        mostrarNotificacion('Error al guardar datos', 'error');
        return false;
    }
}

/**
 * Obtiene todos los elementos de una sección
 * @param {string} seccion - Nombre de la sección (proyectos, ahorros, retos, experiencias)
 * @returns {Array} Array con los elementos
 */
function obtenerElementos(seccion) {
    const datos = obtenerTodosDatos();
    return datos[seccion] || [];
}

/**
 * Obtiene un elemento específico por ID
 * @param {string} seccion - Nombre de la sección
 * @param {string} id - ID del elemento
 * @returns {Object|null} El elemento o null si no existe
 */
function obtenerElementoPorId(seccion, id) {
    const elementos = obtenerElementos(seccion);
    return elementos.find(elem => elem.id === id) || null;
}

/**
 * Agrega un nuevo elemento a una sección
 * @param {string} seccion - Nombre de la sección
 * @param {Object} elemento - Elemento a agregar (sin ID)
 * @returns {Object} Elemento con ID generado
 */
function agregarElemento(seccion, elemento) {
    const datos = obtenerTodosDatos();
    const nuevoElemento = {
        id: generarId(),
        ...elemento,
        fechaCreacion: new Date().toISOString().split('T')[0]
    };
    
    datos[seccion].push(nuevoElemento);
    guardarTodosDatos(datos);
    
    return nuevoElemento;
}

/**
 * Actualiza un elemento existente
 * @param {string} seccion - Nombre de la sección
 * @param {string} id - ID del elemento
 * @param {Object} actualizaciones - Cambios a aplicar
 * @returns {Object} Elemento actualizado
 */
function actualizarElemento(seccion, id, actualizaciones) {
    const datos = obtenerTodosDatos();
    const indice = datos[seccion].findIndex(elem => elem.id === id);
    
    if (indice === -1) {
        console.warn(`Elemento ${id} no encontrado en ${seccion}`);
        return null;
    }
    
    datos[seccion][indice] = {
        ...datos[seccion][indice],
        ...actualizaciones
    };
    
    guardarTodosDatos(datos);
    return datos[seccion][indice];
}

/**
 * Elimina un elemento
 * @param {string} seccion - Nombre de la sección
 * @param {string} id - ID del elemento a eliminar
 * @returns {boolean} true si se eliminó exitosamente
 */
function eliminarElemento(seccion, id) {
    const datos = obtenerTodosDatos();
    const longitudAnterior = datos[seccion].length;
    
    datos[seccion] = datos[seccion].filter(elem => elem.id !== id);
    
    if (datos[seccion].length < longitudAnterior) {
        guardarTodosDatos(datos);
        return true;
    }
    
    return false;
}

/**
 * Calcula el total de ahorros
 * @returns {number} Total en la moneda mostrada
 */
function calcularTotalAhorros() {
    const ahorros = obtenerElementos('ahorros');
    return ahorros.reduce((total, ahorro) => total + (parseFloat(ahorro.cantidad) || 0), 0);
}

/**
 * Obtiene ahorros agrupados por tipo
 * @returns {Object} Objeto con montos por tipo de ahorro
 */
function obtenerAhorrosPorTipo() {
    const ahorros = obtenerElementos('ahorros');
    const porTipo = {};
    
    ahorros.forEach(ahorro => {
        if (!porTipo[ahorro.tipo]) {
            porTipo[ahorro.tipo] = 0;
        }
        porTipo[ahorro.tipo] += parseFloat(ahorro.cantidad) || 0;
    });
    
    return porTipo;
}

/**
 * Limpia todos los datos (útil para reset)
 * @returns {void}
 */
function limpiarTodosDatos() {
    if (solicitarConfirmacion('¿Estás seguro que quieres eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
        localStorage.removeItem(STORAGE_KEY);
        mostrarNotificacion('Todos los datos han sido eliminados', 'warning');
    }
}

/**
 * Inicializa los datos con ejemplos si es la primera vez
 * @returns {void}
 */
function inicializarDatosEjemplo() {
    const datosExistentes = localStorage.getItem(STORAGE_KEY);
    
    if (datosExistentes) {
        return; // Ya hay datos, no sobreescribir
    }
    
    const datosEjemplo = {
        proyectos: [
            {
                id: generarId(),
                nombre: "Viaje a Japón",
                fechaObjetivo: "2026-12-25",
                descripcion: "Viaje romántico a Japón por 2 semanas",
                estado: "en-progreso",
                fechaCreacion: "2026-04-10"
            },
            {
                id: generarId(),
                nombre: "Renovar apartamento",
                fechaObjetivo: "2026-08-30",
                descripcion: "Pintar, nuevos muebles y decoración",
                estado: "pendiente",
                fechaCreacion: "2026-04-10"
            }
        ],
        ahorros: [
            {
                id: generarId(),
                tipo: "viaje",
                origen: "Bonificación trabajo",
                cantidad: 500,
                moneda: "USD",
                fecha: "2026-04-01"
            },
            {
                id: generarId(),
                tipo: "viaje",
                origen: "Ahorro mensual",
                cantidad: 300,
                moneda: "USD",
                fecha: "2026-04-05"
            },
            {
                id: generarId(),
                tipo: "casa",
                origen: "Fondo común",
                cantidad: 1000,
                moneda: "USD",
                fecha: "2026-03-15"
            }
        ],
        retos: [
            {
                id: generarId(),
                usuario: "Camila Ruiz",
                descripcion: "Hacer ejercicio 3 veces esta semana",
                subtareas: [
                    { id: generarId(), texto: "Lunes", completado: true },
                    { id: generarId(), texto: "Miércoles", completado: true },
                    { id: generarId(), texto: "Viernes", completado: false }
                ],
                completado: false,
                fechaCreacion: "2026-04-07"
            },
            {
                id: generarId(),
                usuario: "Sebastian Mora",
                descripcion: "Leer 2 capítulos del libro",
                subtareas: [
                    { id: generarId(), texto: "Lunes", completado: true },
                    { id: generarId(), texto: "Viernes", completado: true }
                ],
                completado: true,
                fechaCreacion: "2026-04-07"
            }
        ],
        experiencias: [
            {
                id: generarId(),
                pais: "Japón",
                ciudad: "Tokio",
                descripcion: "Primeros días increíbles en Tokio, visitamos Shibuya y el Palacio Imperial",
                imagen: "https://images.unsplash.com/photo-1552733073-5fb2e929edb6?w=400&h=300&fit=crop",
                fecha: "2026-04-01",
                coordenadas: { lat: 35.6762, lng: 139.6503 }
            },
            {
                id: generarId(),
                pais: "Francia",
                ciudad: "París",
                descripcion: "La ciudad del amor, caminatas por las orillas del Sena",
                imagen: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop",
                fecha: "2025-08-15",
                coordenadas: { lat: 48.8566, lng: 2.3522 }
            }
        ]
    };
    
    guardarTodosDatos(datosEjemplo);
}

/**
 * Exporta todos los datos a JSON
 * @returns {void}
 */
function exportarDatos() {
    const datos = obtenerTodosDatos();
    const fecha = new Date().toISOString().split('T')[0];
    exportarJSON(datos, `pareja-backup-${fecha}.json`);
    mostrarNotificacion('Datos exportados correctamente', 'success');
}

/**
 * Importa datos desde un archivo JSON (debe ser llamado desde un input file)
 * @param {File} archivo - Archivo JSON a importar
 * @returns {void}
 */
function importarDatos(archivo) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const datos = JSON.parse(e.target.result);
            guardarTodosDatos(datos);
            mostrarNotificacion('Datos importados correctamente', 'success');
            location.reload();
        } catch (error) {
            mostrarNotificacion('Error al importar archivo', 'error');
            console.error(error);
        }
    };
    reader.readAsText(archivo);
}
