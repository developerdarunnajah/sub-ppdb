import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './login';
import Multiperan from './multiperan';
import DashboardClientPPDB from './dashboardClientPPDB'; // <--- Import ini
import DashboardAdminPPDB from './dashboardAdminPPDB';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/multiperan" element={<Multiperan />} />
        <Route path="/dashboardClientPPDB" element={<DashboardClientPPDB />} />
        <Route path="/dashboardAdminPPDB" element={<DashboardAdminPPDB />} />
      </Routes>
    </Router>
  );
}

export default App;