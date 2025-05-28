import { useState, useEffect, useContext } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8000/api/students/';

const Students = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    roll_number: '',
    class_name: '',
    email: '',
  });
  const [editId, setEditId] = useState(null);

  // Function to get CSRF token from cookies
  const getCSRFToken = () => {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  const fetchStudents = async () => {
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(API_URL, {
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCSRFToken(),
        },
      });

      console.log('Response status:', response.status);
      if (response.status === 401 || response.status === 403) {
        console.log('Unauthorized or forbidden, redirecting to login');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      console.log('Students data:', data);
      setStudents(data);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [isAuthenticated, navigate]);

  const handleClickOpen = (student) => {
    if (student) {
      setFormData({
        name: student.name,
        roll_number: student.roll_number,
        class_name: student.class_name,
        email: student.email,
      });
      setEditId(student.id);
    } else {
      setFormData({ name: '', roll_number: '', class_name: '', email: '' });
      setEditId(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({ name: '', roll_number: '', class_name: '', email: '' });
    setEditId(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      console.log('Not authenticated for submit');
      navigate('/login');
      return;
    }

    try {
      const url = editId ? `${API_URL}${editId}/` : API_URL;
      const method = editId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCSRFToken(),
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.status === 401 || response.status === 403) {
        console.log('Unauthorized or forbidden during submit, redirecting to login');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error('Failed to save student');
      }

      const data = await response.json();
      if (editId) {
        setStudents(prev => prev.map(s => s.id === editId ? data : s));
      } else {
        setStudents(prev => [...prev, data]);
      }
      handleClose();
      // Refresh the students list
      fetchStudents();
    } catch (err) {
      console.error('Error saving student:', err);
      setError('Failed to save student. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!isAuthenticated) {
      console.log('Not authenticated for delete');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${API_URL}${id}/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCSRFToken(),
        },
      });

      if (response.status === 401 || response.status === 403) {
        console.log('Unauthorized or forbidden during delete, redirecting to login');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to delete student');
      }

      setStudents(prev => prev.filter(s => s.id !== id));
      // Refresh the students list
      fetchStudents();
    } catch (err) {
      console.error('Error deleting student:', err);
      setError('Failed to delete student. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Students</h2>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleClickOpen()}
        >
          Add Student
        </Button>
      </div>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Roll Number</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.roll_number}</TableCell>
                <TableCell>{student.class_name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleClickOpen(student)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(student.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editId ? 'Edit Student' : 'Add New Student'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Roll Number"
            fullWidth
            value={formData.roll_number}
            onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Class"
            fullWidth
            value={formData.class_name}
            onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editId ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Students; 