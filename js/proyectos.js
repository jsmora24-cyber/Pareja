/* ==========================================
   PROYECTOS - LÓGICA DE PROYECTOS COMPARTIDOS
   ========================================== */

/**
 * Renderiza todos los proyectos en la UI
 */
function renderProyectos() {
    const container = document.getElementById('proyectos-container');
    const proyectos = obtenerElementos('proyectos');
    
    if (proyectos.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">📋</div>
                <h3 class="empty-state-title">No hay proyectos aún</h3>
                <p class="empty-state-message">
                    Crea tu primer proyecto compartido para comenzar a planificar juntos
                </p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = proyectos.map(proyecto => `
        <div class="card proyecto-card fade-in">
            <div class="card-header">
                <div>
                    <h4 class="card-title">${proyecto.nombre}</h4>
                    <p style="color: var(--color-text-secondary); margin: 0; font-size: var(--font-size-sm);">
                        📅 ${formatearFecha(proyecto.fechaObjetivo, 'corta')}
                    </p>
                </div>
            </div>
            
            <div class="card-content">
                ${proyecto.descripcion ? `<p style="color: var(--color-text-secondary); margin: 0;">${proyecto.descripcion}</p>` : ''}
                
                <div class="proyecto-estado ${proyecto.estado}">
                    ${proyecto.estado === 'pendiente' ? '⏳ Pendiente' : 
                      proyecto.estado === 'en-progreso' ? '⚙️ En Progreso' : 
                      '✅ Completado'}
                </div>
            </div>
            
            <div class="card-footer">
                <button class="btn btn--primary btn--small" data-id="${proyecto.id}" onclick="abrirFormularioProyecto('${proyecto.id}')">
                    ✏️ Editar
                </button>
                <button class="btn btn--danger btn--small" data-id="${proyecto.id}" onclick="eliminarProyecto('${proyecto.id}')">
                    🗑️ Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Abre el formulario para crear o editar un proyecto
 * @param {string|null} idProyecto - ID del proyecto a editar, null para crear nuevo
 */
function abrirFormularioProyecto(idProyecto = null) {
    const modal = document.getElementById('form-proyecto-modal');
    const form = document.getElementById('form-proyecto');
    const titulo = modal.querySelector('.form-title');
    
    // Limpiar formulario
    limpiarFormulario(form);
    
    if (idProyecto) {
        // Cargar datos existentes
        const proyecto = obtenerElementoPorId('proyectos', idProyecto);
        if (proyecto) {
            titulo.textContent = 'Editar Proyecto';
            document.getElementById('proyecto-nombre').value = proyecto.nombre;
            document.getElementById('proyecto-descripcion').value = proyecto.descripcion || '';
            document.getElementById('proyecto-fecha').value = proyecto.fechaObjetivo;
            document.getElementById('proyecto-estado').value = proyecto.estado;
            form.dataset.editando = idProyecto;
        }
    } else {
        titulo.textContent = 'Nuevo Proyecto';
        form.dataset.editando = '';
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('proyecto-fecha').min = hoy;
    }
    
    modal.classList.add('form-modal--active');
}

/**
 * Cierra el formulario de proyecto
 */
function cerrarFormularioProyecto() {
    const modal = document.getElementById('form-proyecto-modal');
    const form = document.getElementById('form-proyecto');
    modal.classList.remove('form-modal--active');
    limpiarFormulario(form);
    delete form.dataset.editando;
}

/**
 * Guarda un proyecto (crear o actualizar)
 * @param {Object} datos - Datos del proyecto
 */
function guardarProyecto(datos) {
    const form = document.getElementById('form-proyecto');
    const idEdicion = form.dataset.editando;
    
    // Validación
    const validacion = validarFormulario(datos, ['nombre', 'fechaObjetivo', 'estado']);
    if (!validacion.valido) {
        validacion.errores.forEach(error => mostrarNotificacion(error, 'error'));
        return false;
    }
    
    if (idEdicion) {
        // Actualizar
        actualizarElemento('proyectos', idEdicion, datos);
        mostrarNotificacion('Proyecto actualizado correctamente', 'success');
    } else {
        // Crear
        agregarElemento('proyectos', datos);
        mostrarNotificacion('Proyecto creado exitosamente', 'success');
    }
    
    cerrarFormularioProyecto();
    renderProyectos();
    return true;
}

/**
 * Elimina un proyecto con confirmación
 * @param {string} idProyecto - ID del proyecto a eliminar
 */
function eliminarProyecto(idProyecto) {
    const proyecto = obtenerElementoPorId('proyectos', idProyecto);
    if (!proyecto) return;
    
    if (solicitarConfirmacion(`¿Eliminar el proyecto "${proyecto.nombre}"?`)) {
        eliminarElemento('proyectos', idProyecto);
        mostrarNotificacion('Proyecto eliminado', 'success');
        renderProyectos();
    }
}

/**
 * Cambia el estado de un proyecto
 * @param {string} idProyecto - ID del proyecto
 * @param {string} nuevoEstado - Nuevo estado
 */
function cambiarEstadoProyecto(idProyecto, nuevoEstado) {
    actualizarElemento('proyectos', idProyecto, { estado: nuevoEstado });
    renderProyectos();
}

// ===== EVENT LISTENERS =====

document.addEventListener('DOMContentLoaded', () => {
    const btnNuevo = document.getElementById('btn-nuevo-proyecto');
    const btnCerrar = document.getElementById('close-form-proyecto');
    const btnCancelar = document.getElementById('cancel-form-proyecto');
    const formProyecto = document.getElementById('form-proyecto');
    
    if (btnNuevo) {
        btnNuevo.addEventListener('click', () => abrirFormularioProyecto());
    }
    
    if (btnCerrar) {
        btnCerrar.addEventListener('click', cerrarFormularioProyecto);
    }
    
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cerrarFormularioProyecto);
    }
    
    if (formProyecto) {
        formProyecto.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const datos = {
                nombre: document.getElementById('proyecto-nombre').value.trim(),
                descripcion: document.getElementById('proyecto-descripcion').value.trim(),
                fechaObjetivo: document.getElementById('proyecto-fecha').value,
                estado: document.getElementById('proyecto-estado').value
            };
            
            guardarProyecto(datos);
        });
    }
    
    // Cerrar modal al hacer clic fuera
    const modal = document.getElementById('form-proyecto-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cerrarFormularioProyecto();
            }
        });
    }
});
