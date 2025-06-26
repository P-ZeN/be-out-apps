import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Chip,
} from '@mui/material';
import { AdminPanelSettings, ExitToApp } from '@mui/icons-material';

const AdminLayout = ({ user, onLogout, children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <AdminPanelSettings sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Be Out Admin Dashboard
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={user?.role === 'admin' ? 'Administrator' : 'Moderator'} 
              color="secondary" 
              size="small" 
            />
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              {user?.email?.[0]?.toUpperCase()}
            </Avatar>
            <Typography variant="body2">
              {user?.email}
            </Typography>
            <Button 
              color="inherit" 
              onClick={onLogout}
              startIcon={<ExitToApp />}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
