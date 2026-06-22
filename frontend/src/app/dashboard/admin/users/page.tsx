'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { adminService } from '@/lib/services';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Users, Trash2, UserCheck, UserX } from 'lucide-react';

interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  created_at?: string;
}

const ROLE_COLORS: Record<string, string> = {
  client: 'bg-blue-100 text-blue-700',
  driver: 'bg-amber-100 text-amber-700',
  admin:  'bg-red-100 text-red-700',
};

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!loading && user?.role !== 'admin') router.replace('/auth/login');
  }, [user, loading, router]);

  const load = () => {
    setFetching(true);
    adminService.getUsers(filter || undefined)
      .then(setUsers)
      .finally(() => setFetching(false));
  };

  useEffect(() => {
    if (user?.role === 'admin') load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter]);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    await adminService.deleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleRoleChange = async (id: number, newRole: string) => {
    await adminService.updateUserRole(id, newRole);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

  const filtered = search
    ? users.filter(u =>
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  if (loading || fetching) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-xl">
          <Users className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">{users.length} accounts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {['', 'client', 'driver'].map(r => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              filter === r
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-brand-400'
            }`}
          >
            {r === '' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Phone</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Joined</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">#{u.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">{u.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {/* Toggle role */}
                      {u.role === 'client' && (
                        <button
                          onClick={() => handleRoleChange(u.id, 'driver')}
                          title="Promote to Driver"
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}
                      {u.role === 'driver' && (
                        <button
                          onClick={() => handleRoleChange(u.id, 'client')}
                          title="Demote to Client"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      )}
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(u.id, u.full_name)}
                        title="Delete user"
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
