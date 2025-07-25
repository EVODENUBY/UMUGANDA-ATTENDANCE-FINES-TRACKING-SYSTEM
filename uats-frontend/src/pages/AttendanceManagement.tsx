import React, { useState } from 'react';
import { useCitizens } from '../context/CitizenContext';
import { useSessions } from '../context/SessionContext';
import { Container, Typography, Paper, Box, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent, Chip, IconButton, InputAdornment, Stack, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import axios from 'axios';
import Snackbar from '@mui/material/Snackbar';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const AttendanceManagement: React.FC = () => {
  const { sessions, updateAttendance } = useSessions();
  const { citizens } = useCitizens();
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  // Use the latest session as the current session
  const currentSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;

  // Attendance list for the current session (from backend)
  const attendanceList = currentSession ? (currentSession.attendance || []).map(a => ({ ...a })) : [];

  // Filtering and sorting
  const filteredAttendance = attendanceList
    .filter(att =>
      (typeof att.citizenNid === 'string' && att.citizenNid.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => sortAsc ? a.citizenNid.localeCompare(b.citizenNid) : b.citizenNid.localeCompare(a.citizenNid));

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  const handleToggleStatus = async (citizenNid: string, currentStatus: string) => {
    if (!currentSession) return;
    await updateAttendance(currentSession.sessionId, citizenNid, currentStatus === 'Present' ? 'Absent' : 'Present', currentStatus === 'Absent' ? 5000 : undefined, currentStatus === 'Absent' ? 'Unpaid' : undefined);
    setSnackbarMsg('Attendance status updated!');
    setSnackbarOpen(true);
  };

  const presentCount = attendanceList.filter(a => a.status === 'Present').length;
  const absentCount = attendanceList.filter(a => a.status === 'Absent').length;

  const navigate = useNavigate();

  if (currentSession) {
    console.log('Attendance array:', attendanceList);
    console.log('Citizens array:', citizens);
  }

  return (
    <Container maxWidth="md" sx={{ px: { xs: 1, sm: 2, md: 4 } }}>
      <Box mt={4}>
        <Button startIcon={<ArrowBackIcon />} variant="outlined" color="primary" sx={{ mb: 2 }} onClick={() => navigate('/admin')}>
          Back to Admin Panel
        </Button>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            background: 'linear-gradient(90deg, #003366 30%, #6dd5fa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: '#111',
            fontWeight: 800,
            letterSpacing: 1,
            mb: 2,
          }}
        >
          Attendance Management
        </Typography>
        {currentSession ? (
          <>
            {/* Session Summary */}
            <Card
              sx={{
                mb: 3,
                bgcolor: 'linear-gradient(135deg, #6dd5fa 0%, #2980b9 100%)',
                boxShadow: '0 8px 32px 0 rgba(41,128,185,0.18)',
                border: '2px solid',
                borderColor: 'primary.light',
                borderRadius: 6,
                color: '#002244',
                p: 2,
                transition: 'box-shadow 0.4s, background 0.4s',
                '&:hover': {
                  boxShadow: '0 16px 48px 0 rgba(41,128,185,0.28)',
                  bgcolor: 'linear-gradient(135deg, #2980b9 0%, #6dd5fa 100%)',
                },
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: 1,
                    background: 'linear-gradient(90deg, #003366 30%, #6dd5fa 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: '#111',
                    textShadow: '0 3px 12px rgba(0,0,0,0.25), 0 1px 0 #fff',
                  }}
                >
                  Current Session
                </Typography>
                <Typography sx={{ fontWeight: 600, fontSize: 18, color: '#002244', textShadow: '0 2px 8px rgba(109,213,250,0.18)' }}>
                  Date: {new Date(currentSession.date).toLocaleDateString()}
                </Typography>
                <Typography sx={{ fontWeight: 600, fontSize: 18, color: '#002244', textShadow: '0 2px 8px rgba(109,213,250,0.18)' }}>
                  Location: {currentSession.location}
                </Typography>
                <Box mt={1} display="flex" gap={2} alignItems="center">
                  <Typography sx={{ fontWeight: 600, color: '#002244' }}>Present:</Typography>
                  <Chip label={presentCount} color="success" icon={<CheckCircleIcon />} sx={{ fontWeight: 700, fontSize: 16, boxShadow: '0 2px 8px rgba(46,125,50,0.18)' }} />
                  <Typography sx={{ fontWeight: 600, color: '#002244' }}>Absent:</Typography>
                  <Chip label={absentCount} color="error" icon={<CancelIcon />} sx={{ fontWeight: 700, fontSize: 16, boxShadow: '0 2px 8px rgba(198,40,40,0.18)' }} />
                </Box>
              </CardContent>
            </Card>
            {/* Attendance Marking */}
            <Paper elevation={3} sx={{ p: 3, mb: 3, overflowX: 'auto' }}>
              <Box display="flex" alignItems="center" mb={2} gap={2} flexWrap="wrap">
                <TextField
                  placeholder="Search citizen..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ flex: 1, minWidth: 200 }}
                />
                <Button startIcon={<SortIcon />} onClick={() => setSortAsc(s => !s)}>
                  Sort {sortAsc ? 'A-Z' : 'Z-A'}
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Citizen Name</TableCell>
                      <TableCell>National ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAttendance.map((row: any, idx: number) => {
                      const citizen = (citizens || []).find(c =>
                        String(c.nationalId).trim() === String(row.citizenNid).trim() ||
                        String(c.nid).trim() === String(row.citizenNid).trim()
                      );
                      return (
                        <TableRow key={row.citizenNid}>
                          <TableCell>{citizen?.fullName || citizen?.name || row.citizenNid}</TableCell>
                          <TableCell>{citizen?.nationalId || citizen?.nid || row.citizenNid}</TableCell>
                          <TableCell>
                            {row.status === 'Present' ? (
                              <Chip icon={<CheckCircleIcon color="success" />} label="Present" color="success" />
                            ) : (
                              <Chip icon={<CancelIcon color="error" />} label="Absent" color="error" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={row.status === 'Present' ? 'contained' : 'outlined'}
                              color={row.status === 'Present' ? 'success' : 'error'}
                              size="small"
                              startIcon={row.status === 'Present' ? <CancelIcon /> : <CheckCircleIcon />}
                              onClick={() => handleToggleStatus(row.citizenNid, row.status)}
                            >
                              Mark {row.status === 'Present' ? 'Absent' : 'Present'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        ) : (
          <Alert severity="info">No session available. Please create a session in the admin panel.</Alert>
        )}
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AttendanceManagement; 