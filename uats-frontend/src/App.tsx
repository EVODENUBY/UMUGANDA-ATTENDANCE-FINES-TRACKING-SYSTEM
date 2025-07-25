import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AttendanceManagement from './pages/AttendanceManagement';
import AdminPanel from './pages/AdminPanel';
import Payment from './pages/Payment';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CitizenProvider } from './context/CitizenContext';
import { SessionProvider } from './context/SessionContext';

const App: React.FC = () => {
  return (
    <CitizenProvider>
      <AuthProvider>
        <SessionProvider>
          <Router>
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <Navbar />
              <div style={{ flex: 1 }}>
                <Routes>
                  <Route path="/" element={<Login />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={['citizen']}>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/attendance" element={
                    <ProtectedRoute allowedRoles={['leader', 'admin']}>
                      <AttendanceManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['leader', 'official', 'admin']}>
                      <AdminPanel />
                    </ProtectedRoute>
                  } />
                  <Route path="/pay" element={<Payment />} />
                </Routes>
              </div>
              <Footer />
            </div>
          </Router>
        </SessionProvider>
      </AuthProvider>
    </CitizenProvider>
  );
};

export default App;
