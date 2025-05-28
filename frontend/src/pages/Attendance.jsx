import { useState, useContext, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { StudentContext } from '../context/StudentContext';

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

const Attendance = () => {
  const { students, loading } = useContext(StudentContext);
  const [date, setDate] = useState(new Date());
  const [attendance, setAttendance] = useState([]);
  const [historicalAttendance, setHistoricalAttendance] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (students.length > 0) {
      const todayFormatted = date.toISOString().split('T')[0];
      const fetchTodayAttendance = async () => {
        try {
          const response = await fetch(`http://localhost:8000/api/attendance/?date=${todayFormatted}`, {
            credentials: 'include',
          });
          const todayAttendanceData = await response.json();

          const initialAttendance = students.map(student => {
            const existingRecord = todayAttendanceData.find(record => record.student === student.id);
            return {
              id: student.id,
              name: student.name,
              present: existingRecord ? existingRecord.is_present : false,
            };
          });
          setAttendance(initialAttendance);
        } catch (err) {
          console.error('Error fetching today\'s attendance:', err);
          setError('Failed to load today\'s attendance.');
        }
      };
      fetchTodayAttendance();
    } else {
      setAttendance([]);
    }
  }, [students, date]);

  useEffect(() => {
    if (selectedStudent) {
      const fetchHistoricalAttendance = async () => {
        setLoadingHistorical(true);
        setError('');
        setSuccess('');
        try {
          const response = await fetch(`http://localhost:8000/api/attendance/?student_id=${selectedStudent}`, {
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('Failed to fetch historical attendance');
          }

          const data = await response.json();
          setHistoricalAttendance(data);
        } catch (err) {
          console.error('Error fetching historical attendance:', err);
          setError('Failed to load historical attendance.');
        } finally {
          setLoadingHistorical(false);
        }
      };
      fetchHistoricalAttendance();
    } else {
      setHistoricalAttendance([]);
    }
  }, [selectedStudent]);

  const handleAttendanceChange = (id) => {
    setAttendance(
      attendance.map((student) =>
        student.id === id
          ? { ...student, present: !student.present }
          : student
      )
    );
  };

  const handleStudentSelectChange = (event) => {
    setSelectedStudent(event.target.value);
  };

  const handleSubmit = async () => {
    try {
      await fetch('http://localhost:8000/api/csrf-token/', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });

      const response = await fetch('http://localhost:8000/api/attendance/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCSRFToken(),
        },
        credentials: 'include',
        body: JSON.stringify({
          date: date.toISOString().split('T')[0],
          attendance: attendance.map(({ id, present }) => ({
            student_id: id,
            is_present: present,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save attendance');
      }

      setSuccess('Attendance saved successfully!');
      setError('');
      
      if (selectedStudent) {
        const response = await fetch(`http://localhost:8000/api/attendance/?student_id=${selectedStudent}`, {
          credentials: 'include',
        });
         if (response.ok) {
            const data = await response.json();
            setHistoricalAttendance(data);
         }
      }
    } catch (err) {
      console.error('Error saving attendance:', err);
      setError('Failed to save attendance. Please try again.');
      setSuccess('');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Attendance Management
      </Typography>

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

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Mark Attendance for {date.toLocaleDateString()}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Select Date"
              value={date}
              onChange={(newDate) => setDate(newDate || new Date())}
              slotProps={{ textField: { variant: 'outlined' } }}
            />
          </LocalizationProvider>
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Present</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendance.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.id}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={student.present}
                          onChange={() => handleAttendanceChange(student.id)}
                        />
                      }
                      label=""
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={attendance.length === 0}
          >
            Save Attendance for {date.toLocaleDateString()}
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Historical Attendance
        </Typography>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Select Student</InputLabel>
          <Select
            value={selectedStudent}
            label="Select Student"
            onChange={handleStudentSelectChange}
          >
            <MenuItem value="">-- Select Student --</MenuItem>
            {students.map((student) => (
              <MenuItem key={student.id} value={student.id}>
                {student.name} ({student.roll_number})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedStudent && (
          loadingHistorical ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : historicalAttendance.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historicalAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>{record.is_present ? 'Present' : 'Absent'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No historical attendance records found for this student.</Typography>
          )
        )}
      </Paper>
    </Container>
  );
};

export default Attendance; 