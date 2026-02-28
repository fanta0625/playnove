import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import GroupList from '@/pages/GroupList';
import GroupDetail from '@/pages/GroupDetail';
import JoinGroup from '@/pages/JoinGroup';

function Router() {
    return (
        <Routes>
            {/* 首页 */}
            <Route path="/" element={<Home />} />

            {/* 认证路由 */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* 群组路由 */}
            <Route path="/groups" element={<GroupList />} />
            <Route path="/groups/:groupId" element={<GroupDetail />} />
            <Route path="/join/:code" element={<JoinGroup />} />

            {/* 默认重定向到首页 */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default Router;
