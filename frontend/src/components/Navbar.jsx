import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <SchoolIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Student Management System
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="inherit" component={Link} to="/">
            Dashboard
          </Button>
          <Button color="inherit" component={Link} to="/students">
            Students
          </Button>
          <Button color="inherit" component={Link} to="/attendance">
            Attendance
          </Button>
          <Button color="inherit" component={Link} to="/grades">
            Grades
          </Button>
          <Button color="inherit" component={Link} to="/login">
            Login
          </Button>
          <Button color="inherit" component={Link} to="/signup">
            SignUp
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 