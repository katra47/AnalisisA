const CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID

const DRIVE_SCOPE =
  'https://www.googleapis.com/auth/drive.readonly'

const NOMBRE_CARPETA =
  'Analisis Asignaciones'

let tokenClient = null
let accessToken = null
let callbackOAuth = null

// ==========================================
// INICIALIZAR GOOGLE DRIVE
// ==========================================

export function inicializarGoogleDrive(callback) {
  callbackOAuth = callback

  if (!CLIENT_ID) {
    throw new Error(
      'No se encontró VITE_GOOGLE_CLIENT_ID en .env.',
    )
  }

  if (!window.google?.accounts?.oauth2) {
    return false
  }

  crearTokenClient()

  return true
}

// ==========================================
// CREAR CLIENTE OAUTH
// ==========================================

function crearTokenClient() {
  if (tokenClient) {
    return
  }

  tokenClient =
    window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: DRIVE_SCOPE,

      callback: (respuesta) => {
        if (respuesta.access_token) {
          accessToken =
            respuesta.access_token
        }

        callbackOAuth?.(respuesta)
      },
    })
}

// ==========================================
// INICIAR SESIÓN
// ==========================================

export function iniciarSesionGoogleDrive() {
  if (!CLIENT_ID) {
    throw new Error(
      'No se encontró VITE_GOOGLE_CLIENT_ID en .env.',
    )
  }

  if (!window.google?.accounts?.oauth2) {
    throw new Error(
      'Google Identity Services todavía no está cargado.',
    )
  }

  crearTokenClient()

  tokenClient.requestAccessToken({
    prompt: '',
  })
}

// ==========================================
// BUSCAR CARPETA
// ==========================================

async function obtenerCarpetaAnalisis() {
  if (!accessToken) {
    throw new Error(
      'Primero debes conectar Google Drive.',
    )
  }

  const nombreSeguro =
    NOMBRE_CARPETA.replace(
      /'/g,
      "\\'",
    )

  const query =
    `name = '${nombreSeguro}' ` +
    "and mimeType = 'application/vnd.google-apps.folder' " +
    'and trashed = false'

  const url =
    'https://www.googleapis.com/drive/v3/files' +
    `?q=${encodeURIComponent(query)}` +
    '&fields=files(id,name)' +
    '&pageSize=10'

  const respuesta =
    await fetch(url, {
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
    })

  if (!respuesta.ok) {
    const detalle =
      await respuesta.text()

    console.error(
      'Error buscando carpeta:',
      detalle,
    )

    throw new Error(
      'No fue posible buscar la carpeta "Analisis Asignaciones".',
    )
  }

  const datos =
    await respuesta.json()

  if (!datos.files?.length) {
    throw new Error(
      'No se encontró la carpeta "Analisis Asignaciones" en Google Drive.',
    )
  }

  return datos.files[0]
}

// ==========================================
// OBTENER XLSX DE ANALISIS ASIGNACIONES
// ==========================================

export async function obtenerArchivosExcelDrive() {
  if (!accessToken) {
    throw new Error(
      'Primero debes conectar Google Drive.',
    )
  }

  const carpeta =
    await obtenerCarpetaAnalisis()

  const query =
    `'${carpeta.id}' in parents ` +
    "and mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' " +
    'and trashed = false'

  const url =
    'https://www.googleapis.com/drive/v3/files' +
    `?q=${encodeURIComponent(query)}` +
    '&fields=files(id,name,size,modifiedTime)' +
    '&orderBy=modifiedTime desc' +
    '&pageSize=1000'

  const respuesta =
    await fetch(url, {
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
    })

  if (!respuesta.ok) {
    const detalle =
      await respuesta.text()

    console.error(
      'Error obteniendo XLSX:',
      detalle,
    )

    throw new Error(
      'No fue posible obtener los archivos de "Analisis Asignaciones".',
    )
  }

  const datos =
    await respuesta.json()

  return datos.files || []
}

// ==========================================
// DESCARGAR XLSX
// ==========================================

export async function descargarExcelDrive(
  archivoDrive,
) {
  if (!accessToken) {
    throw new Error(
      'Primero debes conectar Google Drive.',
    )
  }

  const respuesta =
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${archivoDrive.id}?alt=media`,
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      },
    )

  if (!respuesta.ok) {
    throw new Error(
      'No fue posible descargar el archivo de Google Drive.',
    )
  }

  const blob =
    await respuesta.blob()

  return new File(
    [blob],
    archivoDrive.name,
    {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  )
}