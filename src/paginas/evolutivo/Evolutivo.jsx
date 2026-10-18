import {
  useEffect,
  useState,
} from 'react'

import { useNavigate } from 'react-router-dom'

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material'

import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'

import {
  Bar,
  BarChart,
  LabelList,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  obtenerAnalisisActual,
} from '../../herramientas/firebase/analisisFirestore'

// ==========================================
// COLORES GRÁFICAS
// ==========================================

const COLORES = [
  '#123f5c',
  '#0086c9',
  '#38a169',
  '#f59e0b',
  '#ef4444',
]

// ==========================================
// FORMATEADORES
// ==========================================

function numero(valor) {
  if (
    valor === null ||
    valor === undefined ||
    Number.isNaN(Number(valor))
  ) {
    return '0'
  }

  return Number(valor).toLocaleString(
    'es-GT',
  )
}

function porcentaje(valor) {
  if (
    valor === null ||
    valor === undefined ||
    Number.isNaN(Number(valor))
  ) {
    return '0.00%'
  }

  return `${(
    Number(valor) * 100
  ).toFixed(2)}%`
}

function decimal(valor) {
  if (
    valor === null ||
    valor === undefined ||
    Number.isNaN(Number(valor))
  ) {
    return '0.00'
  }

  return Number(valor).toLocaleString(
    'es-GT',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )
}

// ==========================================
// FILA NORMAL
// ==========================================

function Fila({
  titulo,
  valor,
  destacada = false,
}) {
  return (
    <TableRow
      sx={{
        bgcolor: destacada
          ? '#eef8fc'
          : '#ffffff',

        '&:hover': {
          bgcolor: destacada
            ? '#e0f2fe'
            : '#f8fafc',
        },
      }}
    >
      <TableCell
        sx={{
          py: 1.2,
          px: 2,

          fontWeight: destacada
            ? 700
            : 500,

          color: destacada
            ? '#123f5c'
            : '#334155',

          borderBottom:
            '1px solid #e2e8f0',
        }}
      >
        {titulo}
      </TableCell>

      <TableCell
        align="right"
        sx={{
          py: 1.2,
          px: 2,

          fontWeight: 700,
          color: '#123f5c',

          whiteSpace: 'nowrap',

          borderBottom:
            '1px solid #e2e8f0',
        }}
      >
        {valor}
      </TableCell>
    </TableRow>
  )
}

// ==========================================
// FILA ESPACIO
// ==========================================

function Espacio() {
  return (
    <TableRow>
      <TableCell
        colSpan={2}
        sx={{
          height: 14,
          p: 0,
          bgcolor: '#f8fafc',
          borderBottom:
            '1px solid #e2e8f0',
        }}
      />
    </TableRow>
  )
}

// ==========================================
// TARJETA GRÁFICA
// ==========================================

function Grafica({
  titulo,
  subtitulo,
  children,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border:
          '1px solid #e2e8f0',
        borderRadius: 3,
        bgcolor: '#ffffff',
        minHeight: 360,
      }}
    >
      <Typography
        sx={{
          fontWeight: 700,
          color: '#123f5c',
          fontSize: '1.05rem',
        }}
      >
        {titulo}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mb: 2,
        }}
      >
        {subtitulo}
      </Typography>

      <Box
        sx={{
          width: '100%',
          height: 270,
        }}
      >
        {children}
      </Box>
    </Paper>
  )
}

// ==========================================
// EVOLUTIVO
// ==========================================

function Barras({ datos, formato = 'numero', colores = COLORES }) {
  const formatear = (valor) => formato === 'porcentaje'
    ? `${Number(valor).toFixed(2)}%`
    : formato === 'decimal' ? decimal(valor) : numero(valor)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={datos} margin={{ top: 28, right: 20, left: 0, bottom: 38 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="nombre" interval={0} tick={{ fontSize: 11 }} height={55} />
        <YAxis allowDecimals={formato !== 'numero'}
          domain={formato === 'porcentaje' ? [0, 100] : [0, 'auto']}
          tickFormatter={formato === 'porcentaje' ? (valor) => `${valor}%` : numero} />
        <Tooltip formatter={(valor) => formatear(valor)} />
        <Bar dataKey="valor" name={formato === 'porcentaje' ? 'Porcentaje' : 'Clientes'} radius={[6, 6, 0, 0]} maxBarSize={75}>
          {datos.map((item, index) => <Cell key={item.nombre} fill={colores[index % colores.length]} />)}
          <LabelList dataKey="valor" position="top" formatter={formatear} style={{ fontSize: 11, fill: '#123f5c' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function Evolutivo() {
  const navigate = useNavigate()

  const [
    analisis,
    setAnalisis,
  ] = useState(null)

  const [
    cargando,
    setCargando,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState('')

  const [actualizadoEn, setActualizadoEn] = useState(null)
  const datos = analisis?.general ?? analisis
  const contexto = 'General'
  const fechaActualizacion = actualizadoEn?.toDate
    ? actualizadoEn.toDate() : null

  // ========================================
  // CARGAR DATOS
  // ========================================

  useEffect(() => {
    const cargarDatos =
      async () => {
        try {
          setCargando(true)
          setError('')

          const documento =
            await obtenerAnalisisActual(
              'evolutivo',
            )

          if (!documento) {
            setAnalisis(null)
            return
          }

          setActualizadoEn(documento.actualizadoEn ?? null)

          setAnalisis(
            documento.datos ??
              null,
          )
        } catch (err) {
          console.error(
            'Error cargando Evolutivo:',
            err,
          )

          setError(
            'No fue posible cargar los datos del Evolutivo.',
          )
        } finally {
          setCargando(false)
        }
      }

    cargarDatos()
  }, [])

  // ========================================
  // CARGANDO
  // ========================================

  if (cargando) {
    return (
      <Box
        sx={{
          minHeight: 400,
          display: 'flex',
          flexDirection:
            'column',
          justifyContent:
            'center',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <CircularProgress />

        <Typography
          color="text.secondary"
        >
          Cargando Evolutivo...
        </Typography>
      </Box>
    )
  }

  // ========================================
  // ERROR
  // ========================================

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    )
  }

  // ========================================
  // SIN DATOS
  // ========================================

  if (!datos) {
    return (
      <Box
        sx={{
          width: '100%',
          maxWidth: 1400,
          mx: 'auto',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            gap: 2,
            mb: 3,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#123f5c',
            }}
          >
            Evolutivo
          </Typography>

          <Button
            variant="outlined"
            startIcon={
              <HistoryRoundedIcon />
            }
            onClick={() =>
              navigate(
                '/evolutivo/historico',
              )
            }
          >
            Ver histórico
          </Button>
        </Box>

        <Alert severity="info">
          Todavía no existen datos
          procesados. Carga y procesa
          un archivo Excel primero.
        </Alert>
      </Box>
    )
  }

  // ========================================
  // DATOS GRÁFICAS
  // ========================================

  const camposGPS = [
    'asignadasSinCoordenadasValidas', 'asignadasConCoordenadasValidas',
    'registradasSinCoordenadasValidas', 'registradasConCoordenadasValidas',
    'totalPrimerosCortesSinCoordenadasValidas', 'totalPrimerosCortesConCoordenadasValidas',
  ]
  const tieneGPS = camposGPS.every((campo) => datos[campo] != null)
  const valor = (campo) => Number(datos[campo]) || 0
  const datosPorcentajes = [
    { nombre: 'Asignación parcial', valor: valor('porcentajeParcial') * 100 },
    { nombre: 'Asignación general', valor: valor('porcentajeAsignacion') * 100 },
  ]
  const datosAsignados = [
    { nombre: 'Clientes asignados', valor: valor('totalAsignados') },
    { nombre: 'Total asignado UT', valor: valor('totalAsignadoUT') },
  ]
  const datosPromedio = [
    { nombre: 'Clientes por localidad', valor: valor('promedioCompleta') },
  ]
  const datosGPSAsignadas = [
    { nombre: 'Sin coordenadas válidas', valor: valor('asignadasSinCoordenadasValidas') },
    { nombre: 'Con coordenadas válidas', valor: valor('asignadasConCoordenadasValidas') },
  ]
  const datosGPSRegistradas = [
    { nombre: 'Sin coordenadas válidas', valor: valor('registradasSinCoordenadasValidas') },
    { nombre: 'Con coordenadas válidas', valor: valor('registradasConCoordenadasValidas') },
  ]
  const datosPrimerosCortes = [
    { nombre: 'Sin coordenadas válidas', valor: valor('totalPrimerosCortesSinCoordenadasValidas') },
    { nombre: 'Con coordenadas válidas', valor: valor('totalPrimerosCortesConCoordenadasValidas') },
  ]

  // ========================================
  // PÁGINA
  // ========================================

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1500,
        mx: 'auto',
      }}
    >
      {/* ==================================
          ENCABEZADO
      ================================== */}

      <Box
        sx={{
          display: 'flex',
          flexDirection: {
            xs: 'column',
            sm: 'row',
          },
          justifyContent:
            'space-between',
          alignItems: {
            xs: 'flex-start',
            sm: 'center',
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#123f5c',
              mb: 0.5,
            }}
          >
            Evolutivo
          </Typography>

          <Typography
            color="text.secondary"
          >
            Resultados del último análisis procesado · {contexto}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Última actualización: {fechaActualizacion && !Number.isNaN(fechaActualizacion.getTime())
              ? fechaActualizacion.toLocaleString('es-GT') : 'No disponible'}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={
            <HistoryRoundedIcon />
          }
          onClick={() =>
            navigate(
              '/evolutivo/historico',
            )
          }
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          Ver histórico
        </Button>
      </Box>

      {!tieneGPS && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Procesa nuevamente el Excel para obtener los indicadores GPS.
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.15fr) minmax(0, 1fr)' }, gap: 3, alignItems: 'start' }}>
      <Box sx={{ minWidth: 0 }}>
      {/* ==================================
          TABLA
      ================================== */}

      <Paper
        elevation={0}
        sx={{
          border:
            '1px solid #e2e8f0',
          borderRadius: 3,
          overflow: 'hidden',
          mb: 4,
        }}
      >
        {/* CABECERA */}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns:
              '1fr 180px',
            bgcolor: '#123f5c',
            color: '#ffffff',
          }}
        >
          <Typography
            sx={{
              px: 2,
              py: 1.5,
              fontWeight: 700,
            }}
          >
            Indicador
          </Typography>

          <Typography
            sx={{
              px: 2,
              py: 1.5,
              fontWeight: 700,
              textAlign: 'right',
            }}
          >
            Valor
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableBody>

              {/* SIN ASIGNACIÓN */}

              <Fila
                titulo="Localidades Registradas 100% Sin Asignación"
                valor={numero(
                  datos.locSinAsignacion,
                )}
              />

              <Fila
                titulo="Clientes Registrados 100% Sin Asignación"
                valor={numero(
                  datos.clientesSinAsignacion,
                )}
              />

              {/* PARCIALES */}

              <Fila
                titulo="Localidades Registradas Asignadas Parciales"
                valor={numero(
                  datos.locParciales,
                )}
              />

              <Fila
                titulo="Clientes Registrados Parciales"
                valor={numero(
                  datos.registradosParciales,
                )}
              />

              <Fila
                titulo="Clientes Asignados Parciales"
                valor={numero(
                  datos.asignadosParciales,
                )}
              />

              <Fila
                titulo="% de Asignación Parcial"
                valor={porcentaje(
                  datos.porcentajeParcial,
                )}
              />

              {/* 100% */}

              <Fila
                titulo="Localidades Asignadas 100%"
                valor={numero(
                  datos.locCompletas,
                )}
              />

              <Fila
                titulo="Clientes Asignados 100%"
                valor={numero(
                  datos.asignadosCompletos,
                )}
              />

              <Espacio />

              {/* TOTALES */}

              <Fila
                titulo="Total Clientes Asignados"
                valor={numero(
                  datos.totalAsignados,
                )}
                destacada
              />

              <Fila
                titulo="Total Clientes Registrados"
                valor={numero(
                  datos.totalRegistrados,
                )}
                destacada
              />

              <Fila
                titulo="Total Clientes a Operar"
                valor={numero(
                  datos.totalOperar,
                )}
                destacada
              />

              <Fila
                titulo="% de Asignación"
                valor={porcentaje(
                  datos.porcentajeAsignacion,
                )}
                destacada
              />

              <Espacio />

              <Espacio />
              {/* COORDENADAS GPS */}
              <Fila titulo="Corte en Bornera Brigada B Asignadas Sin Coordenadas Válidas" valor={datos.asignadasSinCoordenadasValidas == null ? 'No disponible' : numero(datos.asignadasSinCoordenadasValidas)} />
              <Fila titulo="Corte en Bornera Brigada B Asignadas Con Coordenadas Válidas" valor={datos.asignadasConCoordenadasValidas == null ? 'No disponible' : numero(datos.asignadasConCoordenadasValidas)} />
              <Fila titulo="Corte en Bornera Brigada B Registradas Sin Coordenadas Válidas" valor={datos.registradasSinCoordenadasValidas == null ? 'No disponible' : numero(datos.registradasSinCoordenadasValidas)} />
              <Fila titulo="Corte en Bornera Brigada B Registradas Con Coordenadas Válidas" valor={datos.registradasConCoordenadasValidas == null ? 'No disponible' : numero(datos.registradasConCoordenadasValidas)} />
              <Fila titulo="Total de Primeros Cortes Sin Coordenadas Válidas" valor={datos.totalPrimerosCortesSinCoordenadasValidas == null ? 'No disponible' : numero(datos.totalPrimerosCortesSinCoordenadasValidas)} />
              <Fila titulo="Total de Primeros Cortes Con Coordenadas Válidas" valor={datos.totalPrimerosCortesConCoordenadasValidas == null ? 'No disponible' : numero(datos.totalPrimerosCortesConCoordenadasValidas)} />

              <Espacio />
              {/* PROMEDIOS */}

              <Fila
                titulo="Clientes por Localidad Asignadas 100%"
                valor={decimal(
                  datos.promedioCompleta,
                )}
              />

              <Fila
                titulo="Promedio Clientes Asignados Parciales"
                valor={decimal(
                  datos.promedioAsignadoParcial,
                )}
              />

              <Fila
                titulo="Promedio Clientes Registrados Parciales"
                valor={decimal(
                  datos.promedioRegistradoParcial,
                )}
              />

              <Fila
                titulo="Promedio Clientes Localidades Sin Asignación"
                valor={decimal(
                  datos.promedioSinAsignacion,
                )}
              />

              {/* >= 10 */}

              <Fila
                titulo="Localidades Sin Asignación ≥ 10 Clientes"
                valor={numero(
                  datos.locSinAsignacion10,
                )}
              />

              <Fila
                titulo="Clientes Registrados Sin Asignación ≥ 10"
                valor={numero(
                  datos.clientesSinAsignacion10,
                )}
              />

              {/* BAJA ASIGNACIÓN */}

              <Fila
                titulo="Localidades con Asignación menor al 50%"
                valor={numero(
                  datos.locBajaAsignacion,
                )}
              />

              <Fila
                titulo="Clientes Registrados Baja Asignación"
                valor={numero(
                  datos.registradosBaja,
                )}
              />

              <Fila
                titulo="Clientes Asignados Baja Asignación"
                valor={numero(
                  datos.asignadosBaja,
                )}
              />

              {/* UT */}

              <Fila
                titulo="Total UT"
                valor={numero(
                  datos.totalUT,
                )}
              />

              <Fila
                titulo="UT Con Asignación"
                valor={numero(
                  datos.utConAsignacion,
                )}
              />

              <Fila
                titulo="UT Sin Asignación"
                valor={numero(
                  datos.utSinAsignacion,
                )}
              />

              <Fila
                titulo="Total Asignado UT"
                valor={numero(
                  datos.totalAsignadoUT,
                )}
              />

              <Fila
                titulo="Ordenes Asignadas por UT"
                valor={decimal(
                  datos.ordenesAsignadasPorUT,
                )}
              />
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      </Box>
      <Box sx={{ minWidth: 0 }}>
      {/* ==================================
          GRÁFICAS
      ================================== */}

      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: '#123f5c',
          mb: 2,
        }}
      >
        Resumen gráfico
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'minmax(0, 1fr)',
            xl: 'repeat(2, minmax(0, 1fr))',
          },
          gap: 3,
          mb: 4,
        }}
      >
        <Grafica titulo="Porcentajes de asignación" subtitulo="Asignación parcial y general">
          <Barras datos={datosPorcentajes} formato="porcentaje" />
        </Grafica>
        <Grafica titulo="Clientes asignados y total asignado UT" subtitulo="Comparación de indicadores; los valores no se suman">
          <Barras datos={datosAsignados} />
        </Grafica>
        <Grafica titulo="Clientes por Localidad Asignadas 100%" subtitulo="Promedio de clientes en localidades completamente asignadas">
          <Barras datos={datosPromedio} formato="decimal" />
        </Grafica>
        <Grafica titulo="Corte en Bornera Brigada B · Asignadas" subtitulo="Con y sin coordenadas válidas">
          {tieneGPS ? <Barras datos={datosGPSAsignadas} colores={['#ef4444', '#38a169']} />
            : <Typography color="text.secondary">Indicadores GPS no disponibles.</Typography>}
        </Grafica>
        <Grafica titulo="Corte en Bornera Brigada B · Registradas" subtitulo="Con y sin coordenadas válidas">
          {tieneGPS ? <Barras datos={datosGPSRegistradas} colores={['#ef4444', '#38a169']} />
            : <Typography color="text.secondary">Indicadores GPS no disponibles.</Typography>}
        </Grafica>
        <Grafica titulo="Total de Primeros Cortes" subtitulo="Con y sin coordenadas válidas">
          {tieneGPS ? <Barras datos={datosPrimerosCortes} colores={['#ef4444', '#38a169']} />
            : <Typography color="text.secondary">Indicadores GPS no disponibles.</Typography>}
        </Grafica>
      </Box>
      </Box>
      </Box>
    </Box>
  )
}

export default Evolutivo
