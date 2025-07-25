import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, MenuItem, Alert, Snackbar, Slide, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useCitizens } from '../context/CitizenContext';
// @ts-ignore
import axios from 'axios';

interface SignupFormInputs {
  name: string;
  nid: string;
  phone: string;
  village: string;
  sector: string;
}

const Signup: React.FC = () => {
  const { register, handleSubmit, control, reset } = useForm<SignupFormInputs>();
  const { signup } = useAuth();
  const { citizens, addCitizen } = useCitizens();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarColor, setSnackbarColor] = useState<'success' | 'error'>('success');
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [registeredNid, setRegisteredNid] = useState('');

  const onSubmit = async (data: SignupFormInputs) => {
    const uniquePart = Date.now().toString(36).slice(-6);
    const newPassword = `UATS@${data.nid.slice(-4)}${uniquePart}`;
    const newCitizen = {
      citizenId: Date.now().toString(),
      fullName: data.name,
      nationalId: data.nid,
      phone: data.phone,
      village: data.village,
      sector: data.sector,
      username: data.nid,
      password: newPassword,
    };
    try {
      await axios.post('https://uats-backend.onrender.com/api/citizens', newCitizen);
      // Add to all sessions for attendance
      const sessionsRes = await axios.get('https://uats-backend.onrender.com/api/sessions');
      const sessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
      for (const session of sessions) {
        const alreadyExists = (session.attendance || []).some((a: any) => a.citizenNid === newCitizen.nationalId);
        if (!alreadyExists) {
          const updatedAttendance = [
            ...(session.attendance || []),
            { citizenNid: newCitizen.nationalId, status: 'Absent' as 'Absent' }
          ];
          await axios.put(`https://uats-backend.onrender.com/api/sessions/${session._id || session.sessionId}`, { ...session, attendance: updatedAttendance });
        }
      }
      setGeneratedPassword(newPassword);
      setRegisteredNid(data.nid);
      setShowPasswordDialog(true);
      reset();
    } catch (error) {
      // handle error (show snackbar or alert)
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(90deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      <Container maxWidth="xs" sx={{ boxShadow: 3, borderRadius: 2, bgcolor: 'white', py: 4, my: 8, width: { xs: '90%', sm: '70%', md: '400px' } }}>
        <Typography variant="h4" align="center" gutterBottom>
          Sign Up
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Full Name"
            fullWidth
            margin="normal"
            {...register('name', { required: true })}
          />
          <TextField
            label="National ID"
            fullWidth
            margin="normal"
            {...register('nid', { required: true })}
          />
          <TextField
            label="Phone Number"
            fullWidth
            margin="normal"
            {...register('phone', { required: true })}
          />
          <TextField
            label="Village"
            fullWidth
            margin="normal"
            {...register('village', { required: true })}
          />
          <TextField
            label="Sector"
            fullWidth
            margin="normal"
            {...register('sector', { required: true })}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            Sign Up
          </Button>
        </form>
        {generatedPassword && (
          <Box mt={2} textAlign="center">
            <Alert severity="info">
              <strong>Your password:</strong> {generatedPassword}
              <Button size="small" sx={{ ml: 2 }} onClick={() => navigator.clipboard.writeText(generatedPassword)}>
                Copy
              </Button>
            </Alert>
          </Box>
        )}
        <Box mt={2} textAlign="center">
          <Button color="secondary" onClick={() => navigate('/login')}>
            Already have an account? Login
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
      {/* Password Dialog after registration */}
      <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)}>
        <DialogTitle>Registration Successful</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>Your account has been created.</Typography>
          <Typography gutterBottom><strong>National ID:</strong> {registeredNid}</Typography>
          <Typography gutterBottom><strong>Password:</strong> {generatedPassword}</Typography>
          <Button size="small" sx={{ mt: 1 }} onClick={() => navigator.clipboard.writeText(generatedPassword || '')}>
            Copy Password
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowPasswordDialog(false);
            navigate('/login', { state: { nid: registeredNid, password: generatedPassword } });
          }} color="primary" variant="contained">
            Go to Login
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Signup; 