import { createContext, useState, useEffect } from 'react';

export const StudentContext = createContext();

export const StudentProvider = ({ children }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudents = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/students/', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setStudents(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const addStudent = async (studentData) => {
    try {
      const response = await fetch('http://localhost:8000/api/students/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(studentData),
      });

      if (!response.ok) {
        throw new Error('Failed to add student');
      }

      const newStudent = await response.json();
      setStudents([...students, newStudent]);
      return true;
    } catch (err) {
      console.error('Error adding student:', err);
      setError('Failed to add student');
      return false;
    }
  };

  const updateStudent = async (id, studentData) => {
    try {
      const response = await fetch(`http://localhost:8000/api/students/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(studentData),
      });

      if (!response.ok) {
        throw new Error('Failed to update student');
      }

      const updatedStudent = await response.json();
      setStudents(students.map(student => 
        student.id === id ? updatedStudent : student
      ));
      return true;
    } catch (err) {
      console.error('Error updating student:', err);
      setError('Failed to update student');
      return false;
    }
  };

  const deleteStudent = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/api/students/${id}/`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete student');
      }

      setStudents(students.filter(student => student.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting student:', err);
      setError('Failed to delete student');
      return false;
    }
  };

  return (
    <StudentContext.Provider
      value={{
        students,
        loading,
        error,
        addStudent,
        updateStudent,
        deleteStudent,
        refreshStudents: fetchStudents,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export default StudentContext; 