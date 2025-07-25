import React, { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Box, Alert, Snackbar, Slide, Paper } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

interface LoginFormInputs {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const { register, handleSubmit, setValue } = useForm<LoginFormInputs>();
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarColor, setSnackbarColor] = useState<'success' | 'error'>('success');
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: LoginFormInputs) => {
    setError(null);
    setSnackbarOpen(false);
    // Force blur on all inputs (for mobile)
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    // Normalize input
    const username = data.username.trim();
    const password = data.password.trim();
    console.log('Attempting login with:', { username, password });
    const success = await login(username, password);
    if (success) {
      setSnackbarMsg('Login successful! Redirecting...');
      setSnackbarColor('success');
      setSnackbarOpen(true);
    } else {
      setError('Invalid username or password');
      setSnackbarMsg('Login failed! Please check your credentials.');
      setSnackbarColor('error');
      setSnackbarOpen(true);
    }
  };

  // Redirect immediately after login if user is admin/leader/official
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'leader' || user?.role === 'official') {
      navigate('/admin', { replace: true });
    }
    if (user?.role === 'citizen') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  React.useEffect(() => {
    if (location.state && (location.state as any).nid) {
      setValue('username', (location.state as any).nid);
    }
    if (location.state && (location.state as any).password) {
      setValue('password', (location.state as any).password);
    }
  }, [location.state, setValue]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(90deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <Container maxWidth="xs" sx={{ boxShadow: 3, borderRadius: 2, bgcolor: 'white', py: 4, my: 8, width: { xs: '90%', sm: '70%', md: '400px' } }}>
        <Typography variant="h4" align="center" gutterBottom>
          Login
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="National ID"
            fullWidth
            margin="normal"
            autoComplete="off"
            inputProps={{ autoCapitalize: 'none', autoCorrect: 'off' }}
            {...register('username', { required: true })}
          />
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            margin="normal"
            autoComplete="off"
            required
            inputProps={{ autoCapitalize: 'none', autoCorrect: 'off' }}
            {...register('password', { required: true })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword((show) => !show)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            Login
          </Button>
        </form>
        <Box mt={2} textAlign="center">
          <Button color="secondary" onClick={() => navigate('/signup')}>
            Don't have an account? Sign Up
          </Button>
        </Box>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={2000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          TransitionComponent={Slide}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarColor} sx={{ width: '100%' }}>
            {snackbarMsg}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default Login; 