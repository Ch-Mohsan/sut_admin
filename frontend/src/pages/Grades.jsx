import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { StudentContext } from '../context/StudentContext';
import DeleteIcon from '@mui/icons-material/Delete';

// Helper to get CSRF token from cookies
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

const calculateGrade = (marks) => {
  if (marks >= 90) return 'A+';
  if (marks >= 80) return 'A';
  if (marks >= 70) return 'B+';
  if (marks >= 60) return 'B';
  if (marks >= 50) return 'C+';
  if (marks >= 40) return 'C';
  if (marks >= 30) return 'D';
  return 'F';
};

const Grades = () => {
  const { students, loading: studentsLoading } = useContext(StudentContext);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [grades, setGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newGrade, setNewGrade] = useState({
    subject: '',
    marks: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [existingGrade, setExistingGrade] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateGrade, setUpdateGrade] = useState({ marks: '' });

  // Group grades by subject
  const gradesBySubject = grades.reduce((acc, grade) => {
    if (!acc[grade.subject]) {
      acc[grade.subject] = [];
    }
    acc[grade.subject].push(grade);
    return acc;
  }, {});

  // Calculate average for each subject
  const subjectAverages = Object.entries(gradesBySubject).reduce((acc, [subject, grades]) => {
    const total = grades.reduce((sum, grade) => sum + grade.marks, 0);
    acc[subject] = (total / grades.length).toFixed(2);
    return acc;
  }, {});

  useEffect(() => {
    if (selectedStudent) {
      const fetchGrades = async () => {
        setLoadingGrades(true);
        setError('');
        setSuccess('');
        try {
          const response = await fetch(`http://localhost:8000/api/grades/?student_id=${selectedStudent}`, {
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('Failed to fetch grades');
          }

          const data = await response.json();
          setGrades(data);
        } catch (err) {
          console.error('Error fetching grades:', err);
          setError('Failed to load grades.');
        } finally {
          setLoadingGrades(false);
        }
      };

      fetchGrades();
    } else {
      setGrades([]);
    }
  }, [selectedStudent]);

  const handleStudentChange = (event) => {
    setSelectedStudent(event.target.value);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewGrade({ ...newGrade, [name]: value });
  };

  const handleSubmitGrade = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    setExistingGrade(null);

    try {
      // Ensure CSRF token is set
      await fetch('http://localhost:8000/api/csrf-token/', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });

      const response = await fetch('http://localhost:8000/api/grades/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCSRFToken(),
        },
        credentials: 'include',
        body: JSON.stringify({
          student_id: selectedStudent,
          subject: newGrade.subject,
          marks: parseInt(newGrade.marks),
          grade: calculateGrade(parseInt(newGrade.marks))
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error && data.existing_grade) {
          setExistingGrade(data.existing_grade);
          throw new Error(data.error);
        }
        throw new Error(data.detail || 'Failed to save grade');
      }

      setGrades([...grades, data]);
      setNewGrade({
        subject: '',
        marks: '',
      });
      setSuccess('Grade saved successfully!');
    } catch (err) {
      console.error('Error saving grade:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGrade = async () => {
    if (!existingGrade) return;
    
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Ensure CSRF token is set
      await fetch('http://localhost:8000/api/csrf-token/', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });

      const response = await fetch(`http://localhost:8000/api/grades/${existingGrade.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCSRFToken(),
        },
        credentials: 'include',
        body: JSON.stringify({
          student_id: selectedStudent,
          subject: newGrade.subject,
          marks: parseInt(newGrade.marks),
          grade: calculateGrade(parseInt(newGrade.marks))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update grade');
      }

      const updatedGrade = await response.json();
      setGrades(grades.map(g => g.id === updatedGrade.id ? updatedGrade : g));
      setNewGrade({
        subject: '',
        marks: '',
      });
      setExistingGrade(null);
      setSuccess('Grade updated successfully!');
    } catch (err) {
      console.error('Error updating grade:', err);
      setError('Failed to update grade. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateClick = (grade) => {
    setSelectedGrade(grade);
    setUpdateGrade({ marks: grade.marks.toString() });
    setUpdateDialogOpen(true);
  };

  const handleUpdateSubmit = async () => {
    try {
      // Ensure CSRF token is set
      await fetch('http://localhost:8000/api/csrf-token/', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });

      const response = await fetch(`http://localhost:8000/api/grades/${selectedGrade.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCSRFToken(),
        },
        credentials: 'include',
        body: JSON.stringify({
          student_id: selectedGrade.student_id,
          subject: selectedGrade.subject,
          marks: parseInt(updateGrade.marks),
          grade: calculateGrade(parseInt(updateGrade.marks))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update grade');
      }

      const updatedGrade = await response.json();
      setGrades(grades.map(g => g.id === updatedGrade.id ? updatedGrade : g));
      setUpdateDialogOpen(false);
      setSelectedGrade(null);
      setUpdateGrade({ marks: '' });
      setSuccess('Grade updated successfully!');
    } catch (err) {
      console.error('Error updating grade:', err);
      setError('Failed to update grade. Please try again.');
    }
  };

  const handleDeleteGrade = async (gradeId) => {
    if (!window.confirm('Are you sure you want to delete this grade?')) {
      return;
    }

    try {
      // Ensure CSRF token is set
      await fetch('http://localhost:8000/api/csrf-token/', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });

      const response = await fetch(`http://localhost:8000/api/grades/${gradeId}/`, {
        method: 'DELETE',
        headers: {
          'X-CSRFToken': getCSRFToken(),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete grade');
      }

      setGrades(grades.filter(g => g.id !== gradeId));
      setSuccess('Grade deleted successfully!');
    } catch (err) {
      console.error('Error deleting grade:', err);
      setError('Failed to delete grade. Please try again.');
    }
  };

  if (studentsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Grades
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          {existingGrade && (
            <Box mt={2}>
              <Typography variant="body2">
                Existing grade: {existingGrade.marks} marks ({existingGrade.grade})
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpdateGrade}
                sx={{ mt: 1 }}
                disabled={submitting}
              >
                Update Grade
              </Button>
            </Box>
          )}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          {existingGrade ? 'Update Grade' : 'Add New Grade'}
        </Typography>
        <form onSubmit={handleSubmitGrade}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
                <InputLabel>Select Student</InputLabel>
                <Select
                  value={selectedStudent}
                  label="Select Student"
                  onChange={handleStudentChange}
                  disabled={students.length === 0 || submitting}
                >
                  <MenuItem value="">-- Select Student --</MenuItem>
                  {students.map((student) => (
                    <MenuItem key={student.id} value={student.id}>
                      {student.name} ({student.roll_number})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Subject"
                name="subject"
                value={newGrade.subject}
                onChange={handleInputChange}
                fullWidth
                required
                disabled={!selectedStudent || submitting}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                label="Marks"
                name="marks"
                value={newGrade.marks}
                onChange={handleInputChange}
                fullWidth
                required
                type="number"
                disabled={!selectedStudent || submitting}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={!selectedStudent || !newGrade.subject || newGrade.marks === '' || submitting}
              >
                {submitting ? <CircularProgress size={24} color="inherit" /> : 'Save Grade'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {selectedStudent && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Grade History
          </Typography>
          {loadingGrades ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : Object.keys(gradesBySubject).length > 0 ? (
            Object.entries(gradesBySubject).map(([subject, subjectGrades]) => (
              <Box key={subject} sx={{ mb: 4 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  {subject} - Average: {subjectAverages[subject]}%
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Marks</TableCell>
                        <TableCell>Grade</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {subjectGrades.map((grade) => (
                        <TableRow key={grade.id}>
                          <TableCell>{new Date(grade.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>{grade.marks}</TableCell>
                          <TableCell>{grade.grade}</TableCell>
                          <TableCell sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleUpdateClick(grade)}
                            >
                              Update
                            </Button>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDeleteGrade(grade.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))
          ) : (
            <Typography>No grades found for this student.</Typography>
          )}
        </Paper>
      )}

      {/* Update Grade Dialog */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)}>
        <DialogTitle>Update Grade</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Student: {selectedGrade?.student_name}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Subject: {selectedGrade?.subject}
            </Typography>
            <TextField
              label="Marks"
              type="number"
              value={updateGrade.marks}
              onChange={(e) => setUpdateGrade({ marks: e.target.value })}
              fullWidth
              margin="normal"
              inputProps={{ min: 0, max: 100 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateSubmit} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Grades;