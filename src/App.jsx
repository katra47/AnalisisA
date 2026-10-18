import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import { Box } from '@mui/material'

import Header from './header/Header'
import CargarExcel from './herramientas/CargarExcel'

import Evolutivo from './paginas/evolutivo/Evolutivo'
import HistoricoEvolutivo from './paginas/evolutivo/HistoricoEvolutivo'

function App() {
  return (
    <BrowserRouter>
      <Header />

      <Box
        component="main"
        sx={{
          pt: '110px',

          px: {
            xs: 2,
            sm: 3,
            md: 4,
          },

          pb: 4,

          minHeight: '100vh',

          bgcolor: '#f8fafc',
        }}
      >
        <Routes>
          {/* INICIO */}

          <Route
            path="/"
            element={
              <Navigate
                to="/cargar-excel"
                replace
              />
            }
          />

          {/* CARGAR EXCEL */}

          <Route
            path="/cargar-excel"
            element={
              <CargarExcel />
            }
          />

          {/* EVOLUTIVO */}

          <Route
            path="/evolutivo"
            element={
              <Evolutivo />
            }
          />

          {/* HISTÓRICO EVOLUTIVO */}

          <Route
            path="/evolutivo/historico"
            element={
              <HistoricoEvolutivo />
            }
          />

          {/* RUTA NO ENCONTRADA */}

          <Route
            path="*"
            element={
              <Navigate
                to="/cargar-excel"
                replace
              />
            }
          />
        </Routes>
      </Box>
    </BrowserRouter>
  )
}

export default App