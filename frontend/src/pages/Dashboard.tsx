import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';

function Dashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            logout();
            localStorage.removeItem('access_token');
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
            {/* Header */}
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">启玩星球</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-600">
                            欢迎，{user?.name || user?.email}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                        >
                            登出
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6">
                        游戏大厅
                    </h2>

                    {/* 游戏类型 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {['拖拽配对', '记忆翻牌', '数数游戏', '拼图游戏', '分类排序'].map((game) => (
                            <div
                                key={game}
                                className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl p-6 text-white hover:scale-105 transition-transform cursor-pointer"
                            >
                                <h3 className="text-xl font-bold mb-2">{game}</h3>
                                <p className="text-sm opacity-90">适合3-6岁儿童</p>
                            </div>
                        ))}
                    </div>

                    {/* 我的群组 */}
                    <div className="mt-8">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">我的群组</h3>
                        <button
                            onClick={() => navigate('/groups')}
                            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg"
                        >
                            查看群组
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;
