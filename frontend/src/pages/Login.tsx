import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { authService } from '../services/auth';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuthStore();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authService.login({
                email: formData.email,
                password: formData.password,
            });

            // 保存access token到localStorage
            localStorage.setItem('access_token', response.accessToken);

            // refreshToken通过HttpOnly Cookie自动管理，不需要保存到localStorage

            // 保存用户信息和token到store
            login({
                user: response.user,
                accessToken: response.accessToken,
                refreshToken: '', // refreshToken在Cookie中，不需要这里传递
            });

            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || '登录失败，请检查邮箱和密码');
        } finally {
            setLoading(false);
        }
    };

    const handleWeChatLogin = () => {
        // 微信登录预留接口
        // 未来实现：跳转到微信授权页面或调用微信SDK
        alert('微信登录功能开发中，敬请期待！\n\n未来将支持：\n- 微信扫码登录\n- 微信小程序一键登录');
    };

    const handleRegister = () => {
        navigate('/register');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                {/* Logo和标题 */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🌟</div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">启玩星球</h1>
                    <p className="text-gray-600">开启孩子的快乐学习之旅</p>
                </div>

                {/* 错误提示 */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* 登录表单 */}
                <form onSubmit={handleEmailLogin} className="space-y-6">
                    {/* 邮箱输入 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            邮箱地址
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            placeholder="请输入邮箱"
                        />
                    </div>

                    {/* 密码输入 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            密码
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            placeholder="请输入密码"
                        />
                    </div>

                    {/* 登录按钮 */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '登录中...' : '登录'}
                    </button>
                </form>

                {/* 分割线 */}
                <div className="flex items-center my-6">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="px-4 text-sm text-gray-500">或</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                </div>

                {/* 微信登录按钮 */}
                <button
                    onClick={handleWeChatLogin}
                    className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition flex items-center justify-center space-x-2"
                >
                    <span className="text-xl">💚</span>
                    <span>微信登录</span>
                </button>

                {/* 注册链接 */}
                <div className="text-center mt-6">
                    <span className="text-gray-600">还没有账号？</span>
                    <button
                        onClick={handleRegister}
                        className="text-purple-600 font-semibold hover:text-purple-700 ml-1 focus:outline-none focus:underline"
                    >
                        立即注册
                    </button>
                </div>

                {/* 使用提示 */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                        💡 <strong>测试账号：</strong>
                        <br />
                        邮箱：test@example.com
                        <br />
                        密码：password123
                    </p>
                </div>
            </div>
        </div>
    );
}
