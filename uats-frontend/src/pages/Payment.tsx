import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Typography, Paper, Box, Button, Divider, Chip } from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../context/AuthContext';
import { useSessions } from '../context/SessionContext';
import axios from 'axios';

const paymentMethods: Record<string, string> = {
  mtn: 'MTN Mobile Money',
  airtel: 'Airtel Money',
};

const Payment: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sessions, updateAttendance } = useSessions();
  const params = new URLSearchParams(location.search);
  const fineIdx = Number(params.get('fine'));
  const method = params.get('method') || 'mtn';

  // Build fines list for this user from sessions
  const userFines = sessions
    .map(session => {
      const attendance = (session.attendance || []).find(a => a.citizenNid === user?.username);
      return attendance && attendance.status === 'Absent'
        ? { date: session.date, amount: attendance.fine || 5000, status: attendance.paymentStatus || 'Unpaid', sessionId: session.sessionId }
        : null;
    })
    .filter(Boolean) as { date: string; amount: number; status: string; sessionId: string }[];

  const fine = userFines[fineIdx];

  const handlePay = async () => {
    // Update payment status in context
    if (fine && user?.username) {
      // Update attendance as before
      updateAttendance(fine.sessionId, user.username, 'Absent', fine.amount, 'Paid');
      // Update fine in backend with payment info
      await axios.put(`http://localhost:8000/api/fines`, {
        citizenId: user.username,
        sessionId: fine.sessionId,
        status: 'Paid',
        paymentMethod: method,
        paymentDate: new Date(),
      });
    }
    navigate('/dashboard');
  };

  return (
    <Container maxWidth="sm">
      <Box mt={6}>
        <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
              Back
            </Button>
            <Typography variant="h5" fontWeight={700} color="primary">
              Pay Fine
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="body1" mb={2}>
            <strong>Fine Date:</strong> {fine?.date}
          </Typography>
          <Typography variant="body1" mb={2}>
            <strong>Amount:</strong> <Chip label={fine?.amount + ' RWF'} color="error" />
          </Typography>
          <Typography variant="body1" mb={2}>
            <strong>Payment Method:</strong> <Chip label={paymentMethods[method]} color="primary" />
          </Typography>
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<PaymentIcon />}
            fullWidth
            sx={{ mt: 3 }}
            onClick={handlePay}
            disabled={!fine || fine.status === 'Paid'}
          >
            Pay Now
          </Button>
          {fine?.status === 'Paid' && (
            <Typography color="success.main" mt={2}>
              This fine is already paid.
            </Typography>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Payment; 