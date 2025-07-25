import React from 'react';
import { Container, Typography, Paper, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent, Chip, Button, Menu, MenuItem, Avatar, Stack, Grow } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PaymentIcon from '@mui/icons-material/Payment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAuth } from '../context/AuthContext';
import { useCitizens } from '../context/CitizenContext';
import { useNavigate } from 'react-router-dom';
import { useSessions } from '../context/SessionContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { sessions } = useSessions();
  const { citizens } = useCitizens();
  const loadingCitizens = citizens.length === 0;
  const citizenInfo = citizens.find(
    c => String(c.nationalId).trim() === String(user?.username).trim()
  );
  const navigate = useNavigate();

  const [fines, setFines] = React.useState<any[]>([]);
  React.useEffect(() => {
    const fetchFines = async () => {
      if (!user?.username) return;
      try {
        const res = await axios.get('https://uats-backend.onrender.com/api/fines');
        let finesArray: any[] = [];
        if (Array.isArray(res.data)) {
          finesArray = res.data;
        }
        setFines(finesArray.filter(f => f.citizenId === user.username));
      } catch (err) {
        // handle error
      }
    };
    fetchFines();
  }, [user]);

  // Get all session records for this citizen
  const citizenSessions = sessions.map(session => {
    const attendance = (session.attendance || []).find(a => a.citizenNid === user?.username);
    return { ...session, attendance };
  });

  // Use backend fines for paid/unpaid/paymentHistory
  const unpaidFines = fines.filter(f => f.status !== 'Paid');
  const paidFines = fines.filter(f => f.status === 'Paid');
  const paymentHistory = paidFines.map(f => ({ date: new Date(f.sessionDate).toLocaleDateString(), amount: f.amount, method: f.paymentMethod || 'Mobile Money', status: 'Paid' }));

  const lastAttendance = citizenSessions.length > 0 ? (citizenSessions[0].attendance?.status || 'N/A') : 'N/A';

  // For payment menu
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedFine, setSelectedFine] = React.useState<number | null>(null);
  const open = Boolean(anchorEl);

  const handlePayClick = (event: React.MouseEvent<HTMLButtonElement>, idx: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedFine(idx);
  };
  const handleClose = () => {
    setAnchorEl(null);
    setSelectedFine(null);
  };
  const handlePaymentMethod = (method: string) => {
    if (selectedFine !== null) {
      // Pass fine index and method to payment page
      navigate(`/pay?fine=${selectedFine}&method=${method}`);
    }
    handleClose();
  };

  // Add phone state for payment
  const [phone, setPhone] = React.useState(citizenInfo?.phone || '');

  // Add handleInitiatePayment function
  const handleInitiatePayment = async (method: string, fineIdx: number) => {
    // Force blur on all inputs (for mobile)
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    const fine = fines[fineIdx];
    if (!fine) return;
    try {
      console.log('Initiating payment with:', {
        citizenId: user?.username,
        sessionId: fine.sessionId,
        amount: fine.amount,
        method,
        phone,
      });
      await axios.post('https://uats-backend.onrender.com/api/payments/initiate', {
        citizenId: user?.username,
        sessionId: fine.sessionId,
        amount: fine.amount,
        method,
        phone,
      });
      // Optionally show a confirmation or redirect
      navigate(`/pay?fine=${fineIdx}&method=${method}`);
    } catch (err) {
      alert('Failed to initiate payment.');
    }
  };

  // Prepare session rows for TableBody
  let sessionRows: React.ReactNode;
  if (citizenSessions.length === 0) {
    sessionRows = (
      <TableRow>
        <TableCell colSpan={5} align="center">No session data available.</TableCell>
      </TableRow>
    );
  } else {
    sessionRows = (
      <React.Fragment>
        {citizenSessions.map((s, idx) => (
          <TableRow key={s.sessionId}>
            <TableCell>{new Date(s.date).toLocaleDateString()}</TableCell>
            <TableCell>{s.location}</TableCell>
            <TableCell>
              {s.attendance ? (
                s.attendance.status === 'Present' ? (
                  <Chip label="Present" color="success" />
                ) : (
                  <Chip label="Absent" color="error" />
                )
              ) : (
                <Chip label="Not Marked" color="default" />
              )}
            </TableCell>
            <TableCell>{s.attendance && s.attendance.status === 'Absent' ? (s.attendance.fine || 5000) : '-'}</TableCell>
            <TableCell>
              {s.attendance && s.attendance.status === 'Absent' ? (
                (() => {
                  const fine = fines.find(f => f.sessionId === s.sessionId);
                  if (fine && fine.status === 'Paid') {
                    return <Chip label="Paid" color="success" />;
                  } else if (fine && fine.status !== 'Paid') {
                    return <Chip label="Unpaid" color="warning" />;
                  } else {
                    return <Chip label="Unpaid" color="warning" />;
                  }
                })()
              ) : '-'}
            </TableCell>
            <TableCell>
              {s.attendance && s.attendance.status === 'Absent' ? (
                (() => {
                  const fineIdx = fines.findIndex(f => f.sessionId === s.sessionId && f.status !== 'Paid');
                  if (fineIdx !== -1) {
                    return <>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={e => handlePayClick(e, fineIdx)}
                      >
                        Pay Now
                      </Button>
                      <Menu anchorEl={anchorEl} open={open && selectedFine === fineIdx} onClose={handleClose}>
                        <MenuItem onClick={async () => { await handleInitiatePayment('mtn', fineIdx); handleClose(); }}>Pay with MTN Mobile Money</MenuItem>
                        <MenuItem onClick={async () => { await handleInitiatePayment('airtel', fineIdx); handleClose(); }}>Pay with Airtel Money</MenuItem>
                      </Menu>
                    </>;
                  }
                  return null;
                })()
              ) : null}
            </TableCell>
          </TableRow>
        ))}
      </React.Fragment>
    );
  }

  // Attendance chart data for this citizen
  const attendanceChartData = React.useMemo(() => {
    const labels = citizenSessions.map(s => new Date(s.date).toLocaleDateString());
    const presentData = citizenSessions.map(s => (s.attendance && s.attendance.status === 'Present' ? 1 : 0));
    const absentData = citizenSessions.map(s => (s.attendance && s.attendance.status === 'Absent' ? 1 : 0));
    return {
      labels,
      datasets: [
        {
          label: 'Present',
          data: presentData,
          borderColor: '#2e7d32',
          backgroundColor: 'rgba(46,125,50,0.2)',
        },
        {
          label: 'Absent',
          data: absentData,
          borderColor: '#c62828',
          backgroundColor: 'rgba(198,40,40,0.2)',
        },
      ],
    };
  }, [citizenSessions]);

  // Gamified badge: 3+ consecutive presents
  let consecutivePresents = 0;
  let maxConsecutivePresents = 0;
  citizenSessions.forEach(s => {
    if (s.attendance && s.attendance.status === 'Present') {
      consecutivePresents++;
      if (consecutivePresents > maxConsecutivePresents) maxConsecutivePresents = consecutivePresents;
    } else {
      consecutivePresents = 0;
    }
  });
  const showBadge = maxConsecutivePresents >= 3;

  const [badgeAnimated, setBadgeAnimated] = React.useState(true);
  React.useEffect(() => {
    setBadgeAnimated(true);
    const timeout = setTimeout(() => setBadgeAnimated(false), 2000);
    return () => clearTimeout(timeout);
  }, [maxConsecutivePresents]);

  // Find the next Umuganda session (future date only)
  const today = new Date();
  const nextSession = sessions.find(s => {
    const sessionDate = new Date(s.date);
    const attendance = (s.attendance || []).find(a => a.citizenNid === user?.username);
    return sessionDate > today && attendance && attendance.status === 'Absent' && (!attendance.paymentStatus || attendance.paymentStatus !== 'Paid');
  });

  // Countdown for next session
  const [countdown, setCountdown] = React.useState('');
  React.useEffect(() => {
    if (!nextSession) return;
    const interval = setInterval(() => {
      const sessionDate = new Date(nextSession.date);
      const now = new Date();
      const diff = sessionDate.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown('Session is today!');
        clearInterval(interval);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      setCountdown(`${days}d ${hours}h ${minutes}m left`);
    }, 1000 * 30); // update every 30 seconds
    return () => clearInterval(interval);
  }, [nextSession]);

  const [notificationSupported, setNotificationSupported] = React.useState(false);
  const [notificationPermission, setNotificationPermission] = React.useState<NotificationPermission | null>(null);

  React.useEffect(() => {
    if ('Notification' in window) {
      setNotificationSupported(true);
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleEnableNotifications = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
        if (permission === 'granted' && nextSession) {
          scheduleSessionNotification(nextSession);
        }
      });
    }
  };

  function scheduleSessionNotification(session: any) {
    // For now, show a notification immediately for demo. In backend, schedule for session.date.
    if ('Notification' in window && Notification.permission === 'granted') {
      const sessionDate = new Date(session.date);
      const now = new Date();
      const diff = sessionDate.getTime() - now.getTime();
      if (diff > 0) {
        setTimeout(() => {
          new Notification('Umuganda Reminder', {
            body: `Don’t forget the Umuganda session on ${session.date} at ${session.location}!`,
            icon: '/favicon.ico',
          });
        }, Math.min(diff, 10000)); // For demo, max 10s delay. In backend, use full diff.
      }
    }
  }

  React.useEffect(() => {
    if (notificationPermission === 'granted' && nextSession) {
      scheduleSessionNotification(nextSession);
    }
    // eslint-disable-next-line
  }, [notificationPermission, nextSession]);

  return (
    <Container maxWidth="md" sx={{ background: 'linear-gradient(120deg, #f0f4f8 0%, #e0e7ef 100%)', minHeight: '100vh', py: 2 }}>
      <Box mt={4}>
        {loadingCitizens ? (
          <Typography variant="h6" align="center">Loading your data...</Typography>
        ) : (
          <>
            {/* At the top of the dashboard, combine citizen info and smart reminder in one card */}
            <Paper elevation={8} sx={{
              p: { xs: 3, md: 4 },
              mb: 4,
              bgcolor: 'linear-gradient(135deg, #f8ffae 0%, #43cea2 100%)',
              color: 'primary.dark',
              boxShadow: '0 8px 32px 0 rgba(67,206,162,0.25), 0 0 0 0 rgba(67,206,162,0.15)',
              border: '2px solid',
              borderColor: 'primary.light',
              borderRadius: 6,
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between',
              gap: 4,
              transition: 'box-shadow 0.4s, background 0.4s',
              '&:hover': {
                boxShadow: '0 16px 48px 0 rgba(67,206,162,0.35), 0 0 24px 8px rgba(67,206,162,0.18)',
                bgcolor: 'linear-gradient(135deg, #43cea2 0%, #f8ffae 100%)',
              },
            }}>
              <Box flex={1} minWidth={0}>
                <Box display="flex" alignItems="center" gap={3}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, fontSize: 32, boxShadow: '0 2px 8px 0 rgba(44,83,100,0.18)' }}>
                    {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                  </Avatar>
                  <Box minWidth={0}>
                    <Typography variant="h5" fontWeight={700} noWrap sx={{ color: 'primary.main', letterSpacing: 1 }}>
                      {citizenInfo?.fullName || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>Phone: <b>{citizenInfo?.phone || 'N/A'}</b></Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>National ID: <b>{citizenInfo?.nationalId || 'N/A'}</b></Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>Village: <b>{citizenInfo?.village || 'N/A'}</b></Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>Sector: <b>{citizenInfo?.sector || 'N/A'}</b></Typography>
                  </Box>
                </Box>
              </Box>
              {nextSession && (
                <Box flex={1} minWidth={0} display="flex" flexDirection="column" alignItems={{ xs: 'flex-start', md: 'flex-end' }} justifyContent="center" sx={{ mt: { xs: 3, md: 0 } }}>
                  <Typography variant="h6" fontWeight={700} mb={1} color="primary" sx={{ letterSpacing: 1 }}>
                    <AccessTimeIcon sx={{ mr: 1, color: 'primary.main', verticalAlign: 'middle' }} />
                    Next Umuganda Session
                  </Typography>
                  <Typography mb={1} sx={{ fontSize: 18, color: 'primary.dark', fontWeight: 600 }}>
                    Date: <span style={{ color: '#1976d2' }}>{new Date(nextSession.date).toLocaleDateString()}</span> | Location: <span style={{ color: '#1976d2' }}>{nextSession.location}</span>
                  </Typography>
                  <Box display="flex" alignItems="center" mb={1}>
                    <AccessTimeIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="body1" fontWeight={600} sx={{ color: '#388e3c', fontSize: 16 }}>{countdown}</Typography>
                  </Box>
                  {notificationSupported && notificationPermission !== 'granted' && (
                    <Button variant="outlined" color="primary" sx={{ mt: 1 }} onClick={handleEnableNotifications}>
                      Enable Push Notifications
                    </Button>
                  )}
                </Box>
              )}
            </Paper>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
              <Box flex={1}>
                <Card sx={{ bgcolor: unpaidFines.length > 0 ? 'error.light' : 'success.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6">Unpaid Fines</Typography>
                    <Typography variant="h4">{unpaidFines.length}</Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box flex={1}>
                <Card sx={{ bgcolor: lastAttendance === 'Present' ? 'success.light' : 'warning.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6">Last Attendance</Typography>
                    <Typography variant="h4">{lastAttendance}</Typography>
                  </CardContent>
                </Card>
              </Box>
            </Stack>
            {/* Umuganda Session Info */}
            <Box mb={3}>
              <Card sx={{ p: 2 }}>
                <CardContent>
                  <Typography variant="h6" mb={2}>Attendance Trend</Typography>
                  <Box height={200}>
                    <Line data={attendanceChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>
            <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6">Umuganda Sessions</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Fine</TableCell>
                      <TableCell>Payment</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sessionRows}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            {/* After the session table, add a summary of paid fines as badges/banners */}
            {paidFines.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle1" color="success.main" gutterBottom>Paid Fines</Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  {paidFines.map((s, idx) => (
                    <Box key={s.sessionId} sx={{ bgcolor: 'success.light', color: 'white', px: 2, py: 1, borderRadius: 2, mb: 1 }}>
                      <strong>Paid:</strong> {new Date(s.sessionDate).toLocaleDateString()} - {s.location}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
            {/* Gamified badge for consistent participation - animated at top */}
            <Grow in={showBadge || badgeAnimated} timeout={1000}>
              <Box mb={2} display={showBadge ? 'block' : 'none'}>
                <Chip label={`Streak: ${maxConsecutivePresents} Presents!`} color="success" icon={<CheckCircleIcon />} sx={{ fontWeight: 700, fontSize: 18, px: 2, py: 1, boxShadow: 3, animation: badgeAnimated ? 'pulse 1.5s infinite' : 'none' }} />
              </Box>
            </Grow>
            {/* Payment History Section */}
            {paymentHistory.length > 0 && (
              <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
                <Typography variant="h6">Payment History</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paymentHistory.map((row, idx) => (
                        row && (
                          <TableRow key={idx}>
                            <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                            <TableCell>{row.amount}</TableCell>
                            <TableCell>{row.method}</TableCell>
                            <TableCell>
                              <Chip icon={<PaymentIcon color="success" />} label={row.status} color="success" />
                            </TableCell>
                          </TableRow>
                        )
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
            {/* Remove Attendance History, Fines, and Payment History sections (or update to use real data if needed) */}
          </>
        )}
      </Box>
      <style>{`
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(46,125,50,0.4); }
  70% { box-shadow: 0 0 0 10px rgba(46,125,50,0); }
  100% { box-shadow: 0 0 0 0 rgba(46,125,50,0); }
}`}</style>
    </Container>
  );
};

export default Dashboard; 