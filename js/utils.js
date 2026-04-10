/* ==========================================
   UTILIDADES - FUNCIONES HELPER
   ========================================== */

/**
 * Formatea una fecha a formato legible
 * @param {Date|string} date - Fecha a formatear
 * @param {string} formato - Formato deseado ('corta', 'completa', 'iso')
 * @returns {string} Fecha formateada
 */
function formatearFecha(date, formato = 'corta') {
    const d = new Date(date);
    const opciones = {
        corta: { month: 'short', day: 'numeric', year: 'numeric' },
        completa: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
        iso: { year: 'numeric', month: '2-digit', day: '2-digit' }
    };
    
    const locales = 'es-ES';
    return d.toLocaleDateString(locales, opciones[formato] || opciones.corta);
}

/**
 * Genera un ID único simple
 * @returns {string} ID único
 */
function generarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Valida que los campos requeridos del formulario tengan valores
 * @param {Object} data - Objeto con datos del formulario
 * @param {Array<string>} camposRequeridos - Lista de campos que deben estar presentes
 * @returns {Object} { valido: boolean, errores: Array<string> }
 */
function validarFormulario(data, camposRequeridos) {
    const errores = [];
    
    camposRequeridos.forEach(campo => {
        if (!data[campo] || (typeof data[campo] === 'string' && data[campo].trim() === '')) {
            errores.push(`El campo "${campo}" es requerido`);
        }
    });
    
    return {
        valido: errores.length === 0,
        errores: errores
    };
}

/**
 * Muestra una notificación toast en la UI
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de notificación ('success', 'error', 'warning', 'info')
 * @param {number} duracion - Duración en ms (default: 3000)
 */
function mostrarNotificacion(mensaje, tipo = 'info', duracion = 3000) {
    const container = document.getElementById('notifications');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification notification--${tipo} fade-in`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span>${mensaje}</span>
            <button class="btn-close" style="margin-left: auto;">×</button>
        </div>
    `;
    
    container.appendChild(notification);
    
    const closeBtn = notification.querySelector('.btn-close');
    const removerNotificacion = () => {
        notification.classList.add('notification-exit');
        setTimeout(() => notification.remove(), 300);
    };
    
    closeBtn.addEventListener('click', removerNotificacion);
    
    if (duracion > 0) {
        setTimeout(removerNotificacion, duracion);
    }
}

/**
 * Solicita confirmación al usuario
 * @param {string} mensaje - Mensaje de confirmación
 * @returns {boolean} true si confirma, false si cancela
 */
function solicitarConfirmacion(mensaje) {
    return confirm(mensaje);
}

/**
 * Formatea un número como moneda
 * @param {number} monto - Monto a formatear
 * @param {string} moneda - Código de moneda (USD, EUR, etc)
 * @returns {string} Monto formateado
 */
function formatearMoneda(monto, moneda = 'COP') {
    const formateador = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: moneda,
    });
    return formateador.format(monto);
}

/**
 * Obtiene diferencia de días entre dos fechas
 * @param {Date|string} fecha1 
 * @param {Date|string} fecha2 
 * @returns {number} Número de días
 */
function diasEntre(fecha1, fecha2) {
    const d1 = new Date(fecha1);
    const d2 = new Date(fecha2);
    const diferencia = Math.abs(d2 - d1);
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
}

/**
 * Retorna el estado de progreso visual de un proyecto
 * @param {string} estado - Estado del proyecto
 * @returns {number} Porcentaje de progreso (0-100)
 */
function obtenerProgresoEstado(estado) {
    const progresos = {
        'pendiente': 0,
        'en-progreso': 50,
        'completado': 100
    };
    return progresos[estado] || 0;
}

/**
 * Limpia el formulario y realiza reset visual
 * @param {HTMLFormElement} formulario 
 */
function limpiarFormulario(formulario) {
    formulario.reset();
    formulario.querySelectorAll('input, textarea, select').forEach(field => {
        field.classList.remove('error');
    });
}

/**
 * Clona un objeto profundamente
 * @param {Object} obj - Objeto a clonar
 * @returns {Object} Clon profundo del objeto
 */
function clonar(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce - retarda la ejecución de una función
 * @param {Function} func - Función a ejecutar
 * @param {number} espera - Milisegundos a esperar
 * @returns {Function} Función con debounce aplicado
 */
function debounce(func, espera) {
    let timeout;
    return function ejecutar(...args) {
        const posteriormente = () => {
            timeout = null;
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(posteriormente, espera);
    };
}

/**
 * Detecta si es dispositivo móvil
 * @returns {boolean}
 */
function esMovil() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Animación suave de elementos
 * @param {HTMLElement} elemento - Elemento a animar
 * @param {string} animacion - Nombre de la animación CSS
 */
function animar(elemento, animacion) {
    elemento.classList.remove(animacion);
    void elemento.offsetWidth; // Trigger reflow
    elemento.classList.add(animacion);
}

/**
 * Exporta datos a JSON (para descarga)
 * @param {Object} datos - Datos a exportar
 * @param {string} nombreArchivo - Nombre del archivo
 */
function exportarJSON(datos, nombreArchivo = 'datos.json') {
    const json = JSON.stringify(datos, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Obtiene un parámetro de URL
 * @param {string} param - Nombre del parámetro
 * @returns {string|null} Valor del parámetro
 */
function obtenerParamURL(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}
