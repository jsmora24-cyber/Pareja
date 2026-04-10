/* ==========================================
   APP - LÓGICA PRINCIPAL Y ENRUTAMIENTO
   ========================================== */

/**
 * Cambiar a una sección
 * @param {string} nombreSeccion - Nombre de la sección (proyectos, ahorros, retos, experiencias)
 */
function cambiarSeccion(nombreSeccion) {
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('section--active');
    });
    
    // Mostrar la sección seleccionada
    const seccion = document.getElementById(nombreSeccion);
    if (seccion) {
        seccion.classList.add('section--active');
        
        // Actualizar header
        const titulos = {
            'proyectos': { titulo: 'Proyectos Compartidos', subtitulo: 'Planifiquen juntos hacia sus sueños' },
            'ahorros': { titulo: 'Gestión de Ahorros', subtitulo: 'Tracken el progreso hacia sus metas financieras' },
            'retos': { titulo: 'Retos de Pareja', subtitulo: 'Cumplan desafíos juntos y celebren logros' },
            'experiencias': { titulo: 'Recuerdos y Experiencias', subtitulo: 'Documenten sus momentos especiales alrededor del mundo' }
        };
        
        const info = titulos[nombreSeccion] || { titulo: nombreSeccion, subtitulo: '' };
        document.querySelector('.header-title').textContent = info.titulo;
        document.querySelector('.header-subtitle').textContent = info.subtitulo;
        
        // Renderizar contenido de la sección
        renderizarSeccion(nombreSeccion);
    }
    
    // Actualizar botones de navegación
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('nav-btn--active');
    });
    document.querySelector(`[data-section="${nombreSeccion}"]`).classList.add('nav-btn--active');
}

/**
 * Renderiza el contenido de una sección
 * @param {string} nombreSeccion - Nombre de la sección
 */
function renderizarSeccion(nombreSeccion) {
    switch (nombreSeccion) {
        case 'proyectos':
            renderProyectos();
            break;
        case 'ahorros':
            renderAhorros();
            break;
        case 'retos':
            renderRetos();
            break;
        case 'experiencias':
            renderExperiencias();
            renderizarMapa();
            break;
    }
}

/**
 * Inicializa la aplicación
 */
function inicializarApp() {
    // Inicializar datos de ejemplo si es primera vez
    inicializarDatosEjemplo();
    
    // Cargar sección inicial
    cambiarSeccion('proyectos');
    
    // Event listeners para navegación
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const seccion = btn.dataset.section;
            cambiarSeccion(seccion);
        });
    });
    
    // Toggle navbar en móvil
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('nav-menu--open');
        });
    }
    
    // Cerrar menú al hacer clic en un botón de navegación en móvil
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (esMovil() || window.innerWidth < 768) {
                navMenu.classList.remove('nav-menu--open');
            }
        });
    });
    
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!navMenu?.contains(e.target) && !navToggle?.contains(e.target)) {
            navMenu?.classList.remove('nav-menu--open');
        }
    });
    
    // Manejar resize para navbar
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            navMenu?.classList.remove('nav-menu--open');
        }
    });

    // Sincronización manual entre dispositivos (exportar/importar JSON)
    const btnExportar = document.getElementById('btn-exportar-datos');
    const btnImportar = document.getElementById('btn-importar-datos');
    const inputImportar = document.getElementById('input-importar-datos');

    if (btnExportar) {
        btnExportar.addEventListener('click', () => {
            exportarDatos();
        });
    }

    if (btnImportar && inputImportar) {
        btnImportar.addEventListener('click', () => {
            inputImportar.click();
        });

        inputImportar.addEventListener('change', (e) => {
            const archivo = e.target.files && e.target.files[0] ? e.target.files[0] : null;
            if (!archivo) return;
            importarDatos(archivo);
            inputImportar.value = '';
        });
    }
    
    // Mensaje de bienvenida
    mostrarNotificacion('¡Bienvenidos! Usa Exportar/Importar para sincronizar entre dispositivos.', 'info', 5000);
}

/**
 * Event listener cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', () => {
    inicializarApp();
});

/**
 * Función para exportar datos (se puede llamar desde consola)
 */
function exportarDatosAhora() {
    exportarDatos();
}

/**
 * Función para limpiar datos (se puede llamar desde consola)
 */
function limpiarDatosAhora() {
    limpiarTodosDatos();
    location.reload();
}

// ===== ATAJOS DE TECLADO =====

document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + P: Ir a Proyectos
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        cambiarSeccion('proyectos');
    }
    
    // Ctrl/Cmd + S: Ir a Ahorros
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        cambiarSeccion('ahorros');
    }
    
    // Ctrl/Cmd + R: Ir a Retos
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        cambiarSeccion('retos');
    }
    
    // Ctrl/Cmd + E: Ir a Experiencias
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        cambiarSeccion('experiencias');
    }
    
    // Escape: Cerrar modales abiertos
    if (e.key === 'Escape') {
        document.querySelectorAll('.form-modal--active').forEach(modal => {
            modal.classList.remove('form-modal--active');
        });
    }
});

// ===== LOG DE INFORMACIÓN =====
console.log('%c💑 Pareja Dashboard - Iniciado', 'color: #E91E63; font-weight: bold; font-size: 14px;');
console.log('%cAtaljos de teclado:', 'color: #9C27B0; font-weight: bold;');
console.log('Ctrl/Cmd + P → Proyectos');
console.log('Ctrl/Cmd + S → Ahorros');
console.log('Ctrl/Cmd + R → Retos');
console.log('Ctrl/Cmd + E → Experiencias');
console.log('Escape → Cerrar modales');
console.log('%cFunciones disponibles en consola:', 'color: #9C27B0; font-weight: bold;');
console.log('exportarDatosAhora() - Exportar datos a JSON');
console.log('limpiarDatosAhora() - Limpiar all datos (requiere confirmación)');
console.log('obtenerTodosDatos() - Ver todos los datos');
