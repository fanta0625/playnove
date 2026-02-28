import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Group {
    id: string;
    name: string;
    description: string;
    type: string;
    creatorId: string;
    _count: { members: number; tasks: number };
    createdAt: string;
}

function GroupList() {
    const navigate = useNavigate();
    const [groups, setGroups] = useState<{
        created: Group[];
        joined: Group[];
    }>({ created: [], joined: [] });
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupDesc, setGroupDesc] = useState('');
    const [groupType, setGroupType] = useState('OTHER');
    const [token] = useState(() => localStorage.getItem('token') || '');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchGroups();
    }, [token, navigate]);

    const fetchGroups = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/groups/my', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setGroups(data);
            }
        } catch (error) {
            console.error('获取群组列表失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const createGroup = async () => {
        if (!groupName.trim()) {
            alert('请输入群组名称');
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/api/groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: groupName,
                    description: groupDesc,
                    type: groupType,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setShowCreateModal(false);
                setGroupName('');
                setGroupDesc('');
                setGroupType('OTHER');
                navigate(`/groups/${data.id}`);
            } else {
                alert('创建群组失败');
            }
        } catch (error) {
            console.error('创建群组失败:', error);
            alert('创建群组失败');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-2xl text-gray-600">加载中...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">我的群组</h1>
                        <p className="text-gray-600">管理您的学习群组</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-full transition-colors"
                    >
                        创建群组
                    </button>
                </header>

                {/* Created Groups */}
                {groups.created.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">我创建的</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groups.created.map((group) => (
                                <Link
                                    key={group.id}
                                    to={`/groups/${group.id}`}
                                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                                            <span className="text-2xl">👥</span>
                                        </div>
                                        <span className="text-xs bg-primary-100 text-primary-600 px-3 py-1 rounded-full">
                                            {group.type}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{group.name}</h3>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{group.description}</p>
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>👤 {group._count.members} 成员</span>
                                        <span>📋 {group._count.tasks} 任务</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Joined Groups */}
                {groups.joined.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">我加入的</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groups.joined.map((group) => (
                                <Link
                                    key={group.id}
                                    to={`/groups/${group.id}`}
                                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center">
                                            <span className="text-2xl">👥</span>
                                        </div>
                                        <span className="text-xs bg-secondary-100 text-secondary-600 px-3 py-1 rounded-full">
                                            {group.type}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{group.name}</h3>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{group.description}</p>
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>👤 {group._count.members} 成员</span>
                                        <span>📋 {group._count.tasks} 任务</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty State */}
                {groups.created.length === 0 && groups.joined.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">👥</div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">还没有群组</h3>
                        <p className="text-gray-600 mb-6">创建一个群组开始学习之旅</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-full transition-colors"
                        >
                            创建群组
                        </button>
                    </div>
                )}

                {/* Create Group Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6">创建群组</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        群组名称 *
                                    </label>
                                    <input
                                        type="text"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="输入群组名称"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        群组描述
                                    </label>
                                    <textarea
                                        value={groupDesc}
                                        onChange={(e) => setGroupDesc(e.target.value)}
                                        className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="描述这个群组的用途"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        群组类型
                                    </label>
                                    <select
                                        value={groupType}
                                        onChange={(e) => setGroupType(e.target.value)}
                                        className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="CLASS">班级</option>
                                        <option value="GROUP">学习小组</option>
                                        <option value="FAMILY">家庭</option>
                                        <option value="OTHER">其他</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex space-x-4 mt-6">
                                <button
                                    onClick={createGroup}
                                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-full transition-colors"
                                >
                                    创建
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-full transition-colors"
                                >
                                    取消
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default GroupList;
