import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import SendMoney from './pages/SendMoney';
import TransactionHistory from './pages/TransactionHistory';
import Blockchain from './pages/Blockchain';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import './index.css';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppContent() {
    const { isAuthenticated } = useAuth();

    return (
        <Router>
            {isAuthenticated && <Navbar />}
            <div className={isAuthenticated ? "pt-16" : ""}>
                <Routes>
                    <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
                    <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Signup />} />

                    <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/send" element={<PrivateRoute><SendMoney /></PrivateRoute>} />
                    <Route path="/transactions" element={<PrivateRoute><TransactionHistory /></PrivateRoute>} />
                    <Route path="/blockchain" element={<PrivateRoute><Blockchain /></PrivateRoute>} />
                    <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                    <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />

                    <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
                </Routes>
            </div>
        </Router>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
