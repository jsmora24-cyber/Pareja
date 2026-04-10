/* ==========================================
   EXPERIENCIAS - LÓGICA DE RECUERDOS Y MAPA
   ========================================== */

let paisSeleccionado = null;
let mapaMundial = null;
let catalogoPaises = [];
let codigoAPaisDinamico = {};
let paisACodigoDinamico = {};

// Configura estos datos para subir imágenes reales a la nube (Cloudinary)
const CLOUDINARY_CONFIG = {
    cloudName: '',
    uploadPreset: '',
};

const CODIGO_A_PAIS = {
    AR: 'Argentina',
    AU: 'Australia',
    BR: 'Brasil',
    CA: 'Canadá',
    CH: 'Suiza',
    CL: 'Chile',
    CN: 'China',
    CO: 'Colombia',
    DE: 'Alemania',
    EC: 'Ecuador',
    EG: 'Egipto',
    ES: 'España',
    FR: 'Francia',
    GB: 'Reino Unido',
    GR: 'Grecia',
    IN: 'India',
    IT: 'Italia',
    JP: 'Japón',
    KE: 'Kenia',
    KR: 'Corea del Sur',
    MA: 'Marruecos',
    MX: 'México',
    NZ: 'Nueva Zelanda',
    PE: 'Perú',
    PH: 'Filipinas',
    PL: 'Polonia',
    RU: 'Rusia',
    TH: 'Tailandia',
    TR: 'Turquía',
    US: 'Estados Unidos',
    VN: 'Vietnam',
    AE: 'Emiratos Árabes',
};

const PAIS_A_CODIGO = {
    argentina: 'AR',
    australia: 'AU',
    brasil: 'BR',
    brazil: 'BR',
    canada: 'CA',
    canadas: 'CA',
    'canadá': 'CA',
    suiza: 'CH',
    chile: 'CL',
    china: 'CN',
    colombia: 'CO',
    alemania: 'DE',
    ecuador: 'EC',
    egipto: 'EG',
    espana: 'ES',
    españa: 'ES',
    francia: 'FR',
    france: 'FR',
    uk: 'GB',
    'reino unido': 'GB',
    'united kingdom': 'GB',
    grecia: 'GR',
    india: 'IN',
    italia: 'IT',
    japon: 'JP',
    japón: 'JP',
    kenya: 'KE',
    kenia: 'KE',
    corea: 'KR',
    'corea del sur': 'KR',
    'south korea': 'KR',
    marruecos: 'MA',
    mexico: 'MX',
    méxico: 'MX',
    'nueva zelanda': 'NZ',
    peru: 'PE',
    perú: 'PE',
    filipinas: 'PH',
    polonia: 'PL',
    rusia: 'RU',
    tailandia: 'TH',
    turquia: 'TR',
    turquía: 'TR',
    'estados unidos': 'US',
    usa: 'US',
    vietnam: 'VN',
    vietnamita: 'VN',
    'emiratos arabes': 'AE',
    'emiratos árabes': 'AE',
    uae: 'AE',
};

function normalizarPais(texto) {
    return (texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function obtenerNombrePaisPorCodigo(codigo) {
    const code = String(codigo || '').toUpperCase();
    return codigoAPaisDinamico[code] || CODIGO_A_PAIS[code] || code;
}

function obtenerCodigoPais(pais) {
    const normalizado = normalizarPais(pais);
    return paisACodigoDinamico[normalizado] || PAIS_A_CODIGO[normalizado] || null;
}

function inicializarCatalogoPaises() {
    const selectPais = document.getElementById('exp-pais');
    if (!selectPais) return;

    const mapData = typeof jsVectorMap !== 'undefined' && jsVectorMap.maps
        ? (jsVectorMap.maps.world_merc || jsVectorMap.maps.world)
        : null;

    const codigosDesdeMapa = mapData && mapData.content && mapData.content.paths
        ? Object.keys(mapData.content.paths)
        : Object.keys(CODIGO_A_PAIS);

    const codigos = codigosDesdeMapa
        .map(code => String(code).toUpperCase())
        .filter(code => /^[A-Z]{2}$/.test(code));

    const displayNames = typeof Intl !== 'undefined' && Intl.DisplayNames
        ? new Intl.DisplayNames(['es'], { type: 'region' })
        : null;

    catalogoPaises = codigos.map(code => ({
        code,
        name: CODIGO_A_PAIS[code] || (displayNames ? displayNames.of(code) : code) || code,
    }))
        .filter(item => item.name && item.name !== item.code)
        .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

    codigoAPaisDinamico = {};
    paisACodigoDinamico = {};

    catalogoPaises.forEach(item => {
        codigoAPaisDinamico[item.code] = item.name;
        paisACodigoDinamico[normalizarPais(item.name)] = item.code;
    });

    selectPais.innerHTML = '<option value="">Selecciona un país</option>';
    catalogoPaises.forEach(item => {
        const option = document.createElement('option');
        option.value = item.code;
        option.textContent = item.name;
        selectPais.appendChild(option);
    });
}

function obtenerCloudinaryConfig() {
    try {
        const guardado = localStorage.getItem('pareja_cloudinary_config');
        if (guardado) {
            const parseado = JSON.parse(guardado);
            return {
                cloudName: parseado.cloudName || CLOUDINARY_CONFIG.cloudName,
                uploadPreset: parseado.uploadPreset || CLOUDINARY_CONFIG.uploadPreset,
            };
        }
    } catch (error) {
        // Ignorar parse inválido y usar fallback
    }

    return CLOUDINARY_CONFIG;
}

function cloudinaryDisponible() {
    const config = obtenerCloudinaryConfig();
    return Boolean(config.cloudName && config.uploadPreset);
}

async function convertirArchivoABase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
        reader.readAsDataURL(file);
    });
}

async function subirImagenANube(file) {
    const config = obtenerCloudinaryConfig();
    if (!config.cloudName || !config.uploadPreset) {
        throw new Error('Falta configurar Cloudinary.');
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.uploadPreset);
    formData.append('folder', 'pareja-dashboard');

    const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('No se pudo subir la imagen a la nube.');
    }

    const data = await response.json();
    if (!data.secure_url) {
        throw new Error('La nube no devolvió URL de imagen.');
    }

    return data.secure_url;
}

function setEstadoSubida(mensaje, tipo = 'normal') {
    const el = document.getElementById('exp-upload-status');
    if (!el) return;
    el.textContent = mensaje;
    el.style.color = tipo === 'error' ? 'var(--color-error)' : tipo === 'success' ? 'var(--color-success)' : 'var(--color-text-secondary)';
}

function setBotonGuardando(guardando) {
    const btn = document.querySelector('#form-experiencia button[type="submit"]');
    if (!btn) return;
    btn.disabled = guardando;
    btn.textContent = guardando ? 'Subiendo...' : 'Guardar Experiencia';
}

function abrirVisorImagen(urlImagen, titulo = '') {
    const lightbox = document.getElementById('experiencia-lightbox');
    const img = document.getElementById('experiencia-lightbox-image');
    const caption = document.getElementById('experiencia-lightbox-caption');
    if (!lightbox || !img || !caption || !urlImagen) return;

    img.src = urlImagen;
    caption.textContent = titulo || 'Experiencia';
    lightbox.classList.add('form-modal--active');
}

function cerrarVisorImagen() {
    const lightbox = document.getElementById('experiencia-lightbox');
    const img = document.getElementById('experiencia-lightbox-image');
    const caption = document.getElementById('experiencia-lightbox-caption');
    if (!lightbox || !img || !caption) return;

    lightbox.classList.remove('form-modal--active');
    img.src = '';
    caption.textContent = '';
}

/**
 * Renderiza todas las experiencias en la galería
 */
function renderExperiencias() {
    const container = document.getElementById('experiencias-container');
    let experiencias = obtenerElementos('experiencias');
    
    // Filtrar por país si hay uno seleccionado
    if (paisSeleccionado) {
        const paisFiltro = normalizarPais(paisSeleccionado);
        experiencias = experiencias.filter(exp => normalizarPais(exp.pais) === paisFiltro);
    }

    // Solo mostrar tarjetas que tengan imagen válida
    experiencias = experiencias.filter(exp => exp.imagen && exp.imagen.trim());
    
    if (experiencias.length === 0) {
        container.innerHTML = `
            <div class="empty-gallery">
                <div class="empty-gallery-icon">📷</div>
                <h3 class="empty-gallery-title">${paisSeleccionado ? `No hay fotos de ${paisSeleccionado}` : 'No hay experiencias aún'}</h3>
                <p class="empty-gallery-message">
                    ${paisSeleccionado ? 'Agrega una foto de este país' : 'Registra tus recuerdos de viajes'}
                </p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = experiencias.map(exp => `
        <div class="experiencia-card fade-in" data-imagen="${exp.imagen}" data-titulo="${exp.ciudad}">
            <img src="${exp.imagen}" alt="${exp.ciudad}" class="experiencia-card-imagen experiencia-card-imagen--clickable" onerror="this.closest('.experiencia-card').remove()">
            <div class="experiencia-card-overlay">
                <h4 class="experiencia-card-title">${exp.ciudad}</h4>
                <p class="experiencia-card-info">${exp.descripcion || 'Recuerdo especial'}</p>
                <p class="experiencia-card-info" style="font-size: var(--font-size-xs); margin-top: var(--spacing-sm);">
                    🗑️ <a href="#" onclick="eliminarExperiencia('${exp.id}'); return false;" style="color: rgba(255, 100, 100, 0.9);">Eliminar</a>
                </p>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.experiencia-card').forEach((card) => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('a')) {
                return;
            }
            abrirVisorImagen(card.dataset.imagen, card.dataset.titulo);
        });
    });
}

/**
 * Abre el formulario para agregar una experiencia
 */
function abrirFormularioExperiencia() {
    const modal = document.getElementById('form-experiencia-modal');
    const form = document.getElementById('form-experiencia');
    limpiarFormulario(form);
    
    // Pre-llenar país si hay uno seleccionado
    const selectPais = document.getElementById('exp-pais');
    if (paisSeleccionado && selectPais) {
        const codigo = obtenerCodigoPais(paisSeleccionado);
        if (codigo) {
            selectPais.value = codigo;
        }
    }

    const fileInput = document.getElementById('exp-imagen-file');
    if (fileInput) {
        fileInput.value = '';
    }

    setEstadoSubida('Puedes subir archivo o pegar una URL.');
    
    modal.classList.add('form-modal--active');
}

/**
 * Cierra el formulario de experiencia
 */
function cerrarFormularioExperiencia() {
    const modal = document.getElementById('form-experiencia-modal');
    const form = document.getElementById('form-experiencia');
    modal.classList.remove('form-modal--active');
    limpiarFormulario(form);
    const fileInput = document.getElementById('exp-imagen-file');
    if (fileInput) {
        fileInput.value = '';
    }
    setBotonGuardando(false);
    setEstadoSubida('Puedes subir archivo o pegar una URL.');
}

/**
 * Guarda una nueva experiencia
 * @param {Object} datos - Datos de la experiencia
 */
function guardarExperiencia(datos) {
    // Validación
    const validacion = validarFormulario(datos, ['pais', 'ciudad']);
    if (!validacion.valido) {
        validacion.errores.forEach(error => mostrarNotificacion(error, 'error'));
        return false;
    }
    
    datos.fecha = new Date().toISOString().split('T')[0];
    
    agregarElemento('experiencias', datos);
    mostrarNotificacion('Experiencia guardada exitosamente', 'success');
    
    cerrarFormularioExperiencia();
    renderizarMapa();
    renderExperiencias();
    return true;
}

/**
 * Elimina una experiencia
 * @param {string} idExp - ID de la experiencia
 */
function eliminarExperiencia(idExp) {
    const exp = obtenerElementoPorId('experiencias', idExp);
    if (!exp) return;
    
    if (solicitarConfirmacion(`¿Eliminar el recuerdo de ${exp.ciudad}?`)) {
        eliminarElemento('experiencias', idExp);
        mostrarNotificacion('Experiencia eliminada', 'success');
        renderizarMapa();
        renderExperiencias();
    }
}

/**
 * Selecciona un país y muestra sus fotos
 * @param {string} pais - Nombre del país
 */
function seleccionarPais(pais) {
    paisSeleccionado = pais;
    
    // Actualizar UI
    const infoEl = document.getElementById('pais-seleccionado-info');
    const paisNombreEl = document.getElementById('pais-nombre');
    const galeriaTitulo = document.getElementById('galeria-titulo');
    
    paisNombreEl.textContent = `📍 ${pais}`;
    infoEl.style.display = 'flex';
    galeriaTitulo.textContent = `Fotos de ${pais}`;
    
    // Destacar país en mapa real
    if (mapaMundial) {
        const codigo = obtenerCodigoPais(pais);
        if (codigo) {
            mapaMundial.clearSelectedRegions();
            mapaMundial.setSelectedRegions([codigo]);

            // Refuerzo visual para asegurar color en el país activo
            document.querySelectorAll('.world-map-interactive .jvm-region').forEach(region => {
                region.classList.remove('pais-activo');
            });

            const regionActiva = document.querySelector(`.world-map-interactive .jvm-region[data-code="${codigo}"]`) ||
                document.querySelector(`.world-map-interactive .jvm-region[data-code="${codigo.toLowerCase()}"]`) ||
                document.querySelector(`.world-map-interactive .jvm-region[data-code="${codigo.toUpperCase()}"]`);

            if (regionActiva) {
                regionActiva.classList.add('pais-activo');
            }
        }
    }
    
    renderExperiencias();
}

/**
 * Limpia la selección de país
 */
function limpiarSeleccionPais() {
    paisSeleccionado = null;
    document.getElementById('pais-seleccionado-info').style.display = 'none';
    document.getElementById('galeria-titulo').textContent = 'Todas las Experiencias';
    if (mapaMundial) {
        mapaMundial.clearSelectedRegions();
    }
    document.querySelectorAll('.world-map-interactive .jvm-region').forEach(region => {
        region.classList.remove('pais-activo');
    });
    renderExperiencias();
}

/**
 * Renderiza un mapa mundial real con jsVectorMap
 */
function renderizarMapa() {
    const mapDiv = document.getElementById('world-map');
    if (!mapDiv) return;
    const experiencias = obtenerElementos('experiencias').filter(exp => exp.imagen && exp.imagen.trim());

    if (typeof jsVectorMap === 'undefined') {
        mapDiv.innerHTML = '<div style="color:#fff;opacity:.8;padding:1rem;text-align:center;">No se pudo cargar el mapa mundial. Revisa conexión a Internet.</div>';
        return;
    }

    if (mapaMundial) {
        mapaMundial.destroy();
        mapaMundial = null;
    }

    mapDiv.innerHTML = '';

    const valoresRegiones = {};
    experiencias.forEach(exp => {
        const codigo = obtenerCodigoPais(exp.pais);
        if (codigo) {
            valoresRegiones[codigo] = (valoresRegiones[codigo] || 0) + 1;
            valoresRegiones[codigo.toLowerCase()] = valoresRegiones[codigo];
        }
    });

    const regionesConFotos = Object.keys(valoresRegiones);

    try {
        mapaMundial = new jsVectorMap({
            selector: '#world-map',
            map: 'world_merc',
            zoomOnScroll: false,
            zoomButtons: false,
            regionsSelectable: true,
            regionsSelectableOne: true,
            focusOn: {
                x: 0.5,
                y: 0.5,
                scale: 1.35,
                animate: false,
            },
            regionStyle: {
                initial: {
                    fill: '#d9dde5',
                    fillOpacity: 1,
                    stroke: '#6e7584',
                    strokeWidth: 0.6,
                },
                hover: {
                    fill: '#f8c6ef',
                    stroke: '#d946ef',
                    strokeWidth: 1.1,
                },
                selected: {
                    fill: '#c026d3',
                    stroke: '#f5d0fe',
                    strokeWidth: 2.2,
                },
                selectedHover: {
                    fill: '#a21caf',
                },
            },
            series: {
                regions: [
                    {
                        attribute: 'fill',
                        values: valoresRegiones,
                        scale: ['#f9a8d4', '#d946ef'],
                        normalizeFunction: 'linear',
                    },
                ],
            },
            selectedRegions: regionesConFotos,
            onRegionClick(event, code) {
                event.preventDefault();
                const codeNormalizado = String(code || '').toUpperCase();
                const pais = obtenerNombrePaisPorCodigo(codeNormalizado);
                seleccionarPais(pais);
            },
        });
    } catch (error) {
        mapDiv.innerHTML = '<div style="color:#fff;opacity:.9;padding:1rem;text-align:center;">No se pudo iniciar el mapa mundial. Recarga la página.</div>';
        return;
    }

    if (paisSeleccionado) {
        const codigoSeleccionado = obtenerCodigoPais(paisSeleccionado);
        if (codigoSeleccionado) {
            mapaMundial.setSelectedRegions([codigoSeleccionado]);
        }
    }
}

// ===== EVENT LISTENERS =====

document.addEventListener('DOMContentLoaded', () => {
    inicializarCatalogoPaises();

    const btnNuevo = document.getElementById('btn-nueva-experiencia');
    const btnCerrar = document.getElementById('close-form-experiencia');
    const btnCancelar = document.getElementById('cancel-form-experiencia');
    const formExp = document.getElementById('form-experiencia');
    
    if (btnNuevo) {
        btnNuevo.addEventListener('click', () => abrirFormularioExperiencia());
    }
    
    if (btnCerrar) {
        btnCerrar.addEventListener('click', cerrarFormularioExperiencia);
    }
    
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cerrarFormularioExperiencia);
    }
    
    if (formExp) {
        formExp.addEventListener('submit', async (e) => {
            e.preventDefault();

            setBotonGuardando(true);

            try {
                const fileInput = document.getElementById('exp-imagen-file');
                const archivo = fileInput && fileInput.files ? fileInput.files[0] : null;
                let imagenFinal = document.getElementById('exp-imagen').value.trim();

                if (archivo) {
                    setEstadoSubida('Subiendo imagen...');

                    if (cloudinaryDisponible()) {
                        imagenFinal = await subirImagenANube(archivo);
                        setEstadoSubida('Imagen subida a la nube.', 'success');
                    } else {
                        // Fallback local para no bloquear al usuario si aún no configuró nube
                        imagenFinal = await convertirArchivoABase64(archivo);
                        setEstadoSubida('Imagen guardada localmente. Configura Cloudinary para nube.', 'error');
                        mostrarNotificacion('Configura Cloudinary para guardar imágenes en la nube.', 'warning');
                    }
                }
            
                const datos = {
                    pais: obtenerNombrePaisPorCodigo(document.getElementById('exp-pais').value.trim()),
                    ciudad: document.getElementById('exp-ciudad').value.trim(),
                    descripcion: document.getElementById('exp-descripcion').value.trim(),
                    imagen: imagenFinal,
                };
            
                guardarExperiencia(datos);
            } catch (error) {
                setEstadoSubida('Error al cargar la imagen.', 'error');
                mostrarNotificacion(error.message || 'No se pudo procesar la imagen.', 'error');
            } finally {
                setBotonGuardando(false);
            }
        });
    }
    
    // Cerrar modal al hacer clic fuera
    const modal = document.getElementById('form-experiencia-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cerrarFormularioExperiencia();
            }
        });
    }
    
    // Botón para cerrar selección de país
    const btnCerrarPais = document.getElementById('cerrar-pais');
    if (btnCerrarPais) {
        btnCerrarPais.addEventListener('click', limpiarSeleccionPais);
    }

    // Cerrar visor de imagen
    const lightbox = document.getElementById('experiencia-lightbox');
    const lightboxClose = document.getElementById('experiencia-lightbox-close');
    if (lightboxClose) {
        lightboxClose.addEventListener('click', cerrarVisorImagen);
    }
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                cerrarVisorImagen();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarVisorImagen();
        }
    });
    
    // Renderizar mapa inicial
    renderizarMapa();
});
