import React, { createContext, useContext, useState, ReactNode } from 'react';
import axios from 'axios';

export type Citizen = {
  name?: string;
  nid?: string; 
  fullName?: string; // for backend
  nationalId?: string; // for backend
  phone: string;
  village: string;
  sector: string;
  username: string;
  password: string;
  active?: boolean;
  _id?: string; // Added for backend interaction
};

interface CitizenContextType {
  citizens: Citizen[];
  addCitizen: (citizen: Citizen) => void;
  updateCitizen: (idx: number, citizen: Citizen) => void;
  deleteCitizen: (idx: number) => void;
  setCitizens: (citizens: Citizen[]) => void;
  refreshCitizens: () => Promise<void>;
}

const CitizenContext = createContext<CitizenContextType | undefined>(undefined);

const initialCitizens: Citizen[] = (() => {
  const stored = localStorage.getItem('citizens');
  if (stored) return JSON.parse(stored);
  return [
    { name: 'EVODE MUYISINGIZE', nid: '1200380097272049', phone: '0791783308', village: 'RURAMBI', sector: 'MANAYAGIRO', username: '120080046466466', password: 'UATS@001', active: true },
    { name: 'AMIZERO Patrick', nid: '120080046466467', phone: '0791783308', village: 'KIYOVU', sector: 'KIGALI', username: '120080046466467', password: 'UATS@002', active: true },
  ];
})();

export const CitizenProvider = ({ children }: { children: ReactNode }) => {
  const [citizens, setCitizens] = useState<Citizen[]>([]);

  // Fetch citizens from backend on mount
  React.useEffect(() => {
    const fetchCitizens = async () => {
      try {
        const res = await axios.get('https://uats-backend.onrender.com/api/citizens');
        setCitizens(
          (res.data as Citizen[]).map(c => ({
            ...c,
            nationalId: c.nationalId || c.nid,
            nid: c.nid || c.nationalId,
            fullName: c.fullName || c.name,
            name: c.name || c.fullName,
          }))
        );
      } catch (err) {
        console.error('Error fetching citizens:', err);
      }
    };
    fetchCitizens();
  }, []);

  const refreshCitizens = async () => {
    try {
      const res = await axios.get('https://uats-backend.onrender.com/api/citizens');
      setCitizens(
        (res.data as Citizen[]).map(c => ({
          ...c,
          nationalId: c.nationalId || c.nid,
          nid: c.nid || c.nationalId,
          fullName: c.fullName || c.name,
          name: c.name || c.fullName,
        }))
      );
    } catch (err) {
      console.error('Error refreshing citizens:', err);
    }
  };

  const addCitizen = async (citizen: Citizen) => {
    try {
      await axios.post('https://uats-backend.onrender.com/api/citizens', citizen);
      await refreshCitizens();
    } catch (err) {
      console.error('Error adding citizen:', err);
      throw err;
    }
  };
  
  const updateCitizen = async (idx: number, citizen: Citizen) => {
    try {
      const id = citizens[idx]?._id;
      if (!id) return;
      await axios.put(`https://uats-backend.onrender.com/api/citizens/${id}`, citizen);
      await refreshCitizens();
    } catch (err) {
      console.error('Error updating citizen:', err);
      throw err;
    }
  };
  
  const deleteCitizen = async (idx: number) => {
    try {
      const id = citizens[idx]?._id;
      if (!id) return;
      await axios.delete(`https://uats-backend.onrender.com/api/citizens/${id}`);
      await refreshCitizens();
    } catch (err) {
      console.error('Error deleting citizen:', err);
      throw err;
    }
  };

  return (
    <CitizenContext.Provider value={{ citizens, addCitizen, updateCitizen, deleteCitizen, setCitizens, refreshCitizens }}>
      {children}
    </CitizenContext.Provider>
  );
};

export const useCitizens = () => {
  const stored = useContext(CitizenContext);
  if (!stored) throw new Error('useCitizens must be used within a CitizenProvider');
  return stored;
}; 
export default CitizenContext;