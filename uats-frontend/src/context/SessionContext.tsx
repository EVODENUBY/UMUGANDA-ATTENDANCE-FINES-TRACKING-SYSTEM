import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useCitizens } from './CitizenContext';
import axios from 'axios';

export type AttendanceStatus = 'Present' | 'Absent';

export interface SessionAttendance {
  citizenNid: string;
  status: AttendanceStatus;
  fine?: number;
  paymentStatus?: 'Paid' | 'Unpaid';
}

export interface UmugandaSession {
  sessionId: string;
  date: string;
  location: string;
  attendance?: SessionAttendance[];
  deletedAttendanceNids?: string[];
  _id?: string;
}

interface SessionContextType {
  sessions: UmugandaSession[];
  addSession: (session: UmugandaSession) => void;
  updateSession: (sessionId: string, session: UmugandaSession) => void;
  updateAttendance: (sessionId: string, citizenNid: string, status: AttendanceStatus, fine?: number, paymentStatus?: 'Paid' | 'Unpaid') => void;
  deleteSession: (sessionId: string) => void;
  fetchSessions: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<UmugandaSession[]>([]);
  const { citizens } = useCitizens();

  // Fetch sessions from backend on mount and whenever citizens change
  const fetchSessions = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/sessions');
      setSessions(res.data as UmugandaSession[]);
    } catch (err) {
      // handle error
    }
  };
  React.useEffect(() => {
    fetchSessions();
  }, [citizens]);

  // Add session in backend and update state
  const addSession = async (session: Omit<UmugandaSession, 'attendance'> & { attendance?: SessionAttendance[] }) => {
    // Always use the latest citizens list for attendance
    const attendance = (citizens || []).map(c => ({ citizenNid: c.nationalId || c.nid, status: 'Absent' as AttendanceStatus }));
    try {
      const res = await axios.post('http://localhost:8000/api/sessions', { ...session, attendance });
      setSessions(prev => [...prev, res.data as UmugandaSession]);
    } catch (err) {
      // handle error
    }
  };

  // Update session in backend and update state
  const updateSession = async (sessionId: string, session: UmugandaSession) => {
    try {
      const id = session._id || sessionId;
      const res = await axios.put(`http://localhost:8000/api/sessions/${id}`, session);
      setSessions(prev => prev.map(s => s.sessionId === sessionId ? (res.data as UmugandaSession) : s));
    } catch (err) {
      // handle error
    }
  };

  // Update attendance in backend (by updating the session)
  const updateAttendance = async (sessionId: string, citizenNid: string, status: AttendanceStatus, fine?: number, paymentStatus?: 'Paid' | 'Unpaid') => {
    const session = sessions.find(s => s.sessionId === sessionId);
    if (!session) return;
    let updatedAttendance = (session.attendance || []).map(a => {
      if (a.citizenNid === citizenNid) {
        if (status === 'Present') {
          return { ...a, status: 'Present' as AttendanceStatus, fine: undefined, paymentStatus: undefined };
        } else {
          return { ...a, status: 'Absent' as AttendanceStatus, fine: fine ?? 5000, paymentStatus: paymentStatus ?? 'Unpaid' };
        }
      }
      return a;
    }) as SessionAttendance[];
    const updatedSession = { ...session, attendance: updatedAttendance };
    await updateSession(sessionId, updatedSession);
    // Update local state immediately for instant UI feedback
    setSessions(prev => prev.map(s => s.sessionId === sessionId ? updatedSession : s));
  };

  // Delete session in backend and update state
  const deleteSession = async (sessionId: string) => {
    try {
      const session = sessions.find(s => s.sessionId === sessionId);
      const id = session?._id || sessionId;
      await axios.delete(`http://localhost:8000/api/sessions/${id}`);
      setSessions(prev => {
        const updated = prev.filter(s => s._id !== id);
        return updated;
      });
    } catch (err) {
      // handle error
    }
  };

  return (
    <SessionContext.Provider value={{ sessions, addSession, updateSession, updateAttendance, deleteSession, fetchSessions }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessions = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSessions must be used within a SessionProvider');
  return ctx;
}; 