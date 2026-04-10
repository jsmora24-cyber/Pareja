/* ==========================================
   AHORROS - LÓGICA DE GESTIÓN DE AHORROS
   ========================================== */

/**
 * Renderiza todos los ahorros y el resumen de totales
 */
function renderAhorros() {
    renderResumenAhorros();
    renderListaAhorros();
}

/**
 * Renderiza el resumen de totales por tipo
 */
function renderResumenAhorros() {
    const container = document.getElementById('resumen-por-tipo');
    const ahorros = obtenerElementos('ahorros');
    const total = calcularTotalAhorros();
    
    // Actualizar total general
    document.getElementById('total-ahorros').textContent = formatearMoneda(total, ahorros[0]?.moneda || 'USD');
    
    // Ahorros por tipo
    const porTipo = obtenerAhorrosPorTipo();
    const tiposColores = {
        viaje: { emoji: '✈️', color: '#2196F3' },
        casa: { emoji: '🏠', color: '#FF9800' },
        inversion: { emoji: '📈', color: '#4CAF50' },
        otro: { emoji: '📌', color: '#9C27B0' }
    };
    
    container.innerHTML = Object.entries(porTipo).map(([tipo, monto]) => {
        const info = tiposColores[tipo] || { emoji: '💰', color: '#E91E63' };
        return `
            <div class="summary-by-type" style="border-left: 4px solid ${info.color};">
                <div class="summary-by-type-label">${info.emoji} ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</div>
                <div class="summary-by-type-amount">${formatearMoneda(monto, ahorros[0]?.moneda || 'USD')}</div>
            </div>
        `;
    }).join('');
}

/**
 * Renderiza la lista de ahorros
 */
function renderListaAhorros() {
    const container = document.getElementById('ahorros-container');
    const ahorros = obtenerElementos('ahorros');
    
    if (ahorros.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💰</div>
                <h3 class="empty-state-title">No hay ahorros registrados</h3>
                <p class="empty-state-message">
                    Comienza a registrar vuestros ahorros para ver el progreso hacia vuestros sueños
                </p>
            </div>
        `;
        return;
    }
    
    const tiposEmoji = {
        viaje: '✈️',
        casa: '🏠',
        inversion: '📈',
        otro: '📌'
    };
    
    container.innerHTML = ahorros.map(ahorro => `
        <div class="ahorro-item fade-in">
            <div class="ahorro-info" style="flex: 1;">
                <div class="ahorro-tipo">${tiposEmoji[ahorro.tipo] || '💰'} ${ahorro.tipo}</div>
                <h4 style="margin: 8px 0 4px 0; font-size: var(--font-size-base);">${ahorro.origen}</h4>
                <div class="ahorro-origen">
                    📅 ${formatearFecha(ahorro.fecha, 'corta')}
                </div>
            </div>
            <div style="text-align: right;">
                <div class="ahorro-cantidad">${formatearMoneda(ahorro.cantidad, ahorro.moneda)}</div>
            </div>
            <button class="btn btn--danger btn--small" onclick="eliminarAhorro('${ahorro.id}')">
                🗑️
            </button>
        </div>
    `).join('');
}

/**
 * Abre el formulario para registrar un ahorro
 */
function abrirFormularioAhorro() {
    const modal = document.getElementById('form-ahorro-modal');
    const form = document.getElementById('form-ahorro');
    limpiarFormulario(form);
    
    // Establecer fecha de hoy
    const hoy = new Date().toISOString().split('T')[0];
    const inputFecha = form.querySelector('input[type="date"]');
    if (!inputFecha) {
        // Crear input de fecha si no existe
        const fechaInput = document.createElement('input');
        fechaInput.type = 'date';
        fechaInput.value = hoy;
        fechaInput.style.display = 'none';
        form.appendChild(fechaInput);
    }
    
    modal.classList.add('form-modal--active');
}

/**
 * Cierra el formulario de ahorro
 */
function cerrarFormularioAhorro() {
    const modal = document.getElementById('form-ahorro-modal');
    const form = document.getElementById('form-ahorro');
    modal.classList.remove('form-modal--active');
    limpiarFormulario(form);
}

/**
 * Guarda un nuevo ahorro
 * @param {Object} datos - Datos del ahorro
 */
function guardarAhorro(datos) {
    // Validación
    const validacion = validarFormulario(datos, ['tipo', 'origen', 'cantidad']);
    if (!validacion.valido) {
        validacion.errores.forEach(error => mostrarNotificacion(error, 'error'));
        return false;
    }
    
    // Convertir cantidad a número
    datos.cantidad = parseFloat(datos.cantidad);
    
    // Agregar fecha actual si no viene
    if (!datos.fecha) {
        datos.fecha = new Date().toISOString().split('T')[0];
    }
    
    agregarElemento('ahorros', datos);
    mostrarNotificacion('Ahorro registrado exitosamente', 'success');
    
    cerrarFormularioAhorro();
    renderAhorros();
    return true;
}

/**
 * Elimina un ahorro con confirmación
 * @param {string} idAhorro - ID del ahorro a eliminar
 */
function eliminarAhorro(idAhorro) {
    const ahorro = obtenerElementoPorId('ahorros', idAhorro);
    if (!ahorro) return;
    
    if (solicitarConfirmacion(`¿Eliminar este ahorro de ${formatearMoneda(ahorro.cantidad, ahorro.moneda)}?`)) {
        eliminarElemento('ahorros', idAhorro);
        mostrarNotificacion('Ahorro eliminado', 'success');
        renderAhorros();
    }
}

// ===== EVENT LISTENERS =====

document.addEventListener('DOMContentLoaded', () => {
    const btnNuevo = document.getElementById('btn-nuevo-ahorro');
    const btnCerrar = document.getElementById('close-form-ahorro');
    const btnCancelar = document.getElementById('cancel-form-ahorro');
    const formAhorro = document.getElementById('form-ahorro');
    
    if (btnNuevo) {
        btnNuevo.addEventListener('click', () => abrirFormularioAhorro());
    }
    
    if (btnCerrar) {
        btnCerrar.addEventListener('click', cerrarFormularioAhorro);
    }
    
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cerrarFormularioAhorro);
    }
    
    if (formAhorro) {
        formAhorro.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const datos = {
                tipo: document.getElementById('ahorro-tipo').value,
                origen: document.getElementById('ahorro-origen').value.trim(),
                cantidad: document.getElementById('ahorro-cantidad').value,
                moneda: document.getElementById('ahorro-moneda').value,
                fecha: new Date().toISOString().split('T')[0]
            };
            
            guardarAhorro(datos);
        });
    }
    
    // Cerrar modal al hacer clic fuera
    const modal = document.getElementById('form-ahorro-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cerrarFormularioAhorro();
            }
        });
    }
});
