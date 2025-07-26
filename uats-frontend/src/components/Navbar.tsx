import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, IconButton, Drawer, List, ListItem, ListItemText, useMediaQuery, useTheme, ListItemButton } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MenuIcon from '@mui/icons-material/Menu';
import GroupsIcon from '@mui/icons-material/Groups';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const handleLogout = () => {
    logout();
    setTimeout(() => navigate('/login'), 500);
  };
  // Debug: Log auth state on every render
  console.log('Navbar render:', { isAuthenticated, user, role: user?.role });
  const menuLinks = (
    <>
      {/* Always show Dashboard for citizens when authenticated */}
      {isAuthenticated && user?.role === 'citizen' && (
        <ListItem disablePadding>
          <ListItemButton component={RouterLink} to="/dashboard" onClick={() => setDrawerOpen(false)}>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
      )}
      {/* Always show Admin Panel and Attendance for admin/leader when authenticated */}
      {isAuthenticated && (user?.role === 'leader' || user?.role === 'official' || user?.role === 'admin') && (
        <>
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/admin" onClick={() => setDrawerOpen(false)}>
              <ListItemText primary="Admin Panel" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/attendance" onClick={() => setDrawerOpen(false)}>
              <ListItemText primary="Attendance" />
            </ListItemButton>
          </ListItem>
        </>
      )}
      {/* Always show Login and Sign Up when not authenticated */}
      {!isAuthenticated && (
        <>
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/login" onClick={() => setDrawerOpen(false)}>
              <ListItemText primary="Login" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={RouterLink} to="/signup" onClick={() => setDrawerOpen(false)}>
              <ListItemText primary="Sign Up" />
            </ListItemButton>
          </ListItem>
        </>
      )}
      {/* Always show Logout when authenticated */}
      {isAuthenticated && (
        <ListItem disablePadding>
          <ListItemButton onClick={() => { handleLogout(); setDrawerOpen(false); }}>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      )}
    </>
  );
  return (
    <AppBar position="sticky" sx={{ top: 0, zIndex: 1201 }}>
      <Toolbar sx={{ justifyContent: isSmall ? 'space-between' : 'flex-start', alignItems: 'center', minHeight: 56 }}>
        {/* Umuganda Attendance Icon */}
        <GroupsIcon sx={{ fontSize: 32, mr: 2, color: 'white' }} />
        {/* System Name */}
        {isSmall ? (
          <Typography variant="body2" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 700, fontSize: 12, letterSpacing: 0.5 }}>
            UMUGANDA ATTENDANCE AND FINES TRACKING SYSTEM
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>
            UMUGANDA ATTENDANCE AND FINES TRACKING SYSTEM
          </Typography>
        )}
        {/* Menu for small screens */}
        {isSmall ? (
          <IconButton color="inherit" edge="end" onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isAuthenticated && user && (
              <Avatar sx={{ bgcolor: 'secondary.main', ml: 2 }}>
                {getInitials(user.name)}
              </Avatar>
            )}
            {isAuthenticated && user?.role === 'citizen' && (
              <Button color="inherit" component={RouterLink} to="/dashboard">
                Dashboard
              </Button>
            )}
            {isAuthenticated && (user?.role === 'leader' || user?.role === 'official' || user?.role === 'admin') && (
              <>
                <Button color="inherit" component={RouterLink} to="/admin">
                  Admin Panel
                </Button>
                <Button color="inherit" component={RouterLink} to="/attendance">
                  Attendance
                </Button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <Button color="inherit" component={RouterLink} to="/login">
                  Login
                </Button>
                <Button color="inherit" component={RouterLink} to="/signup">
                  Sign Up
                </Button>
              </>
            )}
            {isAuthenticated && (
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            )}
          </Box>
        )}
        {/* Drawer Menu  for small screens */}
        <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)} key={String(isAuthenticated) + (user?.role || '')}>
          <Box sx={{ width: 220 }} role="presentation" onClick={() => setDrawerOpen(false)}>
            <List>{menuLinks}</List>
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 