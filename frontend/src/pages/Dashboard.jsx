import { useState, useEffect, useContext } from 'react';
import {
  Container,
  Grid,
  Paper,
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material';
import {
  People as PeopleIcon,
  EventNote as EventNoteIcon,
  Grade as GradeIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
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

const StatCard = ({ title, value }) => (
  <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
    <Typography component="h2" variant="h6" color="primary" gutterBottom>
      {title}
    </Typography>
    <Typography component="p" variant="h4">
      {value}
    </Typography>
  </Paper>
);

const Dashboard = () => {
  const { students, loading: studentsLoading } = useContext(StudentContext);
  const [attendance, setAttendance] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateGrade, setUpdateGrade] = useState({ marks: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const attendanceResponse = await fetch(`http://localhost:8000/api/attendance/?date=${today}`, {
          credentials: 'include',
        });
        const attendanceData = await attendanceResponse.json();
        setAttendance(attendanceData);

        const allAttendanceResponse = await fetch('http://localhost:8000/api/attendance/', {
          credentials: 'include',
        });
        const allAttendanceData = await allAttendanceResponse.json();
        console.log('All Attendance Data from API:', allAttendanceData);
        setAllAttendance(allAttendanceData);

        const gradesResponse = await fetch('http://localhost:8000/api/grades/', {
          credentials: 'include',
        });
        const gradesData = await gradesResponse.json();
        setGrades(gradesData);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const studentAttendanceStats = students.map(student => {
    const studentAttendance = allAttendance.filter(a => a.student === student.id);
    const totalPresent = studentAttendance.filter(a => a.is_present).length;
    const totalAbsent = studentAttendance.filter(a => !a.is_present).length;
    const attendancePercentage = studentAttendance.length > 0 
      ? ((totalPresent / studentAttendance.length) * 100).toFixed(1)
      : 0;

    return {
      id: student.id,
      name: student.name,
      rollNumber: student.roll_number,
      totalPresent,
      totalAbsent,
      attendancePercentage
    };
  });

  studentAttendanceStats.sort((a, b) => b.attendancePercentage - a.attendancePercentage);

  const totalMarks = grades.reduce((sum, grade) => sum + grade.marks, 0);
  const averageGrade = grades.length > 0 ? (totalMarks / grades.length).toFixed(2) : 'N/A';

  const subjectAverages = grades.reduce((acc, grade) => {
    if (!acc[grade.subject]) {
      acc[grade.subject] = { total: 0, count: 0 };
    }
    acc[grade.subject].total += grade.marks;
    acc[grade.subject].count += 1;
    return acc;
  }, {});

  const subjectAveragesArray = Object.entries(subjectAverages).map(([subject, data]) => ({
    subject,
    average: (data.total / data.count).toFixed(2)
  }));

  subjectAveragesArray.sort((a, b) => b.average - a.average);

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

  if (loading || studentsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <StatCard title="Total Students" value={students.length} />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard title="Present Today" value={attendance.filter(a => a.is_present).length} />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard title="Absent Today" value={attendance.filter(a => !a.is_present).length} />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard title="Overall Average" value={`${averageGrade}%`} />
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Student Attendance Statistics
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Roll Number</TableCell>
                    <TableCell align="right">Total Present</TableCell>
                    <TableCell align="right">Total Absent</TableCell>
                    <TableCell align="right">Attendance %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {studentAttendanceStats.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.rollNumber}</TableCell>
                      <TableCell align="right">{student.totalPresent}</TableCell>
                      <TableCell align="right">{student.totalAbsent}</TableCell>
                      <TableCell align="right">
                        <Typography
                          color={
                            student.attendancePercentage >= 75 ? 'success.main' :
                            student.attendancePercentage >= 60 ? 'warning.main' :
                            'error.main'
                          }
                        >
                          {student.attendancePercentage}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Subject-wise Averages
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell align="right">Average</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subjectAveragesArray.map(({ subject, average }) => (
                    <TableRow key={subject}>
                      <TableCell>{subject}</TableCell>
                      <TableCell align="right">{average}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Recent Grades
            </Typography>
            {error && grades.length === 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Marks</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {grades.slice(0, 5).map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell>{grade.student_name}</TableCell>
                      <TableCell>{grade.subject}</TableCell>
                      <TableCell>{grade.marks}</TableCell>
                      <TableCell>{grade.grade}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleUpdateClick(grade)}
                          sx={{ mr: 1 }}
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
                  {grades.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No grades available.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

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
      </Grid>
    </Container>
  );
};

export default Dashboard; 