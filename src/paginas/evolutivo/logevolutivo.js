const TIPO_TRABAJO = 'CORTE BORNERA BRIGADA B'

// ==========================================
// NORMALIZAR TEXTO
// ==========================================

function normalizarTexto(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

// ==========================================
// BUSCAR COLUMNA
// ==========================================

function buscarColumna(
  encabezados,
  nombres,
  obligatorio = true,
) {
  const encabezadosNormalizados =
    encabezados.map(normalizarTexto)

  for (const nombre of nombres) {
    const indice =
      encabezadosNormalizados.indexOf(
        normalizarTexto(nombre),
      )

    if (indice !== -1) {
      return indice
    }
  }

  if (obligatorio) {
    throw new Error(
      `No se encontró la columna "${nombres[0]}" en el archivo.`,
    )
  }

  return -1
}

// ==========================================
// SUMAR CAMPO
// ==========================================

// Aceptar longitud/latitud tanto en orden X/Y como Y/X.
function esParGPSValido(valorX, valorY) {
  const existe = (valor) =>
    (typeof valor === 'number' || typeof valor === 'string') &&
    String(valor).trim() !== ''

  if (!existe(valorX) || !existe(valorY)) return false

  const x = Number(valorX)
  const y = Number(valorY)

  if (!Number.isFinite(x) || !Number.isFinite(y) || x === 0 || y === 0) {
    return false
  }

  return (
    (Math.abs(x) <= 180 && Math.abs(y) <= 90) ||
    (Math.abs(x) <= 90 && Math.abs(y) <= 180)
  )
}

function sumarCampo(lista, campo) {
  return lista.reduce(
    (total, item) =>
      total + (Number(item[campo]) || 0),
    0,
  )
}

// ==========================================
// EXTRAER UT
// ==========================================

function extraerUT(valor) {
  const texto =
    String(valor ?? '').trim()

  if (!texto) {
    return ''
  }

  const coincidencia = texto.match(
    /\bUT\s*[-:]?\s*(\d+)\b/i,
  )

  if (coincidencia) {
    return `UT ${coincidencia[1]}`
  }

  return texto
}

// ==========================================
// CREAR CLAVE REGIÓN
// ==========================================

function crearClaveRegion(region) {
  return normalizarTexto(region)
}

// ==========================================
// CREAR CLAVE LOCALIDAD
// ==========================================

function crearClaveLocalidad(
  region,
  localidad,
) {
  return [
    normalizarTexto(region),
    normalizarTexto(localidad),
  ].join('||')
}

// ==========================================
// CALCULAR MÉTRICAS
// ==========================================

function calcularMetricas(registros) {
  let asignadasSinCoordenadasValidas = 0
  let asignadasConCoordenadasValidas = 0
  let registradasSinCoordenadasValidas = 0
  let registradasConCoordenadasValidas = 0

  const mapaLocalidades = new Map()
  const mapaUT = new Map()

  registros.forEach((registro) => {
    if (registro.estado === 'asignada') {
      if (registro.gpsValido) asignadasConCoordenadasValidas++
      else asignadasSinCoordenadasValidas++
    }
    if (registro.estado === 'registrada') {
      if (registro.gpsValido) registradasConCoordenadasValidas++
      else registradasSinCoordenadasValidas++
    }

    const claveLocalidad =
      crearClaveLocalidad(
        registro.region,
        registro.localidad,
      )

    if (
      !mapaLocalidades.has(
        claveLocalidad,
      )
    ) {
      mapaLocalidades.set(
        claveLocalidad,
        {
          region: registro.region,
          localidad:
            registro.localidad,
          asignados: 0,
          registrados: 0,
        },
      )
    }

    const item =
      mapaLocalidades.get(
        claveLocalidad,
      )

    if (registro.estado === 'asignada') {
      item.asignados++
    }

    if (
      registro.estado ===
      'registrada'
    ) {
      item.registrados++
    }

    // ======================================
    // UT
    // ======================================

    if (registro.ut) {
      if (!mapaUT.has(registro.ut)) {
        mapaUT.set(
          registro.ut,
          {
            asignados: 0,
            registrados: 0,
          },
        )
      }

      const itemUT =
        mapaUT.get(registro.ut)

      if (
        registro.estado ===
        'asignada'
      ) {
        itemUT.asignados++
      }

      if (
        registro.estado ===
        'registrada'
      ) {
        itemUT.registrados++
      }
    }
  })

  // ========================================
  // LOCALIDADES
  // ========================================

  const localidades =
    Array.from(
      mapaLocalidades.values(),
    )

  localidades.forEach((item) => {
    item.total =
      item.asignados +
      item.registrados

    item.porcentaje =
      item.total > 0
        ? item.asignados /
          item.total
        : 0
  })

  // ========================================
  // CLASIFICACIONES
  // ========================================

  const sinAsignacion =
    localidades.filter(
      (item) =>
        item.asignados === 0 &&
        item.registrados > 0,
    )

  const parciales =
    localidades.filter(
      (item) =>
        item.asignados > 0 &&
        item.registrados > 0,
    )

  const completas =
    localidades.filter(
      (item) =>
        item.asignados > 0 &&
        item.registrados === 0,
    )

  const sinAsignacion10 =
    sinAsignacion.filter(
      (item) =>
        item.registrados >= 10,
    )

  const bajaAsignacion =
    parciales.filter(
      (item) =>
        item.porcentaje < 0.5,
    )

  // ========================================
  // SUMATORIAS
  // ========================================

  const clientesSinAsignacion =
    sumarCampo(
      sinAsignacion,
      'registrados',
    )

  const registradosParciales =
    sumarCampo(
      parciales,
      'registrados',
    )

  const asignadosParciales =
    sumarCampo(
      parciales,
      'asignados',
    )

  const asignadosCompletos =
    sumarCampo(
      completas,
      'asignados',
    )

  // ========================================
  // TOTALES
  // ========================================

  const totalAsignados =
    asignadosCompletos +
    asignadosParciales

  const totalRegistrados =
    clientesSinAsignacion +
    registradosParciales

  const totalOperar =
    totalAsignados +
    totalRegistrados

  const porcentajeAsignacion =
    totalOperar > 0
      ? totalAsignados /
        totalOperar
      : 0

  // ========================================
  // PARCIALES
  // ========================================

  const totalParcial =
    asignadosParciales +
    registradosParciales

  const porcentajeParcial =
    totalParcial > 0
      ? asignadosParciales /
        totalParcial
      : 0

  // ========================================
  // PROMEDIOS
  // ========================================

  const promedioCompleta =
    completas.length > 0
      ? asignadosCompletos /
        completas.length
      : 0

  const promedioAsignadoParcial =
    parciales.length > 0
      ? asignadosParciales /
        parciales.length
      : 0

  const promedioRegistradoParcial =
    parciales.length > 0
      ? registradosParciales /
        parciales.length
      : 0

  const promedioSinAsignacion =
    sinAsignacion.length > 0
      ? clientesSinAsignacion /
        sinAsignacion.length
      : 0

  // ========================================
  // MAYOR 10 / MENOR 50%
  // ========================================

  const clientesSinAsignacion10 =
    sumarCampo(
      sinAsignacion10,
      'registrados',
    )

  const registradosBaja =
    sumarCampo(
      bajaAsignacion,
      'registrados',
    )

  const asignadosBaja =
    sumarCampo(
      bajaAsignacion,
      'asignados',
    )

  // ========================================
  // UT
  // ========================================

  let utConAsignacion = 0
  let utSinAsignacion = 0
  let totalAsignadoUT = 0

  mapaUT.forEach((item) => {
    totalAsignadoUT +=
      item.asignados

    if (item.asignados > 0) {
      utConAsignacion++
    } else {
      utSinAsignacion++
    }
  })

  const ordenesAsignadasPorUT =
    utConAsignacion > 0
      ? totalAsignadoUT /
        utConAsignacion
      : 0

  // ========================================
  // RESULTADO
  // ========================================

  return {
    asignadasSinCoordenadasValidas,
    asignadasConCoordenadasValidas,
    registradasSinCoordenadasValidas,
    registradasConCoordenadasValidas,
    totalPrimerosCortesSinCoordenadasValidas:
      asignadasSinCoordenadasValidas + registradasSinCoordenadasValidas,
    totalPrimerosCortesConCoordenadasValidas:
      asignadasConCoordenadasValidas + registradasConCoordenadasValidas,

    filasAnalizadas:
      registros.length,

    localidadesTotales:
      localidades.length,

    // SIN ASIGNACIÓN

    locSinAsignacion:
      sinAsignacion.length,

    clientesSinAsignacion,

    // PARCIALES

    locParciales:
      parciales.length,

    registradosParciales,

    asignadosParciales,

    porcentajeParcial,

    // COMPLETAS

    locCompletas:
      completas.length,

    asignadosCompletos,

    // TOTALES

    totalAsignados,

    totalRegistrados,

    totalOperar,

    porcentajeAsignacion,

    // PROMEDIOS

    promedioCompleta,

    promedioAsignadoParcial,

    promedioRegistradoParcial,

    promedioSinAsignacion,

    // MAYOR 10

    locSinAsignacion10:
      sinAsignacion10.length,

    clientesSinAsignacion10,

    // MENOR 50%

    locBajaAsignacion:
      bajaAsignacion.length,

    registradosBaja,

    asignadosBaja,

    // UT

    totalUT:
      mapaUT.size,

    utConAsignacion,

    utSinAsignacion,

    totalAsignadoUT,

    ordenesAsignadasPorUT,

    // DETALLE

    detalleLocalidades:
      localidades,
  }
}

// ==========================================
// FUNCIÓN PRINCIPAL
// ==========================================

export function analizarEvolutivo(datos) {
  if (
    !Array.isArray(datos) ||
    datos.length < 2
  ) {
    throw new Error(
      'El archivo no contiene información suficiente.',
    )
  }

  // ========================================
  // ENCABEZADOS
  // ========================================

  const encabezados = datos[0]

  const colRegion =
    buscarColumna(
      encabezados,
      [
        'Región',
        'Region',
      ],
    )

  const colLocalidad =
    buscarColumna(
      encabezados,
      [
        'Localidad',
        'Primera fecha: Localidad',
      ],
    )

  const colEstado =
    buscarColumna(
      encabezados,
      [
        'Estados (grupos)',
        'Estado (grupos)',
        'Estados grupos',
        'Estado grupos',
        'Estado',
        'Primera fecha: Estado',
      ],
    )

  const colTipoTrabajo =
    buscarColumna(
      encabezados,
      [
        'Tipo de trabajo',
        'Primera fecha: Tipo de trabajo',
      ],
    )

  const colUnidadOperativa =
    buscarColumna(
      encabezados,
      [
        'Unidad Operativa',
        'Primera fecha: Unidad Operativa',
        'Unidad de trabajo',
        'Primera fecha: Unidad de trabajo',
      ],
      false,
    )

  const colUT =
    buscarColumna(
      encabezados,
      ['UT'],
      false,
    )

  // ========================================
  // PREPARAR REGISTROS
  // ========================================

  const paresGPS = [
    ['Coordenada Valida X', 'Coordenada Valida Y'],
    ['H.R.Coordenada X', 'H.R.Coordenada Y'],
    ['Lecturas X', 'Lecturas Y'],
  ].map(([nombreX, nombreY]) => [
    buscarColumna(encabezados, [nombreX], false),
    buscarColumna(encabezados, [nombreY], false),
  ])

  const registros = []

  const tipoObjetivo =
    normalizarTexto(
      TIPO_TRABAJO,
    )

  for (
    let i = 1;
    i < datos.length;
    i++
  ) {
    const fila = datos[i]

    // ======================================
    // TIPO DE TRABAJO
    // ======================================

    const tipoTrabajo =
      normalizarTexto(
        fila[colTipoTrabajo],
      )

    if (
      tipoTrabajo !==
      tipoObjetivo
    ) {
      continue
    }

    // ======================================
    // ESTADO
    // ======================================

    const estado =
      normalizarTexto(
        fila[colEstado],
      )

    const esAsignada =
      estado === 'asignada'

    const esRegistrada =
      estado === 'registrada'

    if (
      !esAsignada &&
      !esRegistrada
    ) {
      continue
    }

    // ======================================
    // REGIÓN
    // ======================================

    const region =
      String(
        fila[colRegion] ?? '',
      ).trim()

    if (!region) {
      continue
    }

    // ======================================
    // LOCALIDAD
    // ======================================

    const localidad =
      String(
        fila[colLocalidad] ?? '',
      ).trim()

    if (!localidad) {
      continue
    }

    // ======================================
    // UT
    // ======================================

    let ut = ''

    if (
      colUnidadOperativa !== -1
    ) {
      ut = extraerUT(
        fila[
          colUnidadOperativa
        ],
      )
    }

    if (
      !ut &&
      colUT !== -1
    ) {
      ut = extraerUT(
        fila[colUT],
      )
    }

    // ======================================
    // GUARDAR REGISTRO
    // ======================================

    const gpsValido = paresGPS.some(([colX, colY]) =>
      colX !== -1 && colY !== -1 && esParGPSValido(fila[colX], fila[colY]),
    )

    registros.push({
      gpsValido,
      region,
      localidad,
      estado,
      ut,
    })
  }

  if (registros.length === 0) {
    throw new Error(
      'No se encontraron registros válidos para Evolutivo.',
    )
  }

  // ========================================
  // RESULTADO GENERAL
  // ========================================

  const general =
    calcularMetricas(
      registros,
    )

  // ========================================
  // AGRUPAR POR REGIÓN
  // ========================================

  const mapaRegiones =
    new Map()

  registros.forEach(
    (registro) => {
      const clave =
        crearClaveRegion(
          registro.region,
        )

      if (
        !mapaRegiones.has(clave)
      ) {
        mapaRegiones.set(
          clave,
          {
            nombre:
              registro.region,
            registros: [],
          },
        )
      }

      mapaRegiones
        .get(clave)
        .registros
        .push(registro)
    },
  )

  // ========================================
  // CALCULAR REGIONES
  // ========================================

  const regiones = {}

  mapaRegiones.forEach(
    (grupo, clave) => {
      regiones[clave] = {
        nombre:
          grupo.nombre,

        metricas:
          calcularMetricas(
            grupo.registros,
          ),

        localidades: {},
      }

      // ====================================
      // LOCALIDADES DE LA REGIÓN
      // ====================================

      const mapaLocalidades =
        new Map()

      grupo.registros.forEach(
        (registro) => {
          const claveLocalidad =
            normalizarTexto(
              registro.localidad,
            )

          if (
            !mapaLocalidades.has(
              claveLocalidad,
            )
          ) {
            mapaLocalidades.set(
              claveLocalidad,
              {
                nombre:
                  registro.localidad,
                registros: [],
              },
            )
          }

          mapaLocalidades
            .get(claveLocalidad)
            .registros
            .push(registro)
        },
      )

      mapaLocalidades.forEach(
        (
          grupoLocalidad,
          claveLocalidad,
        ) => {
          regiones[
            clave
          ].localidades[
            claveLocalidad
          ] = {
            nombre:
              grupoLocalidad.nombre,

            metricas:
              calcularMetricas(
                grupoLocalidad.registros,
              ),
          }
        },
      )
    },
  )

  // ========================================
  // LISTADO DE REGIONES
  // ========================================

  const listaRegiones =
    Object.entries(regiones)
      .map(
        ([
          clave,
          region,
        ]) => ({
          clave,
          nombre:
            region.nombre,
        }),
      )
      .sort((a, b) =>
        a.nombre.localeCompare(
          b.nombre,
          'es',
        ),
      )

  // ========================================
  // RESULTADO FINAL
  // ========================================

  return {
    filasArchivo:
      datos.length - 1,

    filasAnalizadas:
      registros.length,

    general,

    regiones,

    listaRegiones,

    // ======================================
    // COMPATIBILIDAD CON LA VISTA ACTUAL
    // ======================================

    ...general,
  }
}