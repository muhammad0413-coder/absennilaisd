import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SchoolProfile, SubjectConfig } from '../types';
import { getSchoolProfile, saveSchoolProfile } from '../services/firebase/firestoreService';

export const DEFAULT_SUBJECTS: SubjectConfig[] = [
  { id: 'sub_pabp', name: 'Pendidikan Agama dan Budi Pekerti', code: 'PABP', kkm: 75, classes: ['1','2','3','4','5','6'], active: true },
  { id: 'sub_pp', name: 'Pendidikan Pancasila', code: 'PP', kkm: 75, classes: ['1','2','3','4','5','6'], active: true },
  { id: 'sub_bind', name: 'Bahasa Indonesia', code: 'BIND', kkm: 75, classes: ['1','2','3','4','5','6'], active: true },
  { id: 'sub_mat', name: 'Matematika', code: 'MAT', kkm: 70, classes: ['1','2','3','4','5','6'], active: true },
  { id: 'sub_ipas', name: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', code: 'IPAS', kkm: 75, classes: ['3','4','5','6'], active: true },
  { id: 'sub_pjok', name: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)', code: 'PJOK', kkm: 75, classes: ['1','2','3','4','5','6'], active: true },
  { id: 'sub_sb', name: 'Seni dan Budaya', code: 'SB', kkm: 75, classes: ['1','2','3','4','5','6'], active: true },
  { id: 'sub_bing', name: 'Bahasa Inggris', code: 'BING', kkm: 70, classes: ['1','2','3','4','5','6'], active: true },
  { id: 'sub_mulo', name: 'Muatan Lokal (Bahasa Daerah)', code: 'MLOK', kkm: 75, classes: ['1','2','3','4','5','6'], active: true },
];

interface SchoolContextType {
  schoolProfile: SchoolProfile | null;
  subjects: SubjectConfig[];
  updateProfile: (profile: SchoolProfile) => Promise<void>;
  updateSubjects: (subjects: SubjectConfig[]) => void;
  refreshSchoolData: () => Promise<void>;
  loading: boolean;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(null);
  const [subjects, setSubjects] = useState<SubjectConfig[]>(() => {
    const cached = localStorage.getItem('school_subjects');
    return cached ? JSON.parse(cached) : DEFAULT_SUBJECTS;
  });
  const [loading, setLoading] = useState(true);

  const refreshSchoolData = async () => {
    setLoading(true);
    try {
      const profile = await getSchoolProfile();
      setSchoolProfile(profile);
    } catch (e) {
      console.error('Gagal mengambil profil sekolah:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSchoolData();
  }, []);

  const updateProfile = async (profile: SchoolProfile) => {
    await saveSchoolProfile(profile);
    setSchoolProfile(profile);
  };

  const updateSubjects = (newSubjects: SubjectConfig[]) => {
    setSubjects(newSubjects);
    localStorage.setItem('school_subjects', JSON.stringify(newSubjects));
  };

  return (
    <SchoolContext.Provider
      value={{
        schoolProfile,
        subjects,
        updateProfile,
        updateSubjects,
        refreshSchoolData,
        loading,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export function useSchool() {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
}
