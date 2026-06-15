import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './login';
import Multiperan from './multiperan';
import DashboardClientPPDB from './dashboardClientPPDB'; // <--- Import ini

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/multiperan" element={<Multiperan />} />
        
        {/* Tambahkan rute untuk Dashboard Client */}
        <Route path="/dashboardClientPPDB" element={<DashboardClientPPDB />} />
      </Routes>
    </Router>
  );
}

export default App;