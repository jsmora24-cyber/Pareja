/* ==========================================
   RETOS - LÓGICA DE RETOS DE PAREJA
   ========================================== */

let retoExpandidoId = null;
let retoEditandoId = null;
let retoSemanaVisible = {};
const USUARIO_1 = 'Camila Ruiz';
const USUARIO_2 = 'Sebastian Mora';
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function normalizarUsuarioReto(usuario) {
    if (usuario === 'Usuario 1') return USUARIO_1;
    if (usuario === 'Usuario 2') return USUARIO_2;
    return usuario;
}

function obtenerDiasSeleccionados() {
    return Array.from(document.querySelectorAll('#reto-dias-selector input[type="checkbox"]:checked'))
        .map(input => Number(input.value));
}

function obtenerEtiquetaDias(diasSemana = []) {
    if (!diasSemana.length) return 'Sin días definidos';
    return diasSemana.map(dia => DIAS_SEMANA[dia].slice(0, 3)).join(', ');
}

function obtenerDiasDesdeSeguimiento(seguimiento = []) {
    const dias = new Set();
    seguimiento.forEach(item => {
        const fecha = new Date(`${item.fecha}T12:00:00`);
        dias.add(fecha.getDay());
    });
    return Array.from(dias).sort((a, b) => a - b);
}

function obtenerInicioSemana(fechaIso) {
    const fecha = new Date(`${fechaIso}T12:00:00`);
    const dia = fecha.getDay();
    const ajuste = dia === 0 ? -6 : 1 - dia;
    fecha.setDate(fecha.getDate() + ajuste);
    return fecha;
}

function agruparSeguimientoPorSemana(seguimiento = []) {
    const grupos = [];
    seguimiento.forEach(item => {
        const inicioSemana = obtenerInicioSemana(item.fecha);
        const clave = inicioSemana.toISOString().split('T')[0];
        let grupo = grupos.find(entry => entry.key === clave);

        if (!grupo) {
            const finSemana = new Date(inicioSemana);
            finSemana.setDate(finSemana.getDate() + 6);
            grupo = {
                key: clave,
                inicio: clave,
                fin: finSemana.toISOString().split('T')[0],
                items: [],
            };
            grupos.push(grupo);
        }

        grupo.items.push(item);
    });

    return grupos;
}

function obtenerIndiceSemanaReto(reto) {
    const semanas = agruparSeguimientoPorSemana(reto.seguimiento || []);
    if (!semanas.length) {
        return 0;
    }

    if (typeof retoSemanaVisible[reto.id] === 'number') {
        return Math.max(0, Math.min(retoSemanaVisible[reto.id], semanas.length - 1));
    }

    return 0;
}

function generarSeguimiento(fechaInicio, fechaFin, diasSemana) {
    const seguimiento = [];
    const inicio = new Date(`${fechaInicio}T12:00:00`);
    const fin = new Date(`${fechaFin}T12:00:00`);

    for (let actual = new Date(inicio); actual <= fin; actual.setDate(actual.getDate() + 1)) {
        if (diasSemana.includes(actual.getDay())) {
            seguimiento.push({
                id: generarId(),
                fecha: actual.toISOString().split('T')[0],
                completado: false,
                valor: '',
                nota: '',
            });
        }
    }

    return seguimiento;
}

function retoItems(reto) {
    if (Array.isArray(reto.seguimiento) && reto.seguimiento.length > 0) {
        return reto.seguimiento;
    }
    return reto.subtareas || [];
}

function retoCompletados(reto) {
    return retoItems(reto).filter(item => item.completado).length;
}

function retoTotal(reto) {
    return retoItems(reto).length;
}

function retoEstaCompleto(reto) {
    const total = retoTotal(reto);
    return total > 0 && retoCompletados(reto) === total;
}

function inicializarReglaReto() {
    const ruleBox = document.getElementById('reto-rule-box');
    const closeBtn = document.getElementById('reto-rule-close');
    if (!ruleBox || !closeBtn) return;

    const oculta = localStorage.getItem('pareja_ocultar_regla_reto') === '1';
    if (oculta) {
        ruleBox.style.display = 'none';
    }

    closeBtn.addEventListener('click', () => {
        ruleBox.style.display = 'none';
        localStorage.setItem('pareja_ocultar_regla_reto', '1');
        mostrarNotificacion('Regla del reto oculta', 'success');
    });
}

/**
 * Renderiza todos los retos en vista resumida con detalle desplegable
 */
function renderRetos() {
    const container = document.getElementById('retos-container');
    const retos = obtenerElementos('retos').map(reto => ({
        ...reto,
        usuario: normalizarUsuarioReto(reto.usuario),
    }));

    if (retos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎯</div>
                <p class="empty-state-message">No hay retos aún</p>
            </div>
        `;
        verificarYMostrarRecompensa();
        return;
    }

    if (retoExpandidoId && !retos.some(r => r.id === retoExpandidoId)) {
        retoExpandidoId = null;
    }

    container.innerHTML = retos.map(reto => renderarRetoCard(reto, reto.id === retoExpandidoId)).join('');

    container.querySelectorAll('.reto-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn--danger') || e.target.closest('input[type="checkbox"]')) {
                return;
            }
            const id = card.dataset.retoId;
            toggleDetalleReto(id);
        });
    });
    
    // Verificar y mostrar recompensa
    verificarYMostrarRecompensa();
}

/**
 * Renderiza una tarjeta de reto resumida
 * @param {Object} reto - Objeto del reto
 * @param {boolean} expandido - Si el detalle está visible
 * @returns {string} HTML de la tarjeta
 */
function renderarRetoCard(reto, expandido) {
    const totalSubtareas = retoTotal(reto);
    const completadas = retoCompletados(reto);
    const porcentaje = totalSubtareas > 0 ? (completadas / totalSubtareas) * 100 : 0;
    const nombreReto = (reto.nombre && reto.nombre.trim()) || `Reto de ${reto.usuario}`;
    const usaSeguimiento = Array.isArray(reto.seguimiento) && reto.seguimiento.length > 0;
    const semanas = usaSeguimiento ? agruparSeguimientoPorSemana(reto.seguimiento) : [];
    const semanaIndex = usaSeguimiento ? obtenerIndiceSemanaReto(reto) : 0;
    const semanaActual = semanas[semanaIndex];
    
    return `
        <div class="reto-card ${reto.completado ? 'completado' : ''} ${expandido ? 'reto-card--expandido' : ''} fade-in" data-reto-id="${reto.id}">
            <div class="reto-card-resumen">
                <div>
                    <h4 class="reto-nombre">${nombreReto}</h4>
                </div>
                <span class="reto-meta">${completadas}/${totalSubtareas}</span>
            </div>

            ${expandido ? `
                <div class="reto-detalle">
                    <p class="reto-descripcion">${reto.descripcion}</p>
                    <p class="reto-meta">${reto.usuario} · ${completadas}/${totalSubtareas} ${usaSeguimiento ? 'sesiones' : 'días'}</p>
                    ${totalSubtareas > 0 ? `
                        <div style="margin-bottom: var(--spacing-md);">
                            <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-bottom: var(--spacing-sm);">
                                Progreso: ${completadas}/${totalSubtareas}
                            </div>
                            <div style="height: 8px; background-color: var(--color-bg-primary); border-radius: var(--radius-full); overflow: hidden;">
                                <div style="height: 100%; background: linear-gradient(90deg, var(--color-accent-primary), var(--color-accent-secondary)); width: ${porcentaje}%; transition: width 0.3s ease;"></div>
                            </div>
                        </div>
                    ` : ''}

                    ${usaSeguimiento ? `
                        <div class="reto-detalle-resumen">
                            <div class="reto-detalle-chip"><strong>Desde:</strong><br>${formatearFecha(reto.fechaInicio || reto.seguimiento[0]?.fecha)}</div>
                            <div class="reto-detalle-chip"><strong>Hasta:</strong><br>${formatearFecha(reto.fechaFin || reto.seguimiento[reto.seguimiento.length - 1]?.fecha)}</div>
                            <div class="reto-detalle-chip"><strong>Días:</strong><br>${obtenerEtiquetaDias(reto.diasSemana || [])}</div>
                            <div class="reto-detalle-chip"><strong>Variable:</strong><br>${reto.variable || 'Solo cumplimiento'}</div>
                        </div>
                        ${reto.objetivoDiario ? `<p class="reto-meta" style="margin-bottom: var(--spacing-lg);">${reto.objetivoDiario}</p>` : ''}
                        <div class="reto-semana-header" onclick="event.stopPropagation()">
                            <button class="btn btn--secondary btn--small" ${semanaIndex === 0 ? 'disabled' : ''} onclick="event.stopPropagation(); cambiarSemanaReto('${reto.id}', -1)">← Semana anterior</button>
                            <div class="reto-semana-titulo">
                                <strong>Semana ${semanaIndex + 1} de ${semanas.length}</strong>
                                <span>${semanaActual ? `${formatearFecha(semanaActual.inicio)} - ${formatearFecha(semanaActual.fin)}` : ''}</span>
                            </div>
                            <button class="btn btn--secondary btn--small" ${semanaIndex >= semanas.length - 1 ? 'disabled' : ''} onclick="event.stopPropagation(); cambiarSemanaReto('${reto.id}', 1)">Semana siguiente →</button>
                        </div>
                        <div class="reto-semana-grid">
                            ${(semanaActual?.items || []).map(item => `
                                <div class="reto-seguimiento-item reto-seguimiento-item--compacto" onclick="event.stopPropagation()">
                                    <div class="reto-seguimiento-header reto-seguimiento-header--compacto">
                                        <span class="reto-seguimiento-fecha">${formatearFecha(item.fecha, 'completa')}</span>
                                        <label class="reto-subtarea reto-subtarea--compacta" style="padding:0; background:transparent;">
                                            <input 
                                                type="checkbox"
                                                ${item.completado ? 'checked' : ''}
                                                onchange="toggleSeguimiento('${reto.id}', '${item.id}')"
                                            >
                                            <span class="reto-subtarea-texto">Cumplido</span>
                                        </label>
                                    </div>
                                    <div class="reto-seguimiento-controles reto-seguimiento-controles--compactos">
                                        <input type="text" value="${item.valor || ''}" placeholder="${reto.variable || 'Valor'}" onchange="actualizarValorSeguimiento('${reto.id}', '${item.id}', this.value)" onclick="event.stopPropagation()">
                                        <textarea rows="2" placeholder="Nota del día" onchange="actualizarNotaSeguimiento('${reto.id}', '${item.id}', this.value)" onclick="event.stopPropagation()">${item.nota || ''}</textarea>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="reto-subtareas">
                            ${reto.subtareas?.map(subtarea => `
                                <label class="reto-subtarea" onclick="event.stopPropagation()">
                                    <input 
                                        type="checkbox" 
                                        ${subtarea.completado ? 'checked' : ''}
                                        data-reto-id="${reto.id}"
                                        data-subtarea-id="${subtarea.id}"
                                        onchange="toggleSubtarea('${reto.id}', '${subtarea.id}')"
                                    >
                                    <span class="reto-subtarea-texto">${subtarea.texto}</span>
                                </label>
                            `).join('') || '<p style="color: var(--color-text-secondary); margin: 0;">Sin subtareas</p>'}
                        </div>
                    `}
                    <div class="reto-detalle-acciones">
                        <button class="btn btn--secondary btn--small" onclick="event.stopPropagation(); editarReto('${reto.id}')">✏️ Editar</button>
                        <button class="btn btn--danger btn--small" onclick="event.stopPropagation(); eliminarReto('${reto.id}')">🗑️ Eliminar</button>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function toggleDetalleReto(idReto) {
    retoExpandidoId = retoExpandidoId === idReto ? null : idReto;
    if (retoExpandidoId && typeof retoSemanaVisible[idReto] !== 'number') {
        retoSemanaVisible[idReto] = 0;
    }
    renderRetos();
}

function cambiarSemanaReto(idReto, direccion) {
    const reto = obtenerElementoPorId('retos', idReto);
    if (!reto || !Array.isArray(reto.seguimiento)) return;

    const semanas = agruparSeguimientoPorSemana(reto.seguimiento);
    const actual = typeof retoSemanaVisible[idReto] === 'number' ? retoSemanaVisible[idReto] : 0;
    retoSemanaVisible[idReto] = Math.max(0, Math.min(actual + direccion, semanas.length - 1));
    retoExpandidoId = idReto;
    renderRetos();
}

/**
 * Abre el formulario para crear un nuevo reto
 */
function abrirFormularioReto() {
    const modal = document.getElementById('form-reto-modal');
    const form = document.getElementById('form-reto');
    const title = document.getElementById('reto-form-title');
    const submitBtn = document.getElementById('reto-submit-btn');
    limpiarFormulario(form);
    retoEditandoId = null;
    document.querySelectorAll('#reto-dias-selector input[type="checkbox"]').forEach(input => {
        input.checked = false;
    });
    if (title) title.textContent = 'Nuevo Reto';
    if (submitBtn) submitBtn.textContent = 'Crear Reto';
    modal.classList.add('form-modal--active');
}

/**
 * Cierra el formulario de reto
 */
function cerrarFormularioReto() {
    const modal = document.getElementById('form-reto-modal');
    const form = document.getElementById('form-reto');
    const title = document.getElementById('reto-form-title');
    const submitBtn = document.getElementById('reto-submit-btn');
    modal.classList.remove('form-modal--active');
    limpiarFormulario(form);
    document.querySelectorAll('#reto-dias-selector input[type="checkbox"]').forEach(input => {
        input.checked = false;
    });
    retoEditandoId = null;
    if (title) title.textContent = 'Nuevo Reto';
    if (submitBtn) submitBtn.textContent = 'Crear Reto';
}

function editarReto(idReto) {
    const reto = obtenerElementoPorId('retos', idReto);
    if (!reto) return;

    const modal = document.getElementById('form-reto-modal');
    const title = document.getElementById('reto-form-title');
    const submitBtn = document.getElementById('reto-submit-btn');
    const diasSemana = Array.isArray(reto.diasSemana) && reto.diasSemana.length
        ? reto.diasSemana
        : obtenerDiasDesdeSeguimiento(reto.seguimiento || []);

    retoEditandoId = idReto;
    document.getElementById('reto-usuario').value = normalizarUsuarioReto(reto.usuario);
    document.getElementById('reto-nombre').value = reto.nombre || '';
    document.getElementById('reto-descripcion').value = reto.descripcion || '';
    document.getElementById('reto-fecha-inicio').value = reto.fechaInicio || reto.seguimiento?.[0]?.fecha || '';
    document.getElementById('reto-fecha-fin').value = reto.fechaFin || reto.seguimiento?.[reto.seguimiento.length - 1]?.fecha || '';
    document.getElementById('reto-variable').value = reto.variable || '';
    document.getElementById('reto-objetivo-diario').value = reto.objetivoDiario || '';

    document.querySelectorAll('#reto-dias-selector input[type="checkbox"]').forEach(input => {
        input.checked = diasSemana.includes(Number(input.value));
    });

    if (title) title.textContent = 'Modificar Reto';
    if (submitBtn) submitBtn.textContent = 'Guardar Cambios';
    modal.classList.add('form-modal--active');
}

/**
 * Guarda un nuevo reto
 * @param {Object} datos - Datos del reto
 */
function guardarReto(datos) {
    // Validación
    const validacion = validarFormulario(datos, ['usuario', 'nombre', 'descripcion', 'fechaInicio', 'fechaFin']);
    if (!validacion.valido) {
        validacion.errores.forEach(error => mostrarNotificacion(error, 'error'));
        return false;
    }

    if (new Date(datos.fechaInicio) > new Date(datos.fechaFin)) {
        mostrarNotificacion('La fecha de inicio no puede ser mayor a la fecha final', 'error');
        return false;
    }

    if (!datos.diasSemana.length) {
        mostrarNotificacion('Selecciona al menos un día para el reto', 'error');
        return false;
    }

    const seguimiento = generarSeguimiento(datos.fechaInicio, datos.fechaFin, datos.diasSemana);

    if (!seguimiento.length) {
        mostrarNotificacion('Con ese rango y días no se generaron sesiones', 'error');
        return false;
    }

    const baseReto = {
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        fechaInicio: datos.fechaInicio,
        fechaFin: datos.fechaFin,
        diasSemana: datos.diasSemana,
        variable: datos.variable,
        objetivoDiario: datos.objetivoDiario,
        seguimiento,
        completado: false,
    };
    
    if (retoEditandoId) {
        const retoActual = obtenerElementoPorId('retos', retoEditandoId);
        if (!retoActual) {
            mostrarNotificacion('No se encontró el reto a editar', 'error');
            return false;
        }

        actualizarElemento('retos', retoEditandoId, {
            ...retoActual,
            usuario: datos.usuario,
            ...baseReto,
        });
        retoSemanaVisible[retoEditandoId] = 0;
        mostrarNotificacion('Reto actualizado exitosamente', 'success');
        cerrarFormularioReto();
        renderRetos();
        return true;
    }

    // Si es para ambos, crear dos retos
    if (datos.usuario === 'Ambos') {
        agregarElemento('retos', {
            usuario: USUARIO_1,
            ...clonar(baseReto),
            seguimiento: clonar(baseReto.seguimiento),
        });
        agregarElemento('retos', {
            usuario: USUARIO_2,
            ...clonar(baseReto),
            seguimiento: clonar(baseReto.seguimiento),
        });
        mostrarNotificacion('Reto creado para ambos', 'success');
    } else {
        agregarElemento('retos', {
            usuario: datos.usuario,
            ...baseReto,
        });
        mostrarNotificacion('Reto creado exitosamente', 'success');
    }
    
    cerrarFormularioReto();
    renderRetos();
    return true;
}

/**
 * Toggle de una subtarea
 * @param {string} idReto - ID del reto
 * @param {string} idSubtarea - ID de la subtarea
 */
function toggleSubtarea(idReto, idSubtarea) {
    const reto = obtenerElementoPorId('retos', idReto);
    if (!reto) return;
    
    const subtarea = reto.subtareas.find(s => s.id === idSubtarea);
    if (subtarea) {
        subtarea.completado = !subtarea.completado;
        
        // Verificar si el reto está completo
        reto.completado = retoEstaCompleto(reto);
        
        actualizarElemento('retos', idReto, reto);
        animar(document.querySelector(`[data-reto-id="${idReto}"] [data-subtarea-id="${idSubtarea}"]`), 'bounce');
        renderRetos();
    }
}

function toggleSeguimiento(idReto, idSeguimiento) {
    const reto = obtenerElementoPorId('retos', idReto);
    if (!reto || !Array.isArray(reto.seguimiento)) return;

    const item = reto.seguimiento.find(entry => entry.id === idSeguimiento);
    if (!item) return;

    item.completado = !item.completado;
    reto.completado = retoEstaCompleto(reto);
    actualizarElemento('retos', idReto, reto);
    renderRetos();
}

function actualizarValorSeguimiento(idReto, idSeguimiento, valor) {
    const reto = obtenerElementoPorId('retos', idReto);
    if (!reto || !Array.isArray(reto.seguimiento)) return;

    const item = reto.seguimiento.find(entry => entry.id === idSeguimiento);
    if (!item) return;

    item.valor = valor;
    actualizarElemento('retos', idReto, reto);
}

function actualizarNotaSeguimiento(idReto, idSeguimiento, nota) {
    const reto = obtenerElementoPorId('retos', idReto);
    if (!reto || !Array.isArray(reto.seguimiento)) return;

    const item = reto.seguimiento.find(entry => entry.id === idSeguimiento);
    if (!item) return;

    item.nota = nota;
    actualizarElemento('retos', idReto, reto);
}

/**
 * Elimina un reto
 * @param {string} idReto - ID del reto
 */
function eliminarReto(idReto) {
    const reto = obtenerElementoPorId('retos', idReto);
    if (!reto) return;
    
    if (solicitarConfirmacion(`¿Eliminar el reto "${reto.descripcion}"?`)) {
        eliminarElemento('retos', idReto);
        mostrarNotificacion('Reto eliminado', 'success');
        renderRetos();
    }
}

/**
 * Verifica la regla de retos y muestra recompensa si aplica
 */
function verificarYMostrarRecompensa() {
    const container = document.getElementById('recompensa-container');
    const retos = obtenerElementos('retos').map(reto => ({
        ...reto,
        usuario: normalizarUsuarioReto(reto.usuario),
    }));
    
    const retosUsuario1Completos = retos
        .filter(r => r.usuario === USUARIO_1)
        .every(r => retoEstaCompleto(r));
    
    const retosUsuario2Completos = retos
        .filter(r => r.usuario === USUARIO_2)
        .every(r => retoEstaCompleto(r));
    
    const hayRetosDeAmbos = 
        retos.some(r => r.usuario === USUARIO_1) &&
        retos.some(r => r.usuario === USUARIO_2);
    
    if (!hayRetosDeAmbos) {
        container.style.display = 'none';
        return;
    }
    
    let html = '';
    
    if (retosUsuario1Completos && retosUsuario2Completos) {
        html = `
            <div class="recompensa-title">🎉 ¡RETO LOGRADO! 🎉</div>
            <div class="recompensa-content">
                Ambos completaron sus retos esta semana.<br>
                <strong>¡Merecen una celebración especial!</strong>
            </div>
        `;
        container.style.display = 'block';
        container.style.animation = 'pulse 1s ease-in-out infinite';
    } else if ((retosUsuario1Completos && !retosUsuario2Completos) || 
               (!retosUsuario1Completos && retosUsuario2Completos)) {
        const quienCumplio = retosUsuario1Completos ? USUARIO_1 : USUARIO_2;
        html = `
            <div class="recompensa-title">⚡ RECOMPENSA ESPECIAL</div>
            <div class="recompensa-content">
                ${quienCumplio} completó sus retos.<br>
                <strong>Recompensa: Proteína + Cena 🍖🍽️</strong>
            </div>
        `;
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

// ===== EVENT LISTENERS =====

document.addEventListener('DOMContentLoaded', () => {
    inicializarReglaReto();

    const btnNuevo = document.getElementById('btn-nuevo-reto');
    const btnCerrar = document.getElementById('close-form-reto');
    const btnCancelar = document.getElementById('cancel-form-reto');
    const formReto = document.getElementById('form-reto');
    
    if (btnNuevo) {
        btnNuevo.addEventListener('click', () => abrirFormularioReto());
    }
    
    if (btnCerrar) {
        btnCerrar.addEventListener('click', cerrarFormularioReto);
    }
    
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cerrarFormularioReto);
    }
    
    if (formReto) {
        formReto.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const datos = {
                usuario: document.getElementById('reto-usuario').value,
                nombre: document.getElementById('reto-nombre').value.trim(),
                descripcion: document.getElementById('reto-descripcion').value.trim(),
                fechaInicio: document.getElementById('reto-fecha-inicio').value,
                fechaFin: document.getElementById('reto-fecha-fin').value,
                diasSemana: obtenerDiasSeleccionados(),
                variable: document.getElementById('reto-variable').value.trim(),
                objetivoDiario: document.getElementById('reto-objetivo-diario').value.trim(),
            };
            
            guardarReto(datos);
        });
    }
    
    // Cerrar modal al hacer clic fuera
    const modal = document.getElementById('form-reto-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cerrarFormularioReto();
            }
        });
    }
});
