// ==============================================================================
// 1. CONFIGURACIÓN DEL CANVAS Y CENTRO DE PANTALLA
// ==============================================================================
const canvas = document.getElementById('lienzo3D');
const ctx = canvas.getContext('2d');
const CENTRO_X = canvas.width / 2;
const CENTRO_Y = canvas.height / 2;

// ==============================================================================
// 2. TEMAS 3.1 & 3.2: GEOMETRÍA TRIDIMENSIONAL (MODELOS LOCALES)
// ==============================================================================
// Todas las figuras están centradas en el origen (0,0,0).
// Cada modelo tiene: lista de vértices {x,y,z} + lista de aristas [i, j].

// --- Modelo original: Cubo (8 vértices, 12 aristas) ---
const modeloCuboLocal = [
    {x: -80, y: -80, z: -80}, // V0: Inferior Trasero Izq
    {x:  80, y: -80, z: -80}, // V1: Inferior Trasero Der
    {x:  80, y:  80, z: -80}, // V2: Superior Trasero Der
    {x: -80, y:  80, z: -80}, // V3: Superior Trasero Izq
    {x: -80, y: -80, z:  80}, // V4: Inferior Frontal Izq
    {x:  80, y: -80, z:  80}, // V5: Inferior Frontal Der
    {x:  80, y:  80, z:  80}, // V6: Superior Frontal Der
    {x: -80, y:  80, z:  80}  // V7: Superior Frontal Izq
];

const aristasCubo = [
    [0, 1], [1, 2], [2, 3], [3, 0],   // Cara Trasera (Z = -80)
    [4, 5], [5, 6], [6, 7], [7, 4],   // Cara Frontal (Z = +80)
    [0, 4], [1, 5], [2, 6], [3, 7]    // Aristas Longitudinales
];

// --- Opción A: Pirámide de base cuadrada (5 vértices, 8 aristas) ---
// Base cuadrada en el plano Y = -80 y ápice en Y = +80.
const modeloPiramideLocal = [
    {x: -80, y: -80, z: -80}, // V0: Base Trasera Izq
    {x:  80, y: -80, z: -80}, // V1: Base Trasera Der
    {x:  80, y: -80, z:  80}, // V2: Base Frontal Der
    {x: -80, y: -80, z:  80}, // V3: Base Frontal Izq
    {x:   0, y:  80, z:   0}  // V4: Ápice
];

const aristasPiramide = [
    [0, 1], [1, 2], [2, 3], [3, 0],   // Perímetro de la base
    [0, 4], [1, 4], [2, 4], [3, 4]    // Aristas laterales hacia el ápice
];

// --- Opción B: Prisma triangular (6 vértices, 9 aristas) ---
// Dos triángulos iguales en Z = -90 y Z = +90.
const modeloPrismaLocal = [
    {x: -90, y: -60, z: -90}, // V0: Triángulo trasero, inferior Izq
    {x:  90, y: -60, z: -90}, // V1: Triángulo trasero, inferior Der
    {x:   0, y:  95, z: -90}, // V2: Triángulo trasero, superior
    {x: -90, y: -60, z:  90}, // V3: Triángulo frontal, inferior Izq
    {x:  90, y: -60, z:  90}, // V4: Triángulo frontal, inferior Der
    {x:   0, y:  95, z:  90}  // V5: Triángulo frontal, superior
];

const aristasPrisma = [
    [0, 1], [1, 2], [2, 0],           // Tapa trasera
    [3, 4], [4, 5], [5, 3],           // Tapa frontal
    [0, 3], [1, 4], [2, 5]            // Aristas longitudinales
];

// --- Opción C: Octaedro (6 vértices, 12 aristas) ---
// Un vértice sobre cada semieje (±X, ±Y, ±Z).
const modeloOctaedroLocal = [
    {x:  110, y:    0, z:    0}, // V0: +X
    {x: -110, y:    0, z:    0}, // V1: -X
    {x:    0, y:  110, z:    0}, // V2: +Y (polo superior)
    {x:    0, y: -110, z:    0}, // V3: -Y (polo inferior)
    {x:    0, y:    0, z:  110}, // V4: +Z
    {x:    0, y:    0, z: -110}  // V5: -Z
];

const aristasOctaedro = [
    [0, 4], [4, 1], [1, 5], [5, 0],   // Ecuador (cuadrado en el plano XZ)
    [2, 0], [2, 1], [2, 4], [2, 5],   // Polo superior hacia el ecuador
    [3, 0], [3, 1], [3, 4], [3, 5]    // Polo inferior hacia el ecuador
];

// Catálogo de primitivas seleccionables desde el panel
const primitivas = {
    cubo:     { nombre: 'Cubo',                 vertices: modeloCuboLocal,     aristas: aristasCubo },
    piramide: { nombre: 'Pirámide (Opción A)',  vertices: modeloPiramideLocal, aristas: aristasPiramide },
    prisma:   { nombre: 'Prisma (Opción B)',    vertices: modeloPrismaLocal,   aristas: aristasPrisma },
    octaedro: { nombre: 'Octaedro (Opción C)',  vertices: modeloOctaedroLocal, aristas: aristasOctaedro }
};

// Figura activa (se cambia con el selector del HTML)
let modeloActual = primitivas.piramide.vertices;
let aristasPrimitiva = primitivas.piramide.aristas;

// ==============================================================================
// 3. TEMA 3.3: PIPELINE DE TRANSFORMACIONES TRIDIMENSIONALES
// ==============================================================================
function transformarVertice3D(v, params) {
    let { tx, ty, tz, sx, sy, sz, rx, ry, rz, shxy, shxz } = params;

    // Convertir ángulos a radianes
    let radX = rx * Math.PI / 180;
    let radY = ry * Math.PI / 180;
    let radZ = rz * Math.PI / 180;

    // --- 3.3.2 ESCALAMIENTO (S) ---
    let x1 = v.x * sx;
    let y1 = v.y * sy;
    let z1 = v.z * sz;

    // --- 3.3.4 SESGADO / SHEAR (Sh) ---
    let x2 = x1 + (shxy * y1) + (shxz * z1);
    let y2 = y1;
    let z2 = z1;

    // --- 3.3.3 ROTACIÓN EN EJE X (Pitch) ---
    let x3 = x2;
    let y3 = y2 * Math.cos(radX) - z2 * Math.sin(radX);
    let z3 = y2 * Math.sin(radX) + z2 * Math.cos(radX);

    // --- 3.3.3 ROTACIÓN EN EJE Y (Yaw) ---
    let x4 = x3 * Math.cos(radY) + z3 * Math.sin(radY);
    let y4 = y3;
    let z4 = -x3 * Math.sin(radY) + z3 * Math.cos(radY);

    // --- 3.3.3 ROTACIÓN EN EJE Z (Roll) ---
    let x5 = x4 * Math.cos(radZ) - y4 * Math.sin(radZ);
    let y5 = x4 * Math.sin(radZ) + y4 * Math.cos(radZ);
    let z5 = z4;

    // --- 3.3.1 TRASLACIÓN (T) ---
    let xFinal = x5 + tx;
    let yFinal = y5 + ty;
    let zFinal = z5 + tz;

    return { x: xFinal, y: yFinal, z: zFinal };
}

// ==============================================================================
// 4. TEMA 3.1: PROYECCIÓN PERSPECTIVA (3D A PANTALLA 2D)
// ==============================================================================
function proyectar3Da2D(v3d) {
    const distanciaCamara = 500;

    let zAjustado = v3d.z + distanciaCamara;
    if (zAjustado < 1) zAjustado = 1;

    // Factor de escala por perspectiva (división entre Z)
    let factorProyeccion = distanciaCamara / zAjustado;

    // Mapeo a píxeles en el lienzo
    let x2d = CENTRO_X + (v3d.x * factorProyeccion);
    let y2d = CENTRO_Y - (v3d.y * factorProyeccion); // Inversión en eje Y

    // Se conserva el factor para usarlo en el estilo (profundidad)
    return { x: x2d, y: y2d, f: factorProyeccion };
}

// ==============================================================================
// 5. PALETA VISUAL PROPIA "ATARDECER"
// ==============================================================================
const PALETA = {
    ejes:        'rgba(251, 191, 36, 0.12)', // ámbar tenue
    aristaCerca: [251, 146, 60],             // naranja (aristas cercanas)
    aristaLejos: [192, 38, 211],             // magenta (aristas lejanas)
    vertice:     '#2dd4bf',                  // turquesa
    brillo:      'rgba(45, 212, 191, 0.35)'
};

// Interpola entre dos colores RGB según t ∈ [0,1]
function mezclarColor(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return `rgb(${r}, ${g}, ${bl})`;
}

// ==============================================================================
// 6. BUCLE DE RENDERIZADO
// ==============================================================================
function leerParametros() {
    return {
        tx: parseFloat(document.getElementById('tx').value),
        ty: parseFloat(document.getElementById('ty').value),
        tz: parseFloat(document.getElementById('tz').value),
        sx: parseFloat(document.getElementById('sx').value),
        sy: parseFloat(document.getElementById('sy').value),
        sz: parseFloat(document.getElementById('sz').value),
        rx: parseFloat(document.getElementById('rx').value),
        ry: parseFloat(document.getElementById('ry').value),
        rz: parseFloat(document.getElementById('rz').value),
        shxy: parseFloat(document.getElementById('shxy').value),
        shxz: parseFloat(document.getElementById('shxz').value)
    };
}

function renderizar() {
    // 1. Obtener parámetros del panel
    const params = leerParametros();

    // 2. Actualizar indicadores numéricos
    document.getElementById('valTx').innerText = params.tx;
    document.getElementById('valTy').innerText = params.ty;
    document.getElementById('valTz').innerText = params.tz;
    document.getElementById('valSx').innerText = params.sx.toFixed(1);
    document.getElementById('valSy').innerText = params.sy.toFixed(1);
    document.getElementById('valSz').innerText = params.sz.toFixed(1);
    document.getElementById('valRx').innerText = params.rx + '°';
    document.getElementById('valRy').innerText = Math.round(params.ry) + '°';
    document.getElementById('valRz').innerText = params.rz + '°';
    document.getElementById('valShXY').innerText = params.shxy.toFixed(1);
    document.getElementById('valShXZ').innerText = params.shxz.toFixed(1);

    // 3. Limpiar lienzo
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 4. Dibujar ejes cartesianos de guía
    ctx.strokeStyle = PALETA.ejes;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CENTRO_X, 0); ctx.lineTo(CENTRO_X, canvas.height);
    ctx.moveTo(0, CENTRO_Y); ctx.lineTo(canvas.width, CENTRO_Y);
    ctx.stroke();

    // 5. Aplicar transformaciones 3D
    let verticesTransformados = modeloActual.map(v => transformarVertice3D(v, params));

    // 6. Proyectar a coordenadas 2D
    let vertices2D = verticesTransformados.map(proyectar3Da2D);

    // 7. Grosor base proporcional a la escala promedio (Sx, Sy, Sz)
    const escalaPromedio = (params.sx + params.sy + params.sz) / 3;
    const grosorBase = 1.2 + 1.8 * escalaPromedio;

    // Rango de profundidad para colorear (cerca = naranja, lejos = magenta)
    const zs = verticesTransformados.map(v => v.z);
    const zMin = Math.min(...zs);
    const zMax = Math.max(...zs);
    const rangoZ = (zMax - zMin) || 1;

    // Ordenar aristas de la más lejana a la más cercana (las cercanas quedan encima)
    const aristasOrdenadas = aristasPrimitiva
        .map(([a, b]) => ({ a, b, z: (verticesTransformados[a].z + verticesTransformados[b].z) / 2 }))
        .sort((p, q) => q.z - p.z);

    // 8. Renderizar aristas con color y grosor según profundidad y escala
    ctx.lineCap = 'round';
    for (let { a, b, z } of aristasOrdenadas) {
        let p1 = vertices2D[a];
        let p2 = vertices2D[b];
        const t = (z - zMin) / rangoZ;               // 0 = cerca, 1 = lejos
        const fPromedio = (p1.f + p2.f) / 2;         // factor de perspectiva
        ctx.strokeStyle = mezclarColor(PALETA.aristaCerca, PALETA.aristaLejos, t);
        ctx.lineWidth = grosorBase * fPromedio;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    // 9. Renderizar vértices (puntos turquesa con halo)
    for (let p of vertices2D) {
        const radio = (2.5 + 1.5 * escalaPromedio) * p.f;
        ctx.fillStyle = PALETA.brillo;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radio * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PALETA.vertice;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radio, 0, Math.PI * 2);
        ctx.fill();
    }

    // 10. Información de la figura activa
    ctx.fillStyle = 'rgba(253, 230, 138, 0.85)';
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(`${modeloActual.length} vértices · ${aristasPrimitiva.length} aristas`, 14, canvas.height - 14);
}

// ==============================================================================
// 7. SELECTOR DE FIGURA
// ==============================================================================
document.getElementById('figura').addEventListener('change', (e) => {
    const elegida = primitivas[e.target.value];
    modeloActual = elegida.vertices;
    aristasPrimitiva = elegida.aristas;
    renderizar();
});

// ==============================================================================
// 8. RETO: AUTO-ROTACIÓN CONTINUA EN EL EJE Y (YAW) CON requestAnimationFrame
// ==============================================================================
const botonAuto = document.getElementById('btnAutoRotar');
const sliderRy = document.getElementById('ry');
const VELOCIDAD_GRADOS_POR_SEG = 60;
let animacionId = null;
let tiempoAnterior = null;

function animarYaw(tiempoActual) {
    if (tiempoAnterior === null) tiempoAnterior = tiempoActual;
    const dt = (tiempoActual - tiempoAnterior) / 1000; // segundos
    tiempoAnterior = tiempoActual;

    // Incrementar el ángulo y mantenerlo en el rango [-180, 180]
    let ry = parseFloat(sliderRy.value) + VELOCIDAD_GRADOS_POR_SEG * dt;
    if (ry > 180) ry -= 360;
    sliderRy.value = ry;

    renderizar();
    animacionId = requestAnimationFrame(animarYaw);
}

function alternarAutoRotacion() {
    if (animacionId === null) {
        tiempoAnterior = null;
        animacionId = requestAnimationFrame(animarYaw);
        botonAuto.textContent = '⏸ Detener auto-rotación';
        botonAuto.classList.add('activo');
    } else {
        cancelAnimationFrame(animacionId);
        animacionId = null;
        botonAuto.textContent = '▶ Auto-rotación (Yaw)';
        botonAuto.classList.remove('activo');
    }
}

botonAuto.addEventListener('click', alternarAutoRotacion);

// Escuchar cambios en los deslizadores para refrescar en tiempo real
document.querySelectorAll('input[type=range]').forEach(input => {
    input.addEventListener('input', renderizar);
});

// Ejecución inicial
renderizar();
