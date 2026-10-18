import { useNavigate } from 'react-router-dom'

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Checkbox,
  ListItemText,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  useHistoricoEvolutivo,
  INDICADORES,
  INDICADORES_GRAFICABLES,
  formatearValor,
  formatearFecha,
  obtenerMetricas,
  calcularPromedio,
  prepararGrafica,
} from './useHistoricoEvolutivo'


const COLORES_GRAFICAS = [
  '#0086c9',
  '#38a169',
  '#f59e0b',
  '#9333ea',
  '#ef4444',
  '#123f5c',
]


function GraficaHistorica({
  config,
  documentos,
  onEditar,
  onQuitar,
}) {

  const {
    indicadores,
    tipoValor,
    filas,
    hayDatos,
    formatear,
  } = prepararGrafica(config, documentos)

  const Contenedor =
    config.tipo === 'barras'
      ? BarChart
      : config.tipo === 'areas'
        ? AreaChart
        : LineChart

  const Serie =
    config.tipo === 'barras'
      ? Bar
      : config.tipo === 'areas'
        ? Area
        : Line

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: '1px solid #e2e8f0',
        borderRadius: 3,
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          justifyContent: 'space-between',
          alignItems: 'start',
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            color: '#123f5c',
          }}
        >
          {config.titulo}
        </Typography>

        <Box>
          <Button
            size="small"
            onClick={onEditar}
          >
            Editar
          </Button>

          <Button
            size="small"
            color="error"
            onClick={onQuitar}
          >
            Quitar
          </Button>
        </Box>
      </Box>

      {hayDatos ? (
        <Box
          sx={{
            width: '100%',
            height: 380,
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <Contenedor
              data={filas}
              margin={{
                top: 12,
                right: 18,
                left: 12,
                bottom: 15,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="fecha"
                tickFormatter={formatearFecha}
                tick={{
                  fontSize: 11,
                }}
              />

              <YAxis
                width={85}
                allowDecimals={tipoValor !== 'numero'}
                domain={
                  tipoValor === 'porcentaje'
                    ? [0, 100]
                    : [0, 'auto']
                }
                tickFormatter={(valor) =>
                  tipoValor === 'porcentaje'
                    ? `${valor}%`
                    : Number(valor).toLocaleString('es-GT')
                }
              />

              <Tooltip
                formatter={formatear}
                labelFormatter={(fecha) =>
                  `Fecha: ${fecha}`
                }
              />

              <Legend
                wrapperStyle={{
                  fontSize: 12,
                }}
              />

              {indicadores.map(
                (indicador, index) => (
                  <Serie
                    key={indicador.campo}
                    dataKey={indicador.campo}
                    name={indicador.titulo}
                    stroke={
                      COLORES_GRAFICAS[
                        index % COLORES_GRAFICAS.length
                      ]
                    }
                    fill={
                      COLORES_GRAFICAS[
                        index % COLORES_GRAFICAS.length
                      ]
                    }
                    {...(
                      config.tipo === 'barras'
                        ? {
                            maxBarSize: 48,
                          }
                        : {
                            type: 'linear',
                            connectNulls: false,
                            strokeWidth: 2,
                            dot: {
                              r: 3,
                            },
                            ...(config.tipo === 'areas'
                              ? {
                                  fillOpacity: 0.14,
                                }
                              : {}),
                          }
                    )}
                  />
                ),
              )}
            </Contenedor>
          </ResponsiveContainer>
        </Box>
      ) : (
        <Alert severity="info">
          No hay valores disponibles para esta gráfica
          en el período seleccionado.
        </Alert>
      )}
    </Paper>
  )
}


function HistoricoEvolutivo() {

  const navigate = useNavigate()

  const {
    documentos,
    cargando,
    error,

    anioSeleccionado,
    mesSeleccionado,

    anios,
    mesesDisponibles,
    documentosMes,

    cambiarAnio,
    cambiarMes,

    fechaDesde,
    setFechaDesde,

    fechaHasta,
    setFechaHasta,

    rangoInvalido,

    graficas,

    tituloGrafica,
    setTituloGrafica,

    tipoGrafica,
    setTipoGrafica,

    camposGrafica,

    editandoGrafica,

    errorGrafica,
    errorPreferencias,

    reiniciarEditor,
    guardarGrafica,
    editarGrafica,
    quitarGrafica,
    limpiarGraficas,

    quitarFiltroFechas,
    cambiarCamposGrafica,

    indicadoresDisponibles,
  } = useHistoricoEvolutivo()


  if (cargando) {
    return (
      <Box
        sx={{
          minHeight: 400,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <CircularProgress />

        <Typography color="text.secondary">
          Cargando histórico...
        </Typography>
      </Box>
    )
  }


  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    )
  }


  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1600,
        mx: 'auto',
      }}
    >

      {/* ================================================= */}
      {/* ENCABEZADO */}
      {/* ================================================= */}

      <Box
        sx={{
          display: 'flex',

          flexDirection: {
            xs: 'column',
            sm: 'row',
          },

          justifyContent: 'space-between',

          alignItems: {
            xs: 'flex-start',
            sm: 'center',
          },

          gap: 2,
          mb: 4,
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
            Histórico Evolutivo
          </Typography>

          <Typography color="text.secondary">
            Consulta los resultados generales guardados por fecha.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={
            <ArrowBackRoundedIcon />
          }
          onClick={() =>
            navigate('/evolutivo')
          }
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          Volver al Evolutivo
        </Button>
      </Box>


      {!documentos.length ? (
        <Alert severity="info">
          Todavía no existen datos históricos guardados.
        </Alert>
      ) : (
        <>

          {/* ================================================= */}
          {/* 1. TABLA ACTUAL */}
          {/* ================================================= */}

          {!documentosMes.length ? (
            <Alert
              severity="info"
              sx={{
                mb: 3,
              }}
            >
              No existen registros para el período seleccionado.
            </Alert>
          ) : (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                border: '1px solid #e2e8f0',
                borderRadius: 3,
                maxHeight: '72vh',
                mb: 3,
              }}
            >
              <Table
                stickyHeader
                size="small"
                sx={{
                  minWidth: 900,
                }}
              >

                {/* CABECERA */}

                <TableHead>
                  <TableRow>

                    <TableCell
                      sx={{
                        minWidth: 360,
                        maxWidth: 360,
                        position: 'sticky',
                        left: 0,
                        zIndex: 5,
                        bgcolor: '#123f5c',
                        color: '#ffffff',
                        fontWeight: 700,
                      }}
                    >
                      Fecha
                    </TableCell>


                    {documentosMes.map(
                      (documento) => {

                        const fecha =
                          documento.fecha ??
                          documento.id

                        return (
                          <TableCell
                            key={documento.id}
                            align="center"
                            sx={{
                              minWidth: 105,
                              bgcolor: '#123f5c',
                              color: '#ffffff',
                              fontWeight: 700,
                            }}
                          >
                            {formatearFecha(fecha)}
                          </TableCell>
                        )
                      },
                    )}


                    <TableCell
                      align="center"
                      sx={{
                        minWidth: 130,
                        bgcolor: '#0086c9',
                        color: '#ffffff',
                        fontWeight: 700,
                      }}
                    >
                      Promedio
                    </TableCell>

                  </TableRow>
                </TableHead>


                {/* CUERPO */}

                <TableBody>

                  {INDICADORES.map(
                    (
                      indicador,
                      index,
                    ) => {

                      if (
                        indicador.tipo === 'espacio'
                      ) {
                        return (
                          <TableRow
                            key={indicador.campo}
                          >
                            <TableCell
                              sx={{
                                height: 18,
                                p: 0,
                                position: 'sticky',
                                left: 0,
                                zIndex: 2,
                                bgcolor: '#ffffff',
                                borderBottom: 'none',
                              }}
                            />

                            {documentosMes.map(
                              (documento) => (
                                <TableCell
                                  key={`${documento.id}-${indicador.campo}`}
                                  sx={{
                                    height: 18,
                                    p: 0,
                                    bgcolor: '#ffffff',
                                    borderBottom: 'none',
                                  }}
                                />
                              ),
                            )}

                            <TableCell
                              sx={{
                                height: 18,
                                p: 0,
                                bgcolor: '#ffffff',
                                borderBottom: 'none',
                              }}
                            />
                          </TableRow>
                        )
                      }


                      const promedio =
                        calcularPromedio(
                          documentosMes,
                          indicador.campo,
                        )


                      return (
                        <TableRow
                          key={indicador.campo}
                          sx={{
                            '&:nth-of-type(even)': {
                              bgcolor: '#f8fafc',
                            },
                          }}
                        >

                          {/* INDICADOR */}

                          <TableCell
                            sx={{
                              position: 'sticky',
                              left: 0,
                              zIndex: 2,

                              bgcolor:
                                index % 2 === 0
                                  ? '#ffffff'
                                  : '#f8fafc',

                              fontWeight: 600,
                              color: '#334155',

                              borderRight:
                                '1px solid #e2e8f0',
                            }}
                          >
                            {indicador.titulo}
                          </TableCell>


                          {/* FECHAS */}

                          {documentosMes.map(
                            (documento) => {

                              const metricas =
                                obtenerMetricas(
                                  documento,
                                )

                              const valor =
                                metricas
                                  ? metricas[
                                      indicador.campo
                                    ]
                                  : null

                              return (
                                <TableCell
                                  key={`${documento.id}-${indicador.campo}`}
                                  align="center"
                                  sx={{
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {formatearValor(
                                    valor,
                                    indicador.tipo,
                                  )}
                                </TableCell>
                              )
                            },
                          )}


                          {/* PROMEDIO */}

                          <TableCell
                            align="center"
                            sx={{
                              fontWeight: 700,
                              color: '#123f5c',
                              bgcolor: '#eef8fc',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatearValor(
                              promedio,
                              indicador.tipo,
                            )}
                          </TableCell>

                        </TableRow>
                      )
                    },
                  )}

                </TableBody>

              </Table>
            </TableContainer>
          )}


          {/* ================================================= */}
          {/* 2. FILTROS */}
          {/* ================================================= */}

          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              border: '1px solid #e2e8f0',
              borderRadius: 3,
              bgcolor: '#ffffff',
            }}
          >

            <Typography
              sx={{
                fontWeight: 700,
                color: '#123f5c',
                mb: 2,
              }}
            >
              Filtros
            </Typography>

            <Box
              sx={{
                display: 'grid',

                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(220px, 320px))',
                },

                gap: 2,
              }}
            >

              <FormControl fullWidth>
                <InputLabel>
                  Año
                </InputLabel>

                <Select
                  value={anioSeleccionado}
                  label="Año"
                  onChange={cambiarAnio}
                >
                  {anios.map(
                    (anio) => (
                      <MenuItem
                        key={anio}
                        value={anio}
                      >
                        {anio}
                      </MenuItem>
                    ),
                  )}
                </Select>
              </FormControl>


              <FormControl
                fullWidth
                disabled={!anioSeleccionado}
              >
                <InputLabel>
                  Mes
                </InputLabel>

                <Select
                  value={mesSeleccionado}
                  label="Mes"
                  onChange={cambiarMes}
                >
                  {mesesDisponibles.map(
                    (mes) => (
                      <MenuItem
                        key={mes.valor}
                        value={mes.valor}
                      >
                        {mes.nombre}
                      </MenuItem>
                    ),
                  )}
                </Select>
              </FormControl>

            </Box>

          </Paper>


          {/* ================================================= */}
          {/* 3. SELECCIONAR FECHAS */}
          {/* ================================================= */}

          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              border: '1px solid #e2e8f0',
              borderRadius: 3,
            }}
          >

            <Typography
              sx={{
                fontWeight: 700,
                color: '#123f5c',
                mb: 1,
              }}
            >
              Seleccionar fechas
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
              }}
            >
              El rango incluye ambas fechas y permite consultar varios meses.
              Al elegir un año o mes se quita el rango.
            </Typography>


            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >

              <TextField
                type="date"
                label="Desde"
                value={fechaDesde}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                onChange={(event) =>
                  setFechaDesde(event.target.value)
                }
                error={rangoInvalido}
              />


              <TextField
                type="date"
                label="Hasta"
                value={fechaHasta}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                onChange={(event) =>
                  setFechaHasta(event.target.value)
                }
                error={rangoInvalido}
              />


              <Button
                onClick={quitarFiltroFechas}
              >
                Quitar filtro de fechas
              </Button>

            </Box>


            {rangoInvalido && (
              <Alert
                severity="warning"
                sx={{
                  mt: 2,
                }}
              >
                La fecha Desde debe ser anterior o igual a Hasta.
              </Alert>
            )}

          </Paper>


          {/* ================================================= */}
          {/* 4. AGREGAR GRÁFICA */}
          {/* ================================================= */}

          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              border: '1px solid #e2e8f0',
              borderRadius: 3,
            }}
          >

            <Typography
              variant="h6"
              sx={{
                mb: 1,
                color: '#123f5c',
                fontWeight: 700,
              }}
            >
              {
                editandoGrafica
                  ? 'Editar gráfica'
                  : 'Agregar gráfica'
              }
            </Typography>


            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
              }}
            >
              Elige indicadores del mismo formato para comparar
              su evolución en el período seleccionado.
              Las preferencias se guardan en este navegador.
            </Typography>


            <Box
              sx={{
                display: 'grid',

                gridTemplateColumns: {
                  xs: '1fr',
                  md: '1fr 180px 2fr',
                },

                gap: 2,
              }}
            >

              <TextField
                label="Título (opcional)"
                value={tituloGrafica}
                onChange={(event) =>
                  setTituloGrafica(
                    event.target.value,
                  )
                }
              />


              <TextField
                select
                label="Tipo de gráfica"
                value={tipoGrafica}
                onChange={(event) =>
                  setTipoGrafica(
                    event.target.value,
                  )
                }
              >
                <MenuItem value="lineas">
                  Líneas
                </MenuItem>

                <MenuItem value="barras">
                  Barras
                </MenuItem>

                <MenuItem value="areas">
                  Áreas
                </MenuItem>
              </TextField>


              <FormControl fullWidth>

                <InputLabel
                  id="indicadores-grafica-label"
                >
                  Indicadores
                </InputLabel>


                <Select
                  multiple
                  labelId="indicadores-grafica-label"
                  label="Indicadores"
                  value={camposGrafica}
                  onChange={(event) =>
                    cambiarCamposGrafica(
                      event.target.value,
                    )
                  }
                  renderValue={(seleccionados) =>
                    `${seleccionados.length} indicador(es) seleccionado(s)`
                  }
                >
                  {INDICADORES_GRAFICABLES.map(
                    (item) => {

                      const primero =
                        INDICADORES_GRAFICABLES.find(
                          (indicador) =>
                            indicador.campo ===
                            camposGrafica[0],
                        )

                      const disponible =
                        indicadoresDisponibles.includes(
                          item.campo,
                        )

                      return (
                        <MenuItem
                          key={item.campo}
                          value={item.campo}
                          disabled={
                            !disponible ||
                            Boolean(
                              primero &&
                              primero.tipo !== item.tipo,
                            )
                          }
                        >
                          <Checkbox
                            checked={
                              camposGrafica.includes(
                                item.campo,
                              )
                            }
                          />

                          <ListItemText
                            primary={item.titulo}
                            secondary={
                              !disponible
                                ? 'Sin datos guardados'
                                : item.tipo === 'porcentaje'
                                  ? 'Porcentaje'
                                  : item.tipo === 'decimal'
                                    ? 'Promedio'
                                    : 'Cantidad'
                            }
                          />
                        </MenuItem>
                      )
                    },
                  )}
                </Select>

              </FormControl>

            </Box>


            {errorGrafica && (
              <Alert
                severity="warning"
                sx={{
                  mt: 2,
                }}
              >
                {errorGrafica}
              </Alert>
            )}


            {errorPreferencias && (
              <Alert
                severity="info"
                sx={{
                  mt: 2,
                }}
              >
                {errorPreferencias}
              </Alert>
            )}


            <Box
              sx={{
                display: 'flex',
                gap: 1,
                mt: 2,
                flexWrap: 'wrap',
              }}
            >

              <Button
                variant="contained"
                onClick={guardarGrafica}
                disabled={!camposGrafica.length}
              >
                {
                  editandoGrafica
                    ? 'Guardar cambios'
                    : 'Agregar gráfica'
                }
              </Button>


              <Button
                onClick={reiniciarEditor}
              >
                {
                  editandoGrafica
                    ? 'Cancelar edición'
                    : 'Limpiar selección'
                }
              </Button>


              <Button
                color="error"
                variant="outlined"
                disabled={!graficas.length}
                onClick={limpiarGraficas}
              >
                Limpiar gráficas
              </Button>

            </Box>

          </Paper>


          {/* ================================================= */}
          {/* 5. GRÁFICAS GUARDADAS */}
          {/* ================================================= */}

          {documentosMes.length > 0 && (
            <Box sx={{ mt: 4 }}>

              <Typography
                variant="h5"
                sx={{
                  mb: 2,
                  fontWeight: 700,
                  color: '#123f5c',
                }}
              >
                Gráficas del período seleccionado
              </Typography>


              {!graficas.length && (
                <Alert severity="info">
                  Agrega una gráfica con los indicadores
                  que quieras consultar.
                </Alert>
              )}


              <Box
                sx={{
                  display: 'grid',

                  gridTemplateColumns: {
                    xs: '1fr',
                    lg: 'repeat(2, minmax(0, 1fr))',
                  },

                  gap: 3,
                }}
              >
                {graficas.map(
                  (config) => (
                    <GraficaHistorica
                      key={config.id}
                      config={config}
                      documentos={documentosMes}
                      onEditar={() =>
                        editarGrafica(config)
                      }
                      onQuitar={() =>
                        quitarGrafica(config.id)
                      }
                    />
                  ),
                )}
              </Box>

            </Box>
          )}

        </>
      )}

    </Box>
  )
}


export default HistoricoEvolutivo