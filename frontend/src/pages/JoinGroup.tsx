import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

function JoinGroup() {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [token] = useState(() => localStorage.getItem('token') || '');

    useEffect(() => {
        if (!token) {
            alert('请先登录');
            navigate('/login');
        }
    }, [token, navigate]);

    const joinGroup = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/groups/invitations/accept/${code}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setTimeout(() => {
                    navigate('/groups');
                }, 2000);
            } else {
                setMessage(data.message || '加入群组失败');
            }
        } catch (error) {
            console.error('加入群组失败:', error);
            setMessage('加入群组失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">👥</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">加入群组</h1>
                    <p className="text-gray-600">使用邀请码加入群组</p>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg mb-6 ${message.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message}
                    </div>
                )}

                <button
                    onClick={joinGroup}
                    disabled={loading}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? '加入中...' : '加入群组'}
                </button>

                <div className="mt-6 text-center">
                    <Link to="/" className="text-gray-600 hover:text-gray-800">
                        返回首页
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default JoinGroup;
