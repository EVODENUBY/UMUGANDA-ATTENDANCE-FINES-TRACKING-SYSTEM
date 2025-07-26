
import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Card, CardContent, Chip, Stack, TextField, Snackbar, Alert } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import { Line } from 'react-chartjs-2';
import  Papa from 'papaparse';
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
import { useAuth } from '../context/AuthContext';
import { useSessions, UmugandaSession, AttendanceStatus } from '../context/SessionContext';
import { useCitizens } from '../context/CitizenContext';
import TablePagination from '@mui/material/TablePagination';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Add a type for fine row
export interface FineRow {
  id: string;
  user: string;
  date: string;
  amount: number;
  status: string;
  sessionId: string;
  citizenNid: string;
}

// Add type for edit form
interface EditCitizenForm {
  citizenId?: string;
  fullName: string;
  nationalId: string;
  phone: string;
  village: string;
  sector: string;
  username: string;
  password: string;
}

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const { sessions, addSession, updateSession, updateAttendance, deleteSession, fetchSessions } = useSessions();
  const { citizens, refreshCitizens, updateCitizen, deleteCitizen, addCitizen } = useCitizens();
  const [sessionFilter, setSessionFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [newSession, setNewSession] = useState({ date: '', location: '' });
  const [citizenForm, setCitizenForm] = useState({ name: '', nid: '', phone: '', village: '', sector: '' });
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditCitizenForm>({
    citizenId: '',
    fullName: '',
    nationalId: '',
    phone: '',
    village: '',
    sector: '',
    username: '',
    password: '',
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarColor, setSnackbarColor] = useState<'success' | 'error'>('success');
  // Add missing state for loading and delete dialog
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  
  // Citizens Table Pagination
  const [citizensPage, setCitizensPage] = useState(0);
  const [citizensRowsPerPage, setCitizensRowsPerPage] = useState(5);
  const handleCitizensChangePage = (event: unknown, newPage: number) => setCitizensPage(newPage);
  const handleCitizensChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCitizensRowsPerPage(parseInt(event.target.value, 10));
    setCitizensPage(0);
  };

  // Session Attendance Table Pagination
  const [attendancePage, setAttendancePage] = useState<Record<string, number>>({});
  const [attendanceRowsPerPage, setAttendanceRowsPerPage] = useState<Record<string, number>>({});
  const handleAttendanceChangePage = (sessionId: string, newPage: number) => setAttendancePage((prev: any) => ({ ...prev, [sessionId]: newPage }));
  const handleAttendanceChangeRowsPerPage = (sessionId: string, value: number) => setAttendanceRowsPerPage((prev: any) => ({ ...prev, [sessionId]: value }));

  const isAdmin = user?.role === 'admin' || user?.role === 'leader' || user?.role === 'official';
  // Use isCitizensLoaded defined in this file
  const isCitizensLoaded = citizens && citizens.length > 0;

  const handleExportCSV = () => {
    // Simple CSV export for demo
    const csv = [
      ['User', 'Date', 'Amount', 'Status'],
      ...sessions.flatMap(session =>
        (session.attendance || []).filter(a => a.status === 'Absent' && (a.fine !== undefined))
          .map(a => ({
            user: citizens.find(c => c.nid === a.citizenNid)?.name || a.citizenNid,
            date: session.date,
            amount: a.fine ?? 5000,
            status: a.paymentStatus || 'Unpaid',
            sessionId: session.sessionId,
            citizenNid: a.citizenNid,
          }) as FineRow)
      ).map(f => [f.user, f.date, f.amount, f.status]),
    ]
      .map(row => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fines.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Download registered citizens as CSV
  const handleDownloadCitizensCSV = () => {
    const csv = [
      ['Full Name', 'National ID', 'Phone', 'Village', 'Sector', 'Username', 'Password'],
      ...citizens.map(c => [c.name, c.nid, c.phone, c.village, c.sector, c.username, c.password]),
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'citizens.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: Papa.ParseResult<any>) => {
        let added = 0;
        for (const row of results.data as Array<{ name: string; nid: string; phone: string; village: string; sector: string }>) {
          if (!row.name || !row.nid || !row.phone || !row.village || !row.sector) continue;
          const uniquePart = Date.now().toString(36).slice(-6) + Math.floor(Math.random() * 1000);
          const password = `UATS@${row.nid?.slice(-4) || '0000'}${uniquePart}`;
          const newCitizen = {
            citizenId: Date.now().toString() + Math.floor(Math.random() * 1000),
            fullName: row.name,
            nationalId: row.nid,
            phone: row.phone,
            village: row.village,
            sector: row.sector,
            username: row.nid,
            password,
          };
          try {
            await axios.post('https://uats-backend.onrender.com/api/citizens', newCitizen);
            await addCitizenToSessions(newCitizen); // Add to all sessions
            added++;
          } catch (error) {
            // Optionally handle error for each row
          }
        }
        setSnackbarMsg(added > 0 ? 'Citizens imported successfully!' : 'No valid citizens found in file.');
        setSnackbarColor(added > 0 ? 'success' : 'error');
        setSnackbarOpen(true);
        fetchCitizens(); // Refresh table
      },
    });
  };

  const handleCitizenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCitizenForm({ ...citizenForm, [e.target.name]: e.target.value });
  };

  // Utility to add a new citizen to all sessions
  const addCitizenToSessions = async (citizen: any) => {
    for (const session of sessions) {
      const alreadyExists = (session.attendance || []).some(a => a.citizenNid === (citizen.nationalId || citizen.nid));
      if (!alreadyExists) {
        const updatedAttendance = [
          ...(session.attendance || []),
          { citizenNid: citizen.nationalId || citizen.nid, status: 'Absent' as 'Absent' }
        ] as typeof session.attendance;
        await updateSession(session.sessionId, { ...session, attendance: updatedAttendance });
      }
    }
  };

  const handleRegisterCitizen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenForm.name || !citizenForm.nid || !citizenForm.phone || !citizenForm.village || !citizenForm.sector) {
      setFormError('Please fill in all fields.');
      setSnackbarMsg('Please fill in all fields.');
      setSnackbarColor('error');
      setSnackbarOpen(true);
      return;
    }
    const uniquePart = Date.now().toString(36).slice(-6);
    const newPassword = `UATS@${citizenForm.nid.slice(-4)}${uniquePart}`;
    const newCitizen = {
      citizenId: Date.now().toString(),
      fullName: citizenForm.name,
      nationalId: citizenForm.nid,
      phone: citizenForm.phone,
      village: citizenForm.village,
      sector: citizenForm.sector,
      username: citizenForm.nid,
      password: newPassword,
    };
    try {
      await addCitizen(newCitizen);
      setCitizenForm({ name: '', nid: '', phone: '', village: '', sector: '' });
      setSnackbarMsg('Citizen registered successfully!');
      setSnackbarColor('success');
      setSnackbarOpen(true);
      await addCitizenToSessions(newCitizen); // Add to all sessions
    } catch (error) {
      setSnackbarMsg('Failed to register citizen.');
      setSnackbarColor('error');
      setSnackbarOpen(true);
    }
  };

  // Edit citizen
  const handleEditCitizen = (idx: number) => {
    setEditIdx(idx);
    setEditForm({
    
      fullName: citizens[idx].fullName || '',
      nationalId: citizens[idx].nationalId || '',
      phone: citizens[idx].phone || '',
      village: citizens[idx].village || '',
      sector: citizens[idx].sector || '',
      username: citizens[idx].username || '',
      password: citizens[idx].password || '',
    });
  };
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-update username when national ID changes
      if (name === 'nationalId') {
        updated.username = value;
      }
      return updated;
    });
  };
  const handleSaveEdit = async () => {
    if (editIdx !== null) {
      setLoadingEdit(true);
      try {
        // Build update payload with all required fields
        const updatedCitizen = {
          citizenId: editForm.citizenId,
          fullName: editForm.fullName,
          nationalId: editForm.nationalId,
          phone: editForm.phone,
          village: editForm.village,
          sector: editForm.sector,
          username: editForm.username,
          password: editForm.password,
        };
        
        await updateCitizen(editIdx, updatedCitizen);
        setEditIdx(null);
        setSnackbarMsg('Citizen updated successfully!');
        setSnackbarColor('success');
        setSnackbarOpen(true);
        // Refresh fines after citizen update
        await fetchFines();
      } catch (error) {
        console.error('Update citizen error:', error);
        setSnackbarMsg('Failed to update citizen.');
        setSnackbarColor('error');
        setSnackbarOpen(true);
      } finally {
        setLoadingEdit(false);
      }
    }
  };
  const handleDeleteCitizen = async (idx: number) => {
    setLoadingDelete(true);
    try {
      await deleteCitizen(idx);
      setSnackbarMsg('Citizen deleted successfully!');
      setSnackbarColor('success');
      setSnackbarOpen(true);
      // Refresh fines and sessions after citizen deletion
      await fetchFines();
      // Refresh sessions to update attendance lists
      await fetchSessions();
    } catch (error) {
      console.error('Delete citizen error:', error);
      setSnackbarMsg('Failed to delete citizen.');
      setSnackbarColor('error');
      setSnackbarOpen(true);
    } finally {
      setLoadingDelete(false);
      setDeleteIdx(null);
    }
  };

  // Add delete session handler
  const handleDeleteSession = async (sessionId: string) => {
    try {
      const session = sessions.find(s => s.sessionId === sessionId);
      console.log('Deleting session:', session);
      if (!session || !session._id) {
        setSnackbarMsg('Session not found.');
        setSnackbarColor('error');
        setSnackbarOpen(true);
        return;
      }
      await deleteSession(session._id);
      setSnackbarMsg('Session deleted!');
      setSnackbarColor('success');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMsg('Failed to delete session.');
      setSnackbarColor('error');
      setSnackbarOpen(true);
    }
  };

  // Fetch citizens from backend
  const fetchCitizens = async () => {
    try {
      await refreshCitizens();
    } catch (err) {
      console.error('Fetch citizens error:', err);
    }
  };

  useEffect(() => {
    fetchCitizens();
  }, []);

  // Filtered citizens
  const filteredCitizens = citizens.filter((cit: any) =>
    (typeof cit.name === 'string' && cit.name.toLowerCase().includes(search.toLowerCase())) ||
    (typeof cit.nid === 'string' && cit.nid.toLowerCase().includes(search.toLowerCase())) ||
    (typeof cit.phone === 'string' && cit.phone.toLowerCase().includes(search.toLowerCase())) ||
    (typeof cit.village === 'string' && cit.village.toLowerCase().includes(search.toLowerCase())) ||
    (typeof cit.sector === 'string' && cit.sector.toLowerCase().includes(search.toLowerCase()))
  );

  // Filter sessions by date/location
  const filteredSessions = sessions.filter(s =>
    (!sessionFilter || s.date.includes(sessionFilter)) &&
    (!locationFilter || s.location.toLowerCase().includes(locationFilter.toLowerCase()))
  );

  // Add new session
  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.date || !newSession.location) {
      setSnackbarMsg('Please provide date and location.');
      setSnackbarColor('error');
      setSnackbarOpen(true);
      return;
    }
    // Use the up-to-date citizens list from context
    const sessionId = (Date.now()).toString();
    await addSession({
      sessionId,
      date: newSession.date,
      location: newSession.location,
      attendance: (citizens || []).map((c: any) => ({
        citizenNid: c.nationalId || c.nid,
        status: 'Absent',
      })),
    });
    setNewSession({ date: '', location: '' });
    setSnackbarMsg('Session added!');
    setSnackbarColor('success');
    setSnackbarOpen(true);
  };

  // Update attendance for a citizen in a session
  const handleAttendanceChange = (sessionId: string, citizenNid: string, status: AttendanceStatus) => {
    updateAttendance(sessionId, citizenNid, status, status === 'Absent' ? 5000 : undefined, status === 'Absent' ? 'Unpaid' : undefined);
    setSnackbarMsg('Attendance updated!');
    setSnackbarColor('success');
    setSnackbarOpen(true);
  };

  // Update payment status for a citizen in a session
  const handlePaymentChange = (sessionId: string, citizenNid: string, paymentStatus: 'Paid' | 'Unpaid') => {
    updateAttendance(sessionId, citizenNid, 'Absent', 5000, paymentStatus);
    setSnackbarMsg('Payment status updated!');
    setSnackbarColor('success');
    setSnackbarOpen(true);
  };

  // Fines Management Table: Use real session/attendance data and only show real citizens
  const allFines = sessions.flatMap(session =>
    (session.attendance || []).filter(a => a.status === 'Absent' && (a.fine !== undefined) && citizens.some(c => c.nid === a.citizenNid))
      .map(a => ({
        user: citizens.find(c => c.nid === a.citizenNid)?.name || a.citizenNid,
        date: session.date,
        amount: a.fine ?? 5000,
        status: a.paymentStatus || 'Unpaid',
        sessionId: session.sessionId,
        citizenNid: a.citizenNid,
      }) as FineRow)
  );
  const handleOverride = async (fine: FineRow) => {
    const newStatus = fine.status === 'Paid' ? 'Unpaid' : 'Paid';
    await updateAttendance(fine.sessionId, fine.citizenNid, 'Absent', fine.amount, newStatus);
    setSnackbarMsg('Fine status overridden!');
    setSnackbarColor('success');
    setSnackbarOpen(true);
    fetchFines(); // Refetch fines after override
  };

  const handleDeleteFine = async (fineId: string) => {
    try {
      await axios.delete(`https://uats-backend.onrender.com/api/fines/${fineId}`);
      setSnackbarMsg('Fine deleted successfully!');
      setSnackbarColor('success');
      setSnackbarOpen(true);
      fetchFines(); // Refetch fines after deletion
    } catch (error) {
      console.error('Delete fine error:', error);
      setSnackbarMsg('Failed to delete fine.');
      setSnackbarColor('error');
      setSnackbarOpen(true);
    }
  };

  // Add a function to delete an attendance record for a citizen in a session
  const handleDeleteAttendance = (sessionId: string, citizenNid: string) => {
    const session = sessions.find(s => s.sessionId === sessionId);
    if (!session) return;
    updateSession(sessionId, {
      sessionId: session.sessionId,
      date: session.date,
      location: session.location,
      attendance: (session.attendance || []).filter(a => a.citizenNid !== citizenNid),
    });
    setSnackbarMsg('Attendance record deleted!');
    setSnackbarColor('success');
    setSnackbarOpen(true);
    fetchFines(); // Refetch fines after attendance delete
  };

  // Define trendsData using context sessions
  const trendsData = React.useMemo(() => {
    const labels = sessions.map(s => new Date(s.date).toLocaleDateString());
    const presentCounts = sessions.map(s => (s.attendance || []).filter((a: any) => a.status === 'Present').length);
    const absentCounts = sessions.map(s => (s.attendance || []).filter((a: any) => a.status === 'Absent').length);
    return {
      labels,
      datasets: [
        {
          label: 'Present',
          data: presentCounts,
          borderColor: '#2e7d32',
          backgroundColor: 'rgba(46,125,50,0.2)',
        },
        {
          label: 'Absent',
          data: absentCounts,
          borderColor: '#c62828',
          backgroundColor: 'rgba(198,40,40,0.2)',
        },
      ],
    };
  }, [sessions]);

  // AI-powered attendance prediction and severity analysis
  const attendanceStats = React.useMemo(() => {
    let totalSessions = sessions.length;
    let totalCitizens = citizens.length;
    let totalAbsences = 0;
    let totalPresents = 0;
    let absenteeMap: Record<string, number> = {};
    sessions.forEach(session => {
      (session.attendance || []).forEach(a => {
        if (a.status === 'Absent') {
          totalAbsences++;
          absenteeMap[a.citizenNid] = (absenteeMap[a.citizenNid] || 0) + 1;
        } else if (a.status === 'Present') {
          totalPresents++;
        }
      });
    });
    const absenteeRate = totalAbsences / (totalSessions * totalCitizens);
    const severity = absenteeRate > 0.5 ? 'high' : absenteeRate > 0.2 ? 'medium' : 'low';
    const suggestion = severity === 'high'
      ? 'Consider community meetings and incentives to boost participation.'
      : severity === 'medium'
      ? 'Remind citizens and recognize consistent participants.'
      : 'Great job! Keep up the good work.';
    return { absenteeRate, severity, suggestion, absenteeMap };
  }, [sessions, citizens]);

  // In the Export Data & Analytics section, add a summary table to the Export Fines card
  const sessionSummary = sessions.map(session => {
    const absent = (session.attendance || []).filter(a => a.status === 'Absent').length;
    const present = (session.attendance || []).filter(a => a.status === 'Present').length;
    return { date: new Date(session.date).toLocaleDateString(), absent, present };
  });

  // In the session attendance TablePagination, use the filtered attendance count
  const filteredAttendanceForSession = (session: any) => (session.attendance || []).filter((a: any) => citizens.some((c: any) => c.nid === a.citizenNid));

  const [fines, setFines] = useState<FineRow[]>([]);
  // Fetch fines from backend
  const fetchFines = async () => {
    try {
      const res = await axios.get('https://uats-backend.onrender.com/api/fines');
      let finesArray: any[] = [];
      if (Array.isArray(res.data)) {
        finesArray = res.data;
      }
      setFines(finesArray.map((fine: any) => ({
        id: fine._id, // Add fine ID for deletion
        user: citizens.find((c: any) => c.nid === fine.citizenId)?.name || fine.citizenId,
        date: new Date(fine.sessionDate).toLocaleDateString(),
        amount: fine.amount,
        status: fine.status,
        sessionId: fine.sessionId || '',
        citizenNid: fine.citizenId,
      })));
    } catch (err) {
      console.error('Fetch fines error:', err);
    }
  };
  useEffect(() => {
    fetchFines();
  }, [citizens, sessions]);

  return (
    <Container maxWidth="md" sx={{ background: 'linear-gradient(120deg, #f0f4f8 0%, #e0e7ef 100%)', minHeight: '100vh', py: 2 }}>
      <Box mt={4}>
        {/* Admin message card with name */}
        <Paper elevation={8} sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          bgcolor: 'linear-gradient(135deg, #6dd5fa 0%, #2980b9 100%)',
          color: '#002244',
          boxShadow: '0 8px 32px 0 rgba(41,128,185,0.18)',
          border: '2px solid',
          borderColor: 'primary.light',
          borderRadius: 6,
          fontWeight: 600,
          fontSize: 18,
          letterSpacing: 1,
          transition: 'box-shadow 0.4s, background 0.4s',
          '&:hover': {
            boxShadow: '0 16px 48px 0 rgba(41,128,185,0.28)',
            bgcolor: 'linear-gradient(135deg, #2980b9 0%, #6dd5fa 100%)',
          },
        }}>
          <Typography
            variant="h5"
            fontWeight={700}
            mb={1}
            sx={{
              letterSpacing: 1,
              background: 'linear-gradient(90deg, #003366 30%, #6dd5fa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: '#111', // Use solid black for text fill
              textShadow: '0 3px 12px rgba(0,0,0,0.25), 0 1px 0 #fff',
            }}
          >
            Welcome, <span style={{ fontWeight: 900, background: 'linear-gradient(90deg, #2980b9 30%, #6dd5fa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: '#111', textShadow: '0 2px 8px rgba(41,128,185,0.18)' }}>{user?.name || 'Admin'}</span>
          </Typography>
          <Typography
            sx={{
              fontSize: 18,
              fontWeight: 500,
              color: '#222', // Changed to solid dark color for readability
              background: 'none',
              WebkitBackgroundClip: 'unset',
              WebkitTextFillColor: 'unset',
              textShadow: 'none',
            }}
          >
            Manage Umuganda attendance, sessions, and Fines Tracking below
          </Typography>
        </Paper>
        {/* AI-powered prediction/severity card */}
        <Paper elevation={8} sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          bgcolor:
            attendanceStats.severity === 'high'
              ? 'linear-gradient(135deg, #ff5858 0%, #f09819 100%)'
              : attendanceStats.severity === 'medium'
              ? 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)'
              : 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
          color:
            attendanceStats.severity === 'high'
              ? '#b71c1c'
              : attendanceStats.severity === 'medium'
              ? '#b26a00'
              : '#185a9d',
          boxShadow:
            attendanceStats.severity === 'high'
              ? '0 8px 32px 0 rgba(255,88,88,0.18)'
              : attendanceStats.severity === 'medium'
              ? '0 8px 32px 0 rgba(255,210,0,0.18)'
              : '0 8px 32px 0 rgba(67,206,162,0.18)',
          border: '2px solid',
          borderColor:
            attendanceStats.severity === 'high'
              ? '#ff5858'
              : attendanceStats.severity === 'medium'
              ? '#ffd200'
              : '#43cea2',
          borderRadius: 6,
          fontWeight: 600,
          fontSize: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          letterSpacing: 1,
          transition: 'box-shadow 0.4s, background 0.4s',
          '&:hover': {
            boxShadow:
              attendanceStats.severity === 'high'
                ? '0 16px 48px 0 rgba(255,88,88,0.28)'
                : attendanceStats.severity === 'medium'
                ? '0 16px 48px 0 rgba(255,210,0,0.28)'
                : '0 16px 48px 0 rgba(67,206,162,0.28)',
            bgcolor:
              attendanceStats.severity === 'high'
                ? 'linear-gradient(135deg, #f09819 0%, #ff5858 100%)'
                : attendanceStats.severity === 'medium'
                ? 'linear-gradient(135deg, #ffd200 0%, #f7971e 100%)'
                : 'linear-gradient(135deg, #185a9d 0%, #43cea2 100%)',
          },
        }}>
          {attendanceStats.severity === 'high' ? <WarningIcon fontSize="large" sx={{ color: '#b71c1c' }} /> : attendanceStats.severity === 'medium' ? <InfoIcon fontSize="large" sx={{ color: '#b26a00' }} /> : <ThumbUpIcon fontSize="large" sx={{ color: '#185a9d' }} />}
          <Box>
            <Typography variant="h6" fontWeight={700} mb={1} sx={{ letterSpacing: 1 }}>
              Attendance Severity: {attendanceStats.severity.toUpperCase()}
            </Typography>
            <Typography sx={{ fontWeight: 600 }}>Absentee Rate: {(attendanceStats.absenteeRate * 100).toFixed(1)}%</Typography>
            <Typography sx={{ fontWeight: 500 }}>{attendanceStats.suggestion}</Typography>
          </Box>
        </Paper>
        {/* Register Citizen Form */}
        <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          <Typography variant="h6">Register Citizen</Typography>
          <Box component="form" sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }} onSubmit={handleRegisterCitizen}>
            <TextField label="Full Name" name="name" value={citizenForm.name} onChange={handleCitizenChange} required />
            <TextField label="National ID" name="nid" value={citizenForm.nid} onChange={handleCitizenChange} required />
            <TextField label="Phone Number" name="phone" value={citizenForm.phone} onChange={handleCitizenChange} required />
            <TextField label="Village" name="village" value={citizenForm.village} onChange={handleCitizenChange} required />
            <TextField label="Sector" name="sector" value={citizenForm.sector} onChange={handleCitizenChange} required />
            <Button variant="contained" color="primary" type="submit">Register</Button>
          </Box>
          {formError && <Typography color="error" mt={1}>{formError}</Typography>}
          <Box mt={2}>
            <Button variant="outlined" component="label">
              Import Citizens (CSV)
              <input type="file" accept=".csv" hidden onChange={handleCSVImport} />
            </Button>
            <Button variant="text" onClick={handleDownloadCitizensCSV} sx={{ ml: 2 }}>
              Download Citizens (CSV)
            </Button>
          </Box>
        </Paper>
        {/* Citizens Table */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6">All Citizens</Typography>
          <TextField
            placeholder="Search citizens..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ mb: 2, width: '100%' }}
          />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Full Name</TableCell>
                  <TableCell>National ID</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Village</TableCell>
                  <TableCell>Sector</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Password</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCitizens.slice(citizensPage * citizensRowsPerPage, citizensPage * citizensRowsPerPage + citizensRowsPerPage).map((cit: any, idx: number) => (
                  <TableRow key={idx}>
                    {editIdx === idx ? (
                      <>
                        <TableCell><TextField name="fullName" value={editForm.fullName} onChange={handleEditFormChange} size="small" /></TableCell>
                        <TableCell><TextField name="nationalId" value={editForm.nationalId} onChange={handleEditFormChange} size="small" /></TableCell>
                        <TableCell><TextField name="phone" value={editForm.phone} onChange={handleEditFormChange} size="small" /></TableCell>
                        <TableCell><TextField name="village" value={editForm.village} onChange={handleEditFormChange} size="small" /></TableCell>
                        <TableCell><TextField name="sector" value={editForm.sector} onChange={handleEditFormChange} size="small" /></TableCell>
                        <TableCell><TextField name="username" value={editForm.username} InputProps={{ readOnly: true }} size="small" /></TableCell>
                        <TableCell><TextField name="password" value={editForm.password} InputProps={{ readOnly: true }} size="small" /></TableCell>
                        <TableCell>
                          <Button color="success" size="small" onClick={handleSaveEdit} disabled={loadingEdit}>Save</Button>
                          <Button color="inherit" size="small" onClick={() => setEditIdx(null)} disabled={loadingEdit}>Cancel</Button>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{cit.fullName}</TableCell>
                        <TableCell>{cit.nationalId}</TableCell>
                        <TableCell>{cit.phone}</TableCell>
                        <TableCell>{cit.village}</TableCell>
                        <TableCell>{cit.sector}</TableCell>
                        <TableCell>{cit.username}</TableCell>
                        <TableCell>{cit.password}</TableCell>
                        <TableCell>
                          {isAdmin && (
                            <>
                              <Button color="primary" size="small" onClick={() => handleEditCitizen(idx)} disabled={loadingEdit || loadingDelete}>Edit</Button>
                              <Button color="error" size="small" onClick={() => setDeleteIdx(idx)} disabled={loadingEdit || loadingDelete}>Delete</Button>
                            </>
                          )}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredCitizens.length}
            page={citizensPage}
            onPageChange={handleCitizensChangePage}
            rowsPerPage={citizensRowsPerPage}
            onRowsPerPageChange={handleCitizensChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Paper>
        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteIdx !== null} onClose={() => setDeleteIdx(null)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>Are you sure you want to delete this citizen?</DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteIdx(null)} disabled={loadingDelete}>Cancel</Button>
            <Button onClick={() => deleteIdx !== null && handleDeleteCitizen(deleteIdx)} color="error" disabled={loadingDelete}>
              {loadingDelete ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      {/* Session Management */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">Schedule Umuganda Session</Typography>
        <Box component="form" sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }} onSubmit={handleAddSession}>
          <TextField label="Date" name="date" type="date" value={newSession.date} onChange={e => setNewSession({ ...newSession, date: e.target.value })} InputLabelProps={{ shrink: true }} required />
          <TextField label="Location" name="location" value={newSession.location} onChange={e => setNewSession({ ...newSession, location: e.target.value })} required />
          <Button variant="contained" color="primary" type="submit" disabled={!isCitizensLoaded}>Add Session</Button>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">Filter Sessions</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
          <TextField label="Date" type="date" value={sessionFilter} onChange={e => setSessionFilter(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="Location" value={locationFilter} onChange={e => setLocationFilter(e.target.value)} />
        </Stack>
        {filteredSessions.map(session => (
          <Box key={session.sessionId} mb={4}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1" fontWeight={700} mb={1}>
                Session: {new Date(session.date).toLocaleDateString()} - {session.location}
              </Typography>
              {isAdmin && (
                <Button color="error" size="small" startIcon={<DeleteIcon />} onClick={() => handleDeleteSession(session.sessionId)}>
                  Delete Session
                </Button>
              )}
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Citizen Name</TableCell>
                    <TableCell>National ID</TableCell>
                    <TableCell>Attendance</TableCell>
                    <TableCell>Fine</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(session.attendance || [])
                    .filter(a => citizens.some(c => c.nid === a.citizenNid))
                    .slice((attendancePage[session.sessionId] || 0) * (attendanceRowsPerPage[session.sessionId] || 5), (attendancePage[session.sessionId] || 0) * (attendanceRowsPerPage[session.sessionId] || 5) + (attendanceRowsPerPage[session.sessionId] || 5))
                    .map(a => {
                      const citizen = (citizens || []).find(c =>
                        String(c.nationalId).trim() === String(a.citizenNid).trim() ||
                        String(c.nid).trim() === String(a.citizenNid).trim()
                      );
                      return (
                        <TableRow key={a.citizenNid}>
                          <TableCell>{citizen?.fullName || citizen?.name || a.citizenNid}</TableCell>
                          <TableCell>{citizen?.nationalId || citizen?.nid || a.citizenNid}</TableCell>
                          <TableCell>
                            <Button size="small" color={a.status === 'Present' ? 'success' : 'error'} variant={a.status === 'Present' ? 'contained' : 'outlined'} onClick={() => handleAttendanceChange(session.sessionId, a.citizenNid, a.status === 'Present' ? 'Absent' : 'Present')}>
                              {a.status}
                            </Button>
                          </TableCell>
                          <TableCell>{a.status === 'Absent' ? (a.fine || 5000) : '-'}</TableCell>
                          <TableCell>
                            {a.status === 'Absent' ? (
                              <Button size="small" color={a.paymentStatus === 'Paid' ? 'success' : 'warning'} variant={a.paymentStatus === 'Paid' ? 'contained' : 'outlined'} onClick={() => handlePaymentChange(session.sessionId, a.citizenNid, a.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid')}>
                                {a.paymentStatus || 'Unpaid'}
                              </Button>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Button color="error" size="small" onClick={() => handleDeleteAttendance(session.sessionId, a.citizenNid)}>
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredAttendanceForSession(session).length}
              page={attendancePage[session.sessionId] || 0}
              onPageChange={(e, newPage) => handleAttendanceChangePage(session.sessionId, newPage)}
              rowsPerPage={attendanceRowsPerPage[session.sessionId] || 5}
              onRowsPerPageChange={e => handleAttendanceChangeRowsPerPage(session.sessionId, parseInt(e.target.value, 10))}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Box>
        ))}
      </Paper>
      {/* Export Data & Analytics */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={3}>
        <Box flex={1}>
          <Card sx={{ p: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" mb={2} color="primary">Export Data</Typography>
              <Button variant="contained" color="primary" startIcon={<DownloadIcon />} onClick={handleExportCSV}>
                Export Fines (CSV)
              </Button>
              {/* Summary Table */}
              <Box mt={3}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'primary.main', fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ color: 'primary.main', fontWeight: 700 }}>Absent</TableCell>
                        <TableCell sx={{ color: 'primary.main', fontWeight: 700 }}>Present</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sessionSummary.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{row.date}</TableCell>
                          <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>{row.absent}</TableCell>
                          <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>{row.present}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box flex={1}>
          <Card sx={{ p: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" mb={2}>Attendance Trends</Typography>
              <Box height={200}>
                <Line data={trendsData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Stack>
      {/* Fines Management */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6">Fines Management</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Override</TableCell>
                <TableCell>Delete</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fines.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{row.user}</TableCell>
                  <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                  <TableCell>{row.amount}</TableCell>
                  <TableCell>
                    {row.status === 'Paid' ? (
                      <Chip icon={<CheckCircleIcon color="success" />} label="Paid" color="success" />
                    ) : (
                      <Chip icon={<CancelIcon color="warning" />} label="Unpaid" color="warning" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="outlined" color={row.status === 'Paid' ? 'success' : 'warning'} size="small" startIcon={<EditIcon />} onClick={() => handleOverride(row)}>
                      {row.status === 'Paid' ? 'Mark Unpaid' : 'Mark Paid'}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => handleDeleteFine(row.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarColor} sx={{ width: '100%' }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
      {/* Password Dialog after registration */}
      {/* This dialog is no longer needed as password is generated and displayed in the table */}
    </Container>
  );
};

export default AdminPanel; 