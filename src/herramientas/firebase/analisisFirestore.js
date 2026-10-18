import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'

import { db } from './firebase'

// El Histórico conserva exactamente sus campos anteriores.
const CAMPOS_METRICAS = [
  'filasAnalizadas', 'localidadesTotales',
  'locSinAsignacion', 'clientesSinAsignacion',
  'locParciales', 'registradosParciales', 'asignadosParciales', 'porcentajeParcial',
  'locCompletas', 'asignadosCompletos',
  'totalAsignados', 'totalRegistrados', 'totalOperar', 'porcentajeAsignacion',
  'promedioCompleta', 'promedioAsignadoParcial',
  'promedioRegistradoParcial', 'promedioSinAsignacion',
  'locSinAsignacion10', 'clientesSinAsignacion10',
  'locBajaAsignacion', 'registradosBaja', 'asignadosBaja',
  'totalUT', 'utConAsignacion', 'utSinAsignacion',
  'totalAsignadoUT', 'ordenesAsignadasPorUT',
]

const CAMPOS_GPS = [
  'asignadasSinCoordenadasValidas',
  'asignadasConCoordenadasValidas',
  'registradasSinCoordenadasValidas',
  'registradasConCoordenadasValidas',
  'totalPrimerosCortesSinCoordenadasValidas',
  'totalPrimerosCortesConCoordenadasValidas',
]

function extraerMetricasGenerales(datos = {}) {
  const origen = datos.general ?? datos
  const resultado = {}
  CAMPOS_METRICAS.forEach((campo) => {
    resultado[campo] = origen[campo] ?? 0
  })
  return resultado
}

// Guardar los indicadores que utiliza la vista sin duplicar detalleLocalidades.
function extraerMetricasActuales(datos = {}) {
  const origen = datos.general ?? datos
  const resultado = extraerMetricasGenerales(origen)
  CAMPOS_GPS.forEach((campo) => {
    // Un análisis antiguo sin GPS debe seguir mostrando "No disponible".
    if (origen[campo] != null) resultado[campo] = origen[campo]
  })
  return resultado
}

// ==========================================
// GUARDAR RESULTADO ACTUAL
// ==========================================

export async function guardarAnalisisActual(modulo, datos) {
  const referencia = doc(db, 'analisis_actual', modulo)
  const metricas = modulo === 'evolutivo'
    ? extraerMetricasActuales(datos)
    : datos

  await setDoc(referencia, {
    datos: metricas,
    actualizadoEn: serverTimestamp(),
  })
}

// ==========================================
// OBTENER RESULTADO ACTUAL
// ==========================================

export async function obtenerAnalisisActual(modulo) {
  const referencia = doc(db, 'analisis_actual', modulo)
  const documento = await getDoc(referencia)
  if (!documento.exists()) return null
  return { id: documento.id, ...documento.data() }
}

// ==========================================
// HISTÓRICO: CONSERVAR COMPORTAMIENTO ANTERIOR
// ==========================================

export async function guardarHistoricoEvolutivo(fecha, datos) {
  const referencia = doc(db, 'evolutivo_historico', fecha)
  const metricas = extraerMetricasGenerales(datos)
  await setDoc(referencia, {
    fecha,
    datos: metricas,
    actualizadoEn: serverTimestamp(),
  })
}

export async function obtenerHistoricoEvolutivo(fecha) {
  const referencia = doc(db, 'evolutivo_historico', fecha)
  const documento = await getDoc(referencia)
  if (!documento.exists()) return null
  return { id: documento.id, ...documento.data() }
}

export async function obtenerTodoHistoricoEvolutivo() {
  const referencia = collection(db, 'evolutivo_historico')
  const consulta = query(referencia, orderBy('fecha', 'asc'))
  const documentos = await getDocs(consulta)
  return documentos.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }))
}
