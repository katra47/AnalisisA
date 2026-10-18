import {
  useEffect,
  useRef,
  useState,
} from 'react'

import * as XLSX from 'xlsx'

import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material'

import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import CloudRoundedIcon from '@mui/icons-material/CloudRounded'

import { analizarEvolutivo } from '../paginas/evolutivo/logevolutivo'

import {
  guardarAnalisisActual,
  guardarHistoricoEvolutivo,
} from './firebase/analisisFirestore'

import {
  inicializarGoogleDrive,
  iniciarSesionGoogleDrive,
  obtenerArchivosExcelDrive,
  descargarExcelDrive,
} from './googleDrive/googleDrive'


function CargarExcel() {

  const inputRef = useRef(null)


  // ==========================================
  // ESTADOS
  // ==========================================

  const [archivo, setArchivo] =
    useState(null)

  const [fechaCarga, setFechaCarga] =
    useState('')

  const [error, setError] =
    useState('')

  const [mensaje, setMensaje] =
    useState('')

  const [procesando, setProcesando] =
    useState(false)

  const [resultado, setResultado] =
    useState(null)

  const [archivosDrive, setArchivosDrive] =
    useState([])

  const [dialogoDrive, setDialogoDrive] =
    useState(false)

  const [cargandoDrive, setCargandoDrive] =
    useState(false)



  // ==========================================
  // INICIALIZAR GOOGLE DRIVE
  // ==========================================

  useEffect(() => {

    let intentos = 0

    const iniciarGoogle = () => {

      const inicializado =
        inicializarGoogleDrive(
          async (respuesta) => {

            if (respuesta.error) {

              setError(
                'No fue posible conectar con Google Drive.',
              )

              return
            }

            try {

              setCargandoDrive(true)

              const archivos =
                await obtenerArchivosExcelDrive()

              setArchivosDrive(archivos)

              setDialogoDrive(true)

              setMensaje(
                'Google Drive conectado correctamente.',
              )

            } catch (err) {

              setError(
                err.message ||
                'No fue posible leer Google Drive.',
              )

            } finally {

              setCargandoDrive(false)

            }
          },
        )


      if (!inicializado) {

        intentos += 1

        if (intentos < 20) {

          setTimeout(
            iniciarGoogle,
            300,
          )

        }
      }
    }

    iniciarGoogle()

  }, [])



  // ==========================================
  // ABRIR GOOGLE DRIVE
  // ==========================================

  const conectarGoogleDrive = () => {

    setError('')
    setMensaje('')
    setResultado(null)

    try {

      iniciarSesionGoogleDrive()

    } catch (err) {

      setError(
        err.message ||
        'No fue posible conectar con Google Drive.',
      )

    }
  }



  // ==========================================
  // SELECCIONAR ARCHIVO DE DRIVE
  // ==========================================

  const seleccionarArchivoDrive =
    async (archivoDrive) => {

      try {

        setCargandoDrive(true)

        setError('')

        setMensaje(
          'Descargando archivo desde Google Drive...',
        )

        const file =
          await descargarExcelDrive(
            archivoDrive,
          )

        setArchivo(file)

        // Limpiamos la fecha para obligar
        // a confirmar la fecha del nuevo archivo.
        setFechaCarga('')

        setResultado(null)

        setDialogoDrive(false)

        setMensaje(
          'Archivo de Google Drive seleccionado correctamente.',
        )

      } catch (err) {

        setMensaje('')

        setError(
          err.message ||
          'No fue posible descargar el archivo.',
        )

      } finally {

        setCargandoDrive(false)

      }
    }



  // ==========================================
  // SELECCIONAR ARCHIVO LOCAL
  // ==========================================

  const seleccionarArchivo = (
    event,
  ) => {

    const file =
      event.target.files?.[0]

    setError('')
    setMensaje('')
    setResultado(null)

    if (!file) {
      return
    }


    const extension = file.name
      .split('.')
      .pop()
      .toLowerCase()


    if (extension !== 'xlsx') {

      setArchivo(null)
      setFechaCarga('')

      setError(
        'El archivo debe estar en formato .xlsx.',
      )

      event.target.value = ''

      return
    }


    setArchivo(file)

    // Cada archivo debe confirmar su propia fecha.
    setFechaCarga('')
  }



  // ==========================================
  // ELIMINAR ARCHIVO
  // ==========================================

  const eliminarArchivo = () => {

    setArchivo(null)

    setFechaCarga('')

    setError('')

    setMensaje('')

    setResultado(null)


    if (inputRef.current) {

      inputRef.current.value = ''

    }
  }



  // ==========================================
  // PROCESAR ARCHIVO
  // ==========================================

  const procesarArchivo =
    async () => {


      // ========================================
      // VALIDAR ARCHIVO
      // ========================================

      if (!archivo) {

        setError(
          'Selecciona un archivo Excel antes de continuar.',
        )

        return
      }


      // ========================================
      // VALIDAR FECHA
      // ========================================

      if (!fechaCarga) {

        setError(
          'Selecciona la fecha correspondiente al archivo antes de continuar.',
        )

        return
      }


      try {

        setProcesando(true)

        setError('')

        setMensaje(
          'Procesando archivo...',
        )

        setResultado(null)



        // ======================================
        // LEER ARCHIVO
        // ======================================

        const buffer =
          await archivo.arrayBuffer()


        const workbook =
          XLSX.read(
            buffer,
            {
              type: 'array',
            },
          )


        if (
          !workbook.SheetNames.length
        ) {

          throw new Error(
            'El archivo Excel no contiene hojas.',
          )

        }



        // ======================================
        // BUSCAR HOJA BD
        // ======================================

        const nombreHoja = 'BD'


        const hoja =
          workbook.Sheets[
            nombreHoja
          ]


        if (!hoja) {

          throw new Error(
            'No se encontró la hoja "BD" en el archivo Excel.',
          )

        }



        // ======================================
        // CONVERTIR XLSX A MATRIZ
        // ======================================

        setMensaje(
          'Leyendo información del archivo...',
        )


        const datos =
          XLSX.utils.sheet_to_json(
            hoja,
            {
              header: 1,
              defval: '',
              raw: false,
            },
          )


        console.log(
          'Nombre de hoja:',
          nombreHoja,
        )


        console.log(
          'Cantidad de filas:',
          datos.length,
        )


        if (datos.length < 2) {

          throw new Error(
            'La hoja no contiene información suficiente.',
          )

        }



        // ======================================
        // ANALIZAR EVOLUTIVO
        // ======================================

        setMensaje(
          'Analizando información para Evolutivo...',
        )


        const analisis =
          analizarEvolutivo(datos)


        if (!analisis) {

          throw new Error(
            'No fue posible generar el análisis Evolutivo.',
          )

        }



        // ======================================
        // FECHA DEL ANÁLISIS
        // ======================================
        //
        // IMPORTANTE:
        // Ya NO usamos new Date().
        //
        // Utilizamos la fecha seleccionada
        // por el usuario.
        //
        // Ejemplo:
        // 2026-10-16
        //
        // ======================================

        const fecha = fechaCarga



        // ======================================
        // GUARDAR RESULTADO ACTUAL
        // ======================================

        setMensaje(
          'Guardando resultado actual...',
        )


        await guardarAnalisisActual(
          'evolutivo',
          analisis,
        )



        // ======================================
        // GUARDAR / ACTUALIZAR HISTÓRICO
        // ======================================
        //
        // fecha = fecha elegida por usuario
        //
        // Si analisisFirestore usa esta fecha
        // como ID:
        //
        // EXISTE -> reemplaza
        // NO EXISTE -> crea
        //
        // ======================================

        setMensaje(
          `Guardando histórico del ${fecha}...`,
        )


        await guardarHistoricoEvolutivo(
          fecha,
          analisis,
        )



        // ======================================
        // TERMINADO
        // ======================================

        setResultado(analisis)


        setMensaje(
          `Proceso completado correctamente para la fecha ${fecha}. ${analisis.filasAnalizadas.toLocaleString()} registros utilizados para Evolutivo.`,
        )


        console.log(
          'Resultado Evolutivo:',
          analisis,
        )


        console.log(
          'Fecha guardada:',
          fecha,
        )


      } catch (err) {

        console.error(
          'Error procesando archivo:',
          err,
        )


        setMensaje('')


        setError(
          err.message ||
          'Ocurrió un error al procesar el archivo.',
        )


      } finally {

        setProcesando(false)

      }
    }



  // ==========================================
  // FORMATEAR TAMAÑO
  // ==========================================

  const formatearTamano = (
    bytes,
  ) => {

    if (!bytes) {
      return '0 MB'
    }


    const mb =
      Number(bytes) /
      (1024 * 1024)


    return `${mb.toFixed(2)} MB`
  }



  // ==========================================
  // FORMATEAR FECHA DRIVE
  // ==========================================

  const formatearFechaDrive = (
    fecha,
  ) => {

    if (!fecha) {
      return ''
    }


    return new Date(
      fecha,
    ).toLocaleString()

  }



  // ==========================================
  // PÁGINA
  // ==========================================

  return (

    <Box
      sx={{
        width: '100%',
        maxWidth: 900,
        mx: 'auto',
      }}
    >


      {/* ===================================== */}
      {/* TÍTULO */}
      {/* ===================================== */}

      <Box
        sx={{
          mb: 4,
        }}
      >

        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#123f5c',
            mb: 0.5,
          }}
        >
          Cargar archivo Excel
        </Typography>


        <Typography
          variant="body1"
          color="text.secondary"
        >
          Selecciona el archivo de asignación que deseas
          procesar e indica la fecha correspondiente.
        </Typography>

      </Box>



      {/* ===================================== */}
      {/* ERROR */}
      {/* ===================================== */}

      {error && (

        <Alert
          severity="error"
          sx={{
            mb: 3,
          }}
        >
          {error}
        </Alert>

      )}



      {/* ===================================== */}
      {/* MENSAJE */}
      {/* ===================================== */}

      {mensaje && (

        <Alert
          severity={
            procesando ||
            cargandoDrive
              ? 'info'
              : 'success'
          }
          sx={{
            mb: 3,
          }}
        >
          {mensaje}
        </Alert>

      )}



      {/* ===================================== */}
      {/* ÁREA DE CARGA */}
      {/* ===================================== */}

      <Paper
        elevation={0}
        sx={{

          p: {
            xs: 3,
            sm: 5,
          },

          borderRadius: 3,

          border:
            '2px dashed #cbd5e1',

          bgcolor:
            '#ffffff',

          textAlign:
            'center',

          '&:hover': {

            borderColor:
              '#0086c9',

          },
        }}
      >

        <UploadFileRoundedIcon
          sx={{
            fontSize: 64,
            color: '#0086c9',
            mb: 2,
          }}
        />


        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: '#123f5c',
          }}
        >
          Archivo Excel
        </Typography>


        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 1,
            mb: 3,
          }}
        >
          Selecciona el archivo diario en formato XLSX.
        </Typography>


        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >

          {/* ARCHIVO LOCAL */}

          <Button
            variant="contained"
            disabled={
              procesando ||
              cargandoDrive
            }
            startIcon={
              <UploadFileRoundedIcon />
            }
            onClick={() =>
              inputRef.current?.click()
            }
            sx={{
              bgcolor: '#0086c9',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,

              '&:hover': {
                bgcolor: '#006fa8',
              },
            }}
          >
            Seleccionar archivo
          </Button>


          {/* GOOGLE DRIVE */}

          <Button
            variant="outlined"
            disabled={
              procesando ||
              cargandoDrive
            }
            startIcon={
              <CloudRoundedIcon />
            }
            onClick={
              conectarGoogleDrive
            }
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
            }}
          >

            {
              cargandoDrive
                ? 'Cargando Drive...'
                : 'Seleccionar desde Google Drive'
            }

          </Button>

        </Box>


        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          onChange={
            seleccionarArchivo
          }
          hidden
        />

      </Paper>



      {/* ===================================== */}
      {/* ARCHIVO SELECCIONADO */}
      {/* ===================================== */}

      {archivo && (

        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 2.5,
            borderRadius: 3,

            border:
              '1px solid #e2e8f0',

            bgcolor:
              '#ffffff',
          }}
        >


          {/* INFORMACIÓN DEL ARCHIVO */}

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >

            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,

                bgcolor:
                  '#eef8fc',

                display:
                  'flex',

                alignItems:
                  'center',

                justifyContent:
                  'center',

                flexShrink: 0,
              }}
            >

              <DescriptionRoundedIcon
                sx={{
                  color: '#0086c9',
                  fontSize: 28,
                }}
              />

            </Box>


            <Box
              sx={{
                flexGrow: 1,
                minWidth: 0,
              }}
            >

              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: '#123f5c',

                  overflow:
                    'hidden',

                  textOverflow:
                    'ellipsis',

                  whiteSpace:
                    'nowrap',
                }}
              >
                {archivo.name}
              </Typography>


              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mt: 0.5,
                }}
              >

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {
                    formatearTamano(
                      archivo.size,
                    )
                  }
                </Typography>


                <Chip
                  label="XLSX"
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: 11,
                  }}
                />

              </Box>

            </Box>


            <Button
              color="error"
              disabled={
                procesando
              }
              startIcon={
                <DeleteOutlineRoundedIcon />
              }
              onClick={
                eliminarArchivo
              }
              sx={{
                textTransform:
                  'none',
              }}
            >
              Quitar
            </Button>

          </Box>



          {/* ================================= */}
          {/* FECHA DEL ARCHIVO */}
          {/* ================================= */}

          <Box
            sx={{
              mt: 3,
              pt: 2.5,

              borderTop:
                '1px solid #e2e8f0',
            }}
          >

            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
                color: '#123f5c',
                mb: 0.5,
              }}
            >
              Fecha correspondiente al archivo
            </Typography>


            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: 2,
              }}
            >
              Selecciona la fecha que corresponde a la
              información del archivo. Esta fecha será
              utilizada para actualizar el histórico de
              Evolutivo.
            </Typography>


            <TextField
              type="date"
              label="Fecha del análisis"
              value={fechaCarga}
              onChange={(event) => {

                setFechaCarga(
                  event.target.value,
                )

                setError('')

              }}
              disabled={
                procesando
              }
              fullWidth
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              helperText={
                fechaCarga
                  ? `El histórico se guardará o actualizará con la fecha ${fechaCarga}.`
                  : 'La fecha es obligatoria antes de procesar.'
              }
              sx={{
                maxWidth: 400,
              }}
            />

          </Box>

        </Paper>

      )}



      {/* ===================================== */}
      {/* PROCESAR */}
      {/* ===================================== */}

      <Box
        sx={{
          display: 'flex',

          justifyContent:
            'flex-end',

          mt: 3,
        }}
      >

        <Button
          variant="contained"
          disabled={
            !archivo ||
            !fechaCarga ||
            procesando
          }
          startIcon={
            <PlayArrowRoundedIcon />
          }
          onClick={
            procesarArchivo
          }
          sx={{
            bgcolor:
              '#123f5c',

            textTransform:
              'none',

            fontWeight:
              600,

            borderRadius:
              2,

            px: 4,
            py: 1.2,

            '&:hover': {

              bgcolor:
                '#0d3047',

            },
          }}
        >

          {
            procesando
              ? 'Procesando...'
              : 'Procesar archivo'
          }

        </Button>

      </Box>



      {/* ===================================== */}
      {/* RESULTADO */}
      {/* ===================================== */}

      {resultado && (

        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 3,
            borderRadius: 3,

            border:
              '1px solid #e2e8f0',

            bgcolor:
              '#ffffff',
          }}
        >

          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#123f5c',
              mb: 2,
            }}
          >
            Resultado Evolutivo
          </Typography>


          {/* FECHA */}

          <Typography
            sx={{
              mb: 2,
            }}
          >
            Fecha del análisis:{' '}

            <strong>
              {fechaCarga}
            </strong>
          </Typography>


          <Typography>
            Localidades 100% asignadas:{' '}

            <strong>
              {
                resultado.locCompletas
              }
            </strong>
          </Typography>


          <Typography>
            Localidades parciales:{' '}

            <strong>
              {
                resultado.locParciales
              }
            </strong>
          </Typography>


          <Typography>
            Localidades sin asignación:{' '}

            <strong>
              {
                resultado.locSinAsignacion
              }
            </strong>
          </Typography>


          <Typography
            sx={{
              mt: 2,
            }}
          >
            Total clientes asignados:{' '}

            <strong>
              {
                resultado.totalAsignados
                  .toLocaleString()
              }
            </strong>
          </Typography>


          <Typography>
            Total clientes registrados:{' '}

            <strong>
              {
                resultado.totalRegistrados
                  .toLocaleString()
              }
            </strong>
          </Typography>


          <Typography>
            Total clientes a operar:{' '}

            <strong>
              {
                resultado.totalOperar
                  .toLocaleString()
              }
            </strong>
          </Typography>


          <Typography
            sx={{
              mt: 2,
            }}
          >
            % de asignación:{' '}

            <strong>

              {
                (
                  resultado
                    .porcentajeAsignacion *
                  100
                ).toFixed(2)
              }

              %

            </strong>
          </Typography>

        </Paper>

      )}



      {/* ===================================== */}
      {/* SELECTOR GOOGLE DRIVE */}
      {/* ===================================== */}

      <Dialog
        open={
          dialogoDrive
        }
        onClose={() =>
          setDialogoDrive(false)
        }
        fullWidth
        maxWidth="sm"
      >

        <DialogTitle>
          Seleccionar archivo de Google Drive
        </DialogTitle>


        <DialogContent dividers>

          {
            archivosDrive.length === 0
              ? (

                <Typography
                  color="text.secondary"
                >
                  No se encontraron archivos XLSX
                  en Google Drive.
                </Typography>

              )
              : (

                <List disablePadding>

                  {
                    archivosDrive.map(
                      (item) => (

                        <ListItemButton
                          key={
                            item.id
                          }
                          disabled={
                            cargandoDrive
                          }
                          onClick={() =>
                            seleccionarArchivoDrive(
                              item,
                            )
                          }
                          sx={{
                            borderRadius: 2,
                            mb: 0.5,
                          }}
                        >

                          <DescriptionRoundedIcon
                            sx={{
                              mr: 2,

                              color:
                                '#0086c9',
                            }}
                          />


                          <ListItemText
                            primary={
                              item.name
                            }
                            secondary={
                              `${formatearTamano(
                                item.size,
                              )} · ${formatearFechaDrive(
                                item.modifiedTime,
                              )}`
                            }
                          />

                        </ListItemButton>

                      ),
                    )
                  }

                </List>

              )
          }

        </DialogContent>


        <DialogActions>

          <Button
            onClick={() =>
              setDialogoDrive(false)
            }
            sx={{
              textTransform:
                'none',
            }}
          >
            Cancelar
          </Button>

        </DialogActions>

      </Dialog>

    </Box>

  )
}


export default CargarExcel