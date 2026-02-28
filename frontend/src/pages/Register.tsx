import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

export default function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
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

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError('请输入姓名');
            return false;
        }
        if (!formData.email.trim()) {
            setError('请输入邮箱');
            return false;
        }
        if (formData.password.length < 6) {
            setError('密码长度至少6位');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('两次输入的密码不一致');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        try {
            const response = await authService.register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });

            // 保存access token到localStorage
            localStorage.setItem('access_token', response.accessToken);

            // refreshToken通过HttpOnly Cookie自动管理，不需要保存到localStorage

            // 登录成功后跳转到首页
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || '注册失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                {/* Logo和标题 */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🚀</div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">注册账号</h1>
                    <p className="text-gray-600">加入启玩星球，开启学习之旅</p>
                </div>

                {/* 错误提示 */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* 注册表单 */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 姓名输入 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            姓名
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            placeholder="请输入您的姓名"
                        />
                    </div>

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
                            placeholder="密码至少6位"
                        />
                    </div>

                    {/* 确认密码输入 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            确认密码
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            placeholder="请再次输入密码"
                        />
                    </div>

                    {/* 注册按钮 */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '注册中...' : '注册'}
                    </button>
                </form>

                {/* 登录链接 */}
                <div className="text-center mt-6">
                    <span className="text-gray-600">已有账号？</span>
                    <button
                        onClick={handleBackToLogin}
                        className="text-green-600 font-semibold hover:text-green-700 ml-1 focus:outline-none focus:underline"
                    >
                        立即登录
                    </button>
                </div>

                {/* 使用说明 */}
                <div className="mt-8 p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                        💡 <strong>注册须知：</strong>
                        <br />
                        • 请填写真实信息，方便老师或家长联系
                        <br />
                        • 密码至少6位，建议使用字母+数字组合
                        <br />
                        • 注册后即可创建或加入群组
                    </p>
                </div>
            </div>
        </div>
    );
}
