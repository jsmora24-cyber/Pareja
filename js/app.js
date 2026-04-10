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

    inicializarControlesFirebase();
    inicializarFirebaseSync();
    
    // Mensaje de bienvenida
    mostrarNotificacion('¡Bienvenidos a su Dashboard de Pareja! 💑', 'info', 5000);
}

function inicializarControlesFirebase() {
    const btnSync = document.getElementById('btn-sync-firebase');
    const modal = document.getElementById('firebase-sync-modal');
    const closeBtn = document.getElementById('close-firebase-sync-modal');
    const cancelBtn = document.getElementById('cancel-firebase-sync-modal');
    const forceSyncBtn = document.getElementById('firebase-force-sync');
    const form = document.getElementById('firebase-sync-form');
    const status = document.getElementById('firebase-sync-status');

    if (!modal || !form) return;

    const pref = obtenerPreferenciasFirebase();
    if (pref.config) {
        document.getElementById('firebase-api-key').value = pref.config.apiKey || '';
        document.getElementById('firebase-auth-domain').value = pref.config.authDomain || '';
        document.getElementById('firebase-project-id').value = pref.config.projectId || '';
        document.getElementById('firebase-storage-bucket').value = pref.config.storageBucket || '';
        document.getElementById('firebase-messaging-sender-id').value = pref.config.messagingSenderId || '';
        document.getElementById('firebase-app-id').value = pref.config.appId || '';
    }
    if (pref.roomId) {
        document.getElementById('firebase-room-id').value = pref.roomId;
    }

    if (btnSync) {
        btnSync.addEventListener('click', () => {
            modal.classList.add('form-modal--active');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.classList.remove('form-modal--active'));
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => modal.classList.remove('form-modal--active'));
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('form-modal--active');
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const config = {
            apiKey: document.getElementById('firebase-api-key').value.trim(),
            authDomain: document.getElementById('firebase-auth-domain').value.trim(),
            projectId: document.getElementById('firebase-project-id').value.trim(),
            storageBucket: document.getElementById('firebase-storage-bucket').value.trim(),
            messagingSenderId: document.getElementById('firebase-messaging-sender-id').value.trim(),
            appId: document.getElementById('firebase-app-id').value.trim(),
        };
        const roomId = document.getElementById('firebase-room-id').value.trim();

        const result = await inicializarFirebaseSync(config, roomId);
        if (result.ok) {
            status.textContent = `Conectado a Firebase en sala: ${roomId}`;
            mostrarNotificacion('Sincronización en tiempo real activada', 'success');
            modal.classList.remove('form-modal--active');
        } else {
            status.textContent = result.message || 'No se pudo conectar a Firebase.';
            mostrarNotificacion(status.textContent, 'error');
        }
    });

    if (forceSyncBtn) {
        forceSyncBtn.addEventListener('click', async () => {
            const ok = await forzarSyncFirebaseAhora();
            mostrarNotificacion(ok ? 'Sincronización enviada a Firebase' : 'No se pudo sincronizar', ok ? 'success' : 'error');
        });
    }
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
