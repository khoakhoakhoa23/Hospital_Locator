import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  LocalHospital as HospitalIcon,
  Map as MapIcon,
  List as ListIcon,
  Settings as AdminIcon
} from '@mui/icons-material';

const Header = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const navItems = [
    { path: '/', label: 'Bản đồ', icon: <MapIcon /> },
    { path: '/hospitals', label: 'Danh sách', icon: <ListIcon /> },
  ];

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        {/* Logo */}
        <HospitalIcon sx={{ mr: 2 }} />
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold'
          }}
        >
          WebGIS Bệnh viện TP.HCM
        </Typography>

        {/* Navigation */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              component={Link}
              to={item.path}
              color="inherit"
              startIcon={!isMobile ? item.icon : null}
              variant={location.pathname === item.path ? 'outlined' : 'text'}
              sx={{
                color: 'white',
                borderColor: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              {isMobile ? item.icon : item.label}
            </Button>
          ))}

          {/* Admin Link */}
          <IconButton
            color="inherit"
            href="http://127.0.0.1:8000/admin/"
            target="_blank"
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <AdminIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

