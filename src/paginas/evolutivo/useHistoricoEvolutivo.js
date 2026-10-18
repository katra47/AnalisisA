import { useEffect, useMemo, useState } from 'react'
import { obtenerTodoHistoricoEvolutivo } from '../../herramientas/firebase/analisisFirestore'

const MESES = [
  { valor: '01', nombre: 'Enero' },
  { valor: '02', nombre: 'Febrero' },
  { valor: '03', nombre: 'Marzo' },
  { valor: '04', nombre: 'Abril' },
  { valor: '05', nombre: 'Mayo' },
  { valor: '06', nombre: 'Junio' },
  { valor: '07', nombre: 'Julio' },
  { valor: '08', nombre: 'Agosto' },
  { valor: '09', nombre: 'Septiembre' },
  { valor: '10', nombre: 'Octubre' },
  { valor: '11', nombre: 'Noviembre' },
  { valor: '12', nombre: 'Diciembre' },
]

// ==========================================
// INDICADORES
// ==========================================

const INDICADORES = [
  {
    titulo: 'Localidades Registradas 100% Sin Asignación',
    campo: 'locSinAsignacion',
    tipo: 'numero',
  },
  {
    titulo: 'Clientes Registrados 100% Sin Asignación',
    campo: 'clientesSinAsignacion',
    tipo: 'numero',
  },
  {
    titulo: 'Localidades Registradas Asignadas Parciales',
    campo: 'locParciales',
    tipo: 'numero',
  },
  {
    titulo: 'Clientes Registrados Parciales',
    campo: 'registradosParciales',
    tipo: 'numero',
  },
  {
    titulo: 'Clientes Asignados Parciales',
    campo: 'asignadosParciales',
    tipo: 'numero',
  },
  {
    titulo: '% de Asignacion Parcial',
    campo: 'porcentajeParcial',
    tipo: 'porcentaje',
  },
  {
    titulo: 'Localidades Asignadas 100%',
    campo: 'locCompletas',
    tipo: 'numero',
  },
  {
    titulo: 'Clientes Asignados 100%',
    campo: 'asignadosCompletos',
    tipo: 'numero',
  },

  // ESPACIO VISUAL
  {
    titulo: '',
    campo: '__espacio_1',
    tipo: 'espacio',
  },

  {
    titulo: 'Total Clientes Asignados',
    campo: 'totalAsignados',
    tipo: 'numero',
  },
  {
    titulo: 'Total Clientes Registrados',
    campo: 'totalRegistrados',
    tipo: 'numero',
  },
  {
    titulo: 'Total Clientes a Operar',
    campo: 'totalOperar',
    tipo: 'numero',
  },
  {
    titulo: '% de Asignacion',
    campo: 'porcentajeAsignacion',
    tipo: 'porcentaje',
  },

  // ESPACIO VISUAL
  {
    titulo: '',
    campo: '__espacio_2',
    tipo: 'espacio',
  },

  {
    titulo: 'Promedio Clientes Localidades Asignadas 100%',
    campo: 'promedioCompleta',
    tipo: 'decimal',
  },
  {
    titulo: 'Promedio Clientes Asignados Parciales',
    campo: 'promedioAsignadoParcial',
    tipo: 'decimal',
  },
  {
    titulo: 'Promedio Clientes Registrados Parciales',
    campo: 'promedioRegistradoParcial',
    tipo: 'decimal',
  },
  {
    titulo: 'Promedio Clientes Localidades Sin Asignación',
    campo: 'promedioSinAsignacion',
    tipo: 'decimal',
  },
  {
    titulo: 'Localidades Sin Asignación ≥ 10 Clientes',
    campo: 'locSinAsignacion10',
    tipo: 'numero',
  },
  {
    titulo: 'Clientes Registrados Sin Asignación ≥ 10',
    campo: 'clientesSinAsignacion10',
    tipo: 'numero',
  },
  {
    titulo: 'Localidades con Asignación menor al 50%',
    campo: 'locBajaAsignacion',
    tipo: 'numero',
  },
  {
    titulo: 'Clientes Registrados Baja Asignación',
    campo: 'registradosBaja',
    tipo: 'numero',
  },
  {
    titulo: 'Clientes Asignados Baja Asignación',
    campo: 'asignadosBaja',
    tipo: 'numero',
  },
  {
    titulo: 'Total UT',
    campo: 'totalUT',
    tipo: 'numero',
  },
  {
    titulo: 'UT Con Asignación',
    campo: 'utConAsignacion',
    tipo: 'numero',
  },
  {
    titulo: 'UT Sin Asignación',
    campo: 'utSinAsignacion',
    tipo: 'numero',
  },
  {
    titulo: 'Total Asignado UT',
    campo: 'totalAsignadoUT',
    tipo: 'numero',
  },
  {
    titulo: 'Ordenes Asignadas por UT',
    campo: 'ordenesAsignadasPorUT',
    tipo: 'decimal',
  },
]

// ==========================================
// FORMATEAR VALOR
// ==========================================

function formatearValor(valor, tipo) {
  if (
    valor === null ||
    valor === undefined ||
    Number.isNaN(Number(valor))
  ) {
    return '-'
  }

  const numero = Number(valor)

  if (tipo === 'porcentaje') {
    return `${(numero * 100).toFixed(2)}%`
  }

  if (tipo === 'decimal') {
    return numero.toLocaleString('es-GT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return numero.toLocaleString('es-GT')
}

// ==========================================
// FORMATEAR FECHA
// ==========================================

function formatearFecha(fecha) {
  if (!fecha) {
    return ''
  }

  const partes = String(fecha).split('-')

  if (partes.length !== 3) {
    return fecha
  }

  return `${partes[2]}/${partes[1]}`
}

// ==========================================
// OBTENER MÉTRICAS
// ==========================================

function obtenerMetricas(documento) {
  return documento?.datos ?? null
}

// ==========================================
// CALCULAR PROMEDIO
// ==========================================

function calcularPromedio(
  documentos,
  campo,
) {
  const valores = documentos
    .map((documento) => {
      const metricas =
        obtenerMetricas(documento)

      if (!metricas) {
        return null
      }

      const valor =
        metricas[campo]

      if (
        valor === null ||
        valor === undefined ||
        Number.isNaN(Number(valor))
      ) {
        return null
      }

      return Number(valor)
    })
    .filter(
      (valor) => valor !== null,
    )

  if (!valores.length) {
    return null
  }

  const total = valores.reduce(
    (acumulado, valor) =>
      acumulado + valor,
    0,
  )

  return total / valores.length
}

// ==========================================
// HISTÓRICO EVOLUTIVO
// ==========================================

const CLAVE_GRAFICAS = 'historico-evolutivo-graficas-v1'
const INDICADORES_GRAFICABLES = INDICADORES.filter((item) => item.tipo !== 'espacio')

function configuracionValida(config) {
  return config && typeof config.id === 'string' && typeof config.titulo === 'string'
    && ['lineas', 'barras', 'areas'].includes(config.tipo)
    && Array.isArray(config.campos) && config.campos.length > 0
    && new Set(config.campos).size === config.campos.length
    && config.campos.every((campo) => INDICADORES_GRAFICABLES.some((item) => item.campo === campo))
    && new Set(config.campos.map((campo) => INDICADORES_GRAFICABLES.find((item) => item.campo === campo).tipo)).size === 1
}

function cargarGraficas() {
  try {
    const guardadas = JSON.parse(localStorage.getItem(CLAVE_GRAFICAS) ?? 'null')
    if (Array.isArray(guardadas)) {
      const ids = new Set()
      return guardadas.filter((config) => {
        if (!configuracionValida(config) || ids.has(config.id)) return false
        ids.add(config.id)
        return true
      })
    }
  } catch { /* Usar gráficas iniciales si no hay preferencias válidas. */ }
  return [
    { id: 'clientes', titulo: 'Clientes asignados y registrados', tipo: 'lineas', campos: ['totalAsignados', 'totalRegistrados'] },
    { id: 'asignacion', titulo: 'Porcentajes de asignación', tipo: 'lineas', campos: ['porcentajeAsignacion', 'porcentajeParcial'] },
  ]
}

export function prepararGrafica(config, documentos) {
  const indicadores = config.campos.map((campo) => INDICADORES_GRAFICABLES.find((item) => item.campo === campo))
  const tipoValor = indicadores[0].tipo
  const filas = documentos.map((documento) => {
    const fila = { fecha: documento.fecha ?? documento.id }
    const metricas = obtenerMetricas(documento)
    config.campos.forEach((campo) => {
      const valor = metricas?.[campo]
      fila[campo] = valor == null || valor === '' || !Number.isFinite(Number(valor))
        ? null : Number(valor) * (tipoValor === 'porcentaje' ? 100 : 1)
    })
    return fila
  })
  const hayDatos = filas.some((fila) => config.campos.some((campo) => fila[campo] !== null))
  const formatear = (valor) => formatearValor(tipoValor === 'porcentaje' ? Number(valor) / 100 : valor, tipoValor)


  return { indicadores, tipoValor, filas, hayDatos, formatear }
}

export function useHistoricoEvolutivo() {
  const [
    documentos,
    setDocumentos,
  ] = useState([])

  const [
    cargando,
    setCargando,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState('')

  const [
    anioSeleccionado,
    setAnioSeleccionado,
  ] = useState('')

  const [
    mesSeleccionado,
    setMesSeleccionado,
  ] = useState('')

  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const rangoInvalido = Boolean(fechaDesde && fechaHasta && fechaDesde > fechaHasta)

  const [graficas, setGraficas] = useState(cargarGraficas)
  const [tituloGrafica, setTituloGrafica] = useState('')
  const [tipoGrafica, setTipoGrafica] = useState('lineas')
  const [camposGrafica, setCamposGrafica] = useState([])
  const [editandoGrafica, setEditandoGrafica] = useState(null)
  const [errorGrafica, setErrorGrafica] = useState('')
  const [errorPreferencias, setErrorPreferencias] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_GRAFICAS, JSON.stringify(graficas))
      setErrorPreferencias('')
    } catch {
      setErrorPreferencias('Las gráficas funcionarán durante esta sesión, pero el navegador no permitió guardar su configuración.')
    }
  }, [graficas])

  const reiniciarEditor = () => {
    setTituloGrafica('')
    setTipoGrafica('lineas')
    setCamposGrafica([])
    setEditandoGrafica(null)
    setErrorGrafica('')
  }

  const guardarGrafica = () => {
    const titulo = tituloGrafica.trim() || camposGrafica.map((campo) =>
      INDICADORES_GRAFICABLES.find((item) => item.campo === campo)?.titulo).join(' / ')
    const config = {
      id: editandoGrafica ?? `grafica-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      titulo, tipo: tipoGrafica, campos: camposGrafica,
    }
    if (!configuracionValida(config)) {
      setErrorGrafica('Selecciona uno o varios indicadores del mismo formato: cantidades, porcentajes o promedios.')
      return
    }
    setGraficas((actuales) => editandoGrafica
      ? actuales.map((item) => item.id === editandoGrafica ? config : item)
      : [...actuales, config])
    reiniciarEditor()
  }

  // ========================================
  // CARGAR HISTÓRICO
  // ========================================

  useEffect(() => {
    const cargarHistorico =
      async () => {
        try {
          setCargando(true)
          setError('')

          const resultado =
            await obtenerTodoHistoricoEvolutivo()

          const ordenados = [
            ...(resultado ?? []),
          ].sort((a, b) => {
            const fechaA =
              a.fecha ?? a.id

            const fechaB =
              b.fecha ?? b.id

            return String(
              fechaA,
            ).localeCompare(
              String(fechaB),
            )
          })

          setDocumentos(
            ordenados,
          )

          // SELECCIONAR ÚLTIMO AÑO Y MES
          if (ordenados.length) {
            const ultimo =
              ordenados[
                ordenados.length - 1
              ]

            const fecha =
              ultimo.fecha ??
              ultimo.id

            const [
              anio,
              mes,
            ] = String(
              fecha,
            ).split('-')

            setAnioSeleccionado(
              anio ?? '',
            )

            setMesSeleccionado(
              mes ?? '',
            )
          }
        } catch (err) {
          console.error(
            'Error cargando histórico:',
            err,
          )

          setError(
            'No fue posible cargar el histórico de Evolutivo.',
          )
        } finally {
          setCargando(false)
        }
      }

    cargarHistorico()
  }, [])

  // ========================================
  // AÑOS DISPONIBLES
  // ========================================

  const anios = useMemo(() => {
    const valores = new Set()

    documentos.forEach(
      (documento) => {
        const fecha =
          documento.fecha ??
          documento.id

        const anio =
          String(fecha).split(
            '-',
          )[0]

        if (anio) {
          valores.add(anio)
        }
      },
    )

    return Array.from(
      valores,
    ).sort(
      (a, b) =>
        Number(b) - Number(a),
    )
  }, [documentos])

  // ========================================
  // MESES DISPONIBLES
  // ========================================

  const mesesDisponibles =
    useMemo(() => {
      if (!anioSeleccionado) {
        return []
      }

      const valores = new Set()

      documentos.forEach(
        (documento) => {
          const fecha =
            documento.fecha ??
            documento.id

          const [
            anio,
            mes,
          ] = String(
            fecha,
          ).split('-')

          if (
            anio ===
              anioSeleccionado &&
            mes
          ) {
            valores.add(mes)
          }
        },
      )

      return MESES.filter(
        (mes) =>
          valores.has(
            mes.valor,
          ),
      )
    }, [
      documentos,
      anioSeleccionado,
    ])

  // ========================================
  // DOCUMENTOS DEL MES
  // ========================================

  // Si se eligen fechas, el rango sustituye al filtro de año y mes.
  // Los límites son inclusivos y se comparan como YYYY-MM-DD.
  const documentosMes = useMemo(() => {
    if (rangoInvalido) return []
    return documentos.filter((documento) => {
      const fecha = String(documento.fecha ?? documento.id).slice(0, 10)
      if (fechaDesde || fechaHasta) {
        return (!fechaDesde || fecha >= fechaDesde) && (!fechaHasta || fecha <= fechaHasta)
      }
      const [anio, mes] = fecha.split('-')
      return anio === anioSeleccionado && mes === mesSeleccionado
    }).sort((a, b) => String(a.fecha ?? a.id).localeCompare(String(b.fecha ?? b.id)))
  }, [documentos, anioSeleccionado, mesSeleccionado, fechaDesde, fechaHasta, rangoInvalido])

  // ========================================
  // CAMBIAR AÑO
  // ========================================

  const cambiarAnio = (
    event,
  ) => {
    setFechaDesde('')
    setFechaHasta('')

    const nuevoAnio =
      event.target.value

    setAnioSeleccionado(
      nuevoAnio,
    )

    const meses =
      documentos
        .map((documento) => {
          const fecha =
            documento.fecha ??
            documento.id

          const [
            anio,
            mes,
          ] = String(
            fecha,
          ).split('-')

          if (
            anio ===
            nuevoAnio
          ) {
            return mes
          }

          return null
        })
        .filter(Boolean)
        .sort()

    if (meses.length) {
      setMesSeleccionado(
        meses[
          meses.length - 1
        ],
      )
    } else {
      setMesSeleccionado('')
    }
  }

  // ========================================
  // CAMBIAR MES
  // ========================================

  const cambiarMes = (
    event,
  ) => {
    setFechaDesde('')
    setFechaHasta('')
    setMesSeleccionado(
      event.target.value,
    )
  }

  // ========================================
  // CARGANDO
  // ========================================


  const editarGrafica = (config) => {
    setEditandoGrafica(config.id)
    setTituloGrafica(config.titulo)
    setTipoGrafica(config.tipo)
    setCamposGrafica([...config.campos])
    setErrorGrafica('')
  }
  const quitarGrafica = (id) => {
    setGraficas((actuales) => actuales.filter((item) => item.id !== id))
    if (editandoGrafica === id) reiniciarEditor()
  }
  const limpiarGraficas = () => { setGraficas([]); reiniciarEditor() }
  const quitarFiltroFechas = () => { setFechaDesde(''); setFechaHasta('') }
  const cambiarCamposGrafica = (valor) => {
    setCamposGrafica(typeof valor === 'string' ? valor.split(',') : valor)
    setErrorGrafica('')
  }
  const indicadoresDisponibles = INDICADORES_GRAFICABLES.filter((item) => documentos.some((documento) => {
    const valor = obtenerMetricas(documento)?.[item.campo]
    return valor != null && valor !== '' && Number.isFinite(Number(valor))
  })).map((item) => item.campo)

  return {
    documentos, cargando, error, anioSeleccionado, mesSeleccionado,
    anios, mesesDisponibles, documentosMes, cambiarAnio, cambiarMes,
    fechaDesde, setFechaDesde, fechaHasta, setFechaHasta, rangoInvalido,
    graficas, tituloGrafica, setTituloGrafica, tipoGrafica, setTipoGrafica,
    camposGrafica, editandoGrafica, errorGrafica, errorPreferencias,
    reiniciarEditor, guardarGrafica, editarGrafica, quitarGrafica, limpiarGraficas,
    quitarFiltroFechas, cambiarCamposGrafica, indicadoresDisponibles
  }
}

export { INDICADORES, INDICADORES_GRAFICABLES, formatearValor, formatearFecha, obtenerMetricas, calcularPromedio }
