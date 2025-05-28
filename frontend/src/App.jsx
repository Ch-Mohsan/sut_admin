import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from './context/AuthContext';
import { StudentProvider } from './context/StudentContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Grades from './pages/Grades';
import Login from './pages/Login';
import "./index.css"
import SignUp from './pages/SignUp';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';

function App() {
  return (
    <AuthProvider>
      <StudentProvider>
        <Router>
          <ThemeProvider theme={theme}>
            <div className="app">
              <Navbar />
              <div className="container mt-4">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="students" element={<Students />} />
                    <Route path="attendance" element={<Attendance />} />
                    <Route path="grades" element={<Grades />} />
                  </Route>
                </Routes>
              </div>
            </div>
          </ThemeProvider>
        </Router>
      </StudentProvider>
    </AuthProvider>
  );
}

export default App;
