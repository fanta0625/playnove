import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

interface Group {
    id: string;
    name: string;
    description: string;
    type: string;
    creator: { id: string; name: string; email: string };
    members: Array<{
        id: string;
        role: string;
        canInvite: boolean;
        canAssign: boolean;
        user: { id: string; name: string; email: string };
    }>;
    _count: { members: number; tasks: number };
}

interface Invitation {
    id: string;
    code: string;
    maxUses: number;
    usedCount: number;
    expiresAt: string | null;
    isActive: boolean;
    defaultRole: string;
    createdAt: string;
}

function GroupDetail() {
    const { groupId } = useParams<{ groupId: string }>();
    const [group, setGroup] = useState<Group | null>(null);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [token] = useState(() => localStorage.getItem('token') || '');

    useEffect(() => {
        fetchGroupDetail();
        fetchInvitations();
    }, [groupId]);

    const fetchGroupDetail = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/groups/${groupId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setGroup(data);
            }
        } catch (error) {
            console.error('获取群组详情失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvitations = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/groups/${groupId}/invitations`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setInvitations(data);
            }
        } catch (error) {
            console.error('获取邀请码失败:', error);
        }
    };

    const createInvitation = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/groups/${groupId}/invitations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    maxUses: 100,
                    defaultRole: '成员',
                }),
            });
            if (response.ok) {
                const data = await response.json();
                const link = `${window.location.origin}/join/${data.code}`;
                setInviteLink(link);
                setShowInviteModal(true);
                fetchInvitations();
            }
        } catch (error) {
            console.error('创建邀请码失败:', error);
            alert('创建邀请码失败');
        }
    };

    const copyInviteLink = () => {
        navigator.clipboard.writeText(inviteLink);
        alert('邀请链接已复制到剪贴板！');
    };

    const updateMemberRole = async (memberId: string, role: string, canInvite: boolean, canAssign: boolean) => {
        try {
            const response = await fetch(`http://localhost:3001/api/groups/members/${memberId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ role, canInvite, canAssign }),
            });
            if (response.ok) {
                fetchGroupDetail();
                alert('权限更新成功');
            }
        } catch (error) {
            console.error('更新权限失败:', error);
            alert('更新权限失败');
        }
    };

    const removeMember = async (memberId: string) => {
        if (!confirm('确定要移除这个成员吗？')) return;

        try {
            const response = await fetch(`http://localhost:3001/api/groups/members/${memberId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                fetchGroupDetail();
                alert('成员已移除');
            }
        } catch (error) {
            console.error('移除成员失败:', error);
            alert('移除成员失败');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-2xl text-gray-600">加载中...</div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-2xl text-gray-600 mb-4">群组不存在</div>
                    <Link to="/" className="text-primary-500 hover:text-primary-600">返回首页</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <header className="mb-8">
                    <Link to="/groups" className="text-gray-600 hover:text-gray-800 mb-4 inline-block">
                        ← 返回群组列表
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{group.name}</h1>
                    <p className="text-gray-600">{group.description}</p>
                </header>

                {/* Group Info */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-3xl font-bold text-primary-500">{group._count.members}</div>
                            <div className="text-gray-600">成员</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-secondary-500">{group._count.tasks}</div>
                            <div className="text-gray-600">任务</div>
                        </div>
                        <div>
                            <div className="text-lg font-semibold text-gray-800">{group.type}</div>
                            <div className="text-gray-600">类型</div>
                        </div>
                        <div>
                            <div className="text-lg font-semibold text-gray-800">{group.creator.name}</div>
                            <div className="text-gray-600">创建者</div>
                        </div>
                    </div>
                </div>

                {/* Invite Section */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">邀请成员</h2>
                    <button
                        onClick={createInvitation}
                        className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-full transition-colors"
                    >
                        生成邀请链接
                    </button>

                    {invitations.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">现有邀请码</h3>
                            <div className="space-y-2">
                                {invitations.map((inv) => (
                                    <div key={inv.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                        <div>
                                            <div className="font-mono text-sm text-gray-800">{inv.code}</div>
                                            <div className="text-xs text-gray-600">
                                                使用: {inv.usedCount}/{inv.maxUses} |
                                                {inv.expiresAt ? ` 过期: ${new Date(inv.expiresAt).toLocaleDateString()}` : ' 永久'}
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${inv.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {inv.isActive ? '有效' : '已失效'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Members Section */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">成员管理</h2>
                    <div className="space-y-4">
                        {group.members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between border-b pb-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                        <span className="text-lg font-semibold text-primary-600">
                                            {member.user.name[0]}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-800">{member.user.name}</div>
                                        <div className="text-sm text-gray-600">{member.user.email}</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <select
                                        value={member.role}
                                        onChange={(e) => updateMemberRole(member.id, e.target.value, member.canInvite, member.canAssign)}
                                        className="border rounded-lg px-3 py-2 text-sm"
                                    >
                                        <option value="成员">成员</option>
                                        <option value="管理员">管理员</option>
                                        <option value="教师">教师</option>
                                    </select>
                                    <label className="flex items-center space-x-1 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={member.canInvite}
                                            onChange={(e) => updateMemberRole(member.id, member.role, e.target.checked, member.canAssign)}
                                            className="rounded"
                                        />
                                        <span>邀请</span>
                                    </label>
                                    <label className="flex items-center space-x-1 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={member.canAssign}
                                            onChange={(e) => updateMemberRole(member.id, member.role, member.canInvite, e.target.checked)}
                                            className="rounded"
                                        />
                                        <span>分配</span>
                                    </label>
                                    {member.user.id !== group.creator.id && (
                                        <button
                                            onClick={() => removeMember(member.id)}
                                            className="text-red-500 hover:text-red-700 text-sm"
                                        >
                                            移除
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Invite Link Modal */}
                {showInviteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">邀请链接已生成</h3>
                            <div className="bg-gray-100 p-4 rounded-lg mb-4 break-all">
                                <p className="text-sm text-gray-600">{inviteLink}</p>
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    onClick={copyInviteLink}
                                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-full transition-colors"
                                >
                                    复制链接
                                </button>
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-full transition-colors"
                                >
                                    关闭
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default GroupDetail;
