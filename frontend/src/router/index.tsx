import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import GroupList from '@/pages/GroupList';
import GroupDetail from '@/pages/GroupDetail';
import JoinGroup from '@/pages/JoinGroup';
import ProtectedRoute from './ProtectedRoute';

function Router() {
    return (
        <Routes>
            {/* 首页 */}
            <Route path="/" element={<Home />} />

            {/* 认证路由 */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* 需要认证的路由 */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/groups"
                element={
                    <ProtectedRoute>
                        <GroupList />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/groups/:groupId"
                element={
                    <ProtectedRoute>
                        <GroupDetail />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/join/:code"
                element={
                    <ProtectedRoute>
                        <JoinGroup />
                    </ProtectedRoute>
                }
            />

            {/* 默认重定向到首页 */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default Router;
