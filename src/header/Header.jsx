import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'

import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'

import logoEnerguate from '../img/logoenerguate.png'

function Header() {
  const navigate = useNavigate()
  const location = useLocation()

  const [anchorEl, setAnchorEl] = useState(null)

  const menuAbierto = Boolean(anchorEl)

  // Usuario temporal.
  // Más adelante vendrá de Firebase Authentication.
  const user = {
    name: 'Usuario Energuate',
    email: 'usuario@correo.com',
    role: 'Administrador',
  }

  const obtenerTitulo = () => {
    if (location.pathname === '/evolutivo') {
      return 'Evolutivo'
    }

    if (location.pathname === '/cargar-excel') {
      return 'Cargar archivo Excel'
    }

    return 'Cargar archivo Excel'
  }

  const abrirMenuUsuario = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const cerrarMenuUsuario = () => {
    setAnchorEl(null)
  }

  const cerrarSesion = () => {
    cerrarMenuUsuario()

    // Más adelante aquí irá Firebase Authentication.
    console.log('Cerrar sesión')
  }

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: '#ffffff',
        color: '#123f5c',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <Toolbar
        sx={{
          minHeight: '78px !important',
          px: {
            xs: 2,
            sm: 3,
            md: 4,
          },
          gap: 2,
        }}
      >
        {/* Logo Energuate */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Box
            component="img"
            src={logoEnerguate}
            alt="Energuate"
            sx={{
              width: {
                xs: 125,
                sm: 145,
              },
              height: 'auto',
              display: 'block',
            }}
          />
        </Box>

        {/* Separador */}
        <Divider
          orientation="vertical"
          flexItem
          sx={{
            mx: 1,
            my: 2,
            borderColor: '#e2e8f0',
          }}
        />

        {/* Nombre de la página */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: '#123f5c',
            whiteSpace: 'nowrap',
          }}
        >
          {obtenerTitulo()}
        </Typography>

        {/* Espacio central */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Navegación */}
        <Box
          sx={{
            display: {
              xs: 'none',
              md: 'flex',
            },
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Button
            startIcon={<UploadFileRoundedIcon />}
            onClick={() => navigate('/cargar-excel')}
            sx={{
              textTransform: 'none',
              fontWeight:
                location.pathname === '/cargar-excel'
                  ? 700
                  : 500,
              color:
                location.pathname === '/cargar-excel'
                  ? '#0086c9'
                  : '#475569',
              bgcolor:
                location.pathname === '/cargar-excel'
                  ? '#eef8fc'
                  : 'transparent',
              borderRadius: 2,
              px: 2,

              '&:hover': {
                bgcolor: '#eef8fc',
                color: '#0086c9',
              },
            }}
          >
            Cargar archivo Excel
          </Button>

          <Button
            startIcon={<TrendingUpRoundedIcon />}
            onClick={() => navigate('/evolutivo')}
            sx={{
              textTransform: 'none',
              fontWeight:
                location.pathname === '/evolutivo'
                  ? 700
                  : 500,
              color:
                location.pathname === '/evolutivo'
                  ? '#0086c9'
                  : '#475569',
              bgcolor:
                location.pathname === '/evolutivo'
                  ? '#eef8fc'
                  : 'transparent',
              borderRadius: 2,
              px: 2,

              '&:hover': {
                bgcolor: '#eef8fc',
                color: '#0086c9',
              },
            }}
          >
            Evolutivo
          </Button>
        </Box>

        {/* Separador usuario */}
        <Divider
          orientation="vertical"
          flexItem
          sx={{
            mx: 1,
            my: 2,
            borderColor: '#e2e8f0',
          }}
        />

        {/* Usuario */}
        <Tooltip title="Cuenta">
          <IconButton
            onClick={abrirMenuUsuario}
            sx={{
              display: 'flex',
              gap: 1,
              borderRadius: 2,
              px: 1,

              '&:hover': {
                bgcolor: '#f1f5f9',
              },
            }}
          >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                bgcolor: '#0086c9',
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              {user.name.charAt(0)}
            </Avatar>

            <Box
              sx={{
                display: {
                  xs: 'none',
                  sm: 'block',
                },
                textAlign: 'left',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: '#123f5c',
                  lineHeight: 1.2,
                }}
              >
                {user.name}
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  color: '#64748b',
                }}
              >
                {user.role}
              </Typography>
            </Box>

            <KeyboardArrowDownRoundedIcon
              sx={{
                display: {
                  xs: 'none',
                  sm: 'block',
                },
                color: '#64748b',
              }}
            />
          </IconButton>
        </Tooltip>

        {/* Menú del usuario */}
        <Menu
          anchorEl={anchorEl}
          open={menuAbierto}
          onClose={cerrarMenuUsuario}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                minWidth: 240,
                borderRadius: 2,
                border: '1px solid #e5e7eb',
                boxShadow:
                  '0 10px 30px rgba(15, 23, 42, 0.10)',
              },
            },
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: '#123f5c',
              }}
            >
              {user.name}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: '#64748b',
              }}
            >
              {user.email}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 0.5,
                color: '#0086c9',
                fontWeight: 600,
              }}
            >
              {user.role}
            </Typography>
          </Box>

          <Divider />

          <MenuItem
            onClick={cerrarSesion}
            sx={{
              gap: 1.5,
              py: 1.3,
              color: '#dc2626',
            }}
          >
            <LogoutRoundedIcon fontSize="small" />
            Cerrar sesión
          </MenuItem>
        </Menu>
      </Toolbar>

      {/* Línea de colores Energuate */}
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          height: 5,
        }}
      >
        <Box sx={{ flex: 1, bgcolor: '#f5df00' }} />
        <Box sx={{ flex: 1, bgcolor: '#f5a000' }} />
        <Box sx={{ flex: 1, bgcolor: '#ef3340' }} />
        <Box sx={{ flex: 1, bgcolor: '#32a852' }} />
        <Box sx={{ flex: 1, bgcolor: '#0086c9' }} />
      </Box>
    </AppBar>
  )
}

export default Header