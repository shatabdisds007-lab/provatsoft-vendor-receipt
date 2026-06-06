'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Profile } from '@/types/auth';
import { ChevronDown, Check, X } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'vendor') => {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      console.error('Failed to update user role:', err);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Users Management</h1>
        <p className="mt-2 text-slate-600">Manage platform users and their roles</p>
      </div>

      {/* Users List */}
      <div className="space-y-2">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">No users found</p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div className="flex-1 text-left">
                  <p className="font-medium text-slate-900">{user.email}</p>
                  <p className="text-sm text-slate-600">ID: {user.id.slice(0, 8)}...</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : 'Vendor'}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 transition ${
                      expandedUserId === user.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {expandedUserId === user.id && (
                <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-3">Change User Role</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => updateUserRole(user.id, 'vendor')}
                        disabled={updating === user.id || user.role === 'vendor'}
                        className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                      >
                        {updating === user.id && user.role !== 'vendor' ? (
                          <span>Updating...</span>
                        ) : (
                          <>
                            {user.role === 'vendor' && <Check className="h-4 w-4" />}
                            Vendor
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => updateUserRole(user.id, 'admin')}
                        disabled={updating === user.id || user.role === 'admin'}
                        className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-slate-300 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                      >
                        {updating === user.id && user.role !== 'admin' ? (
                          <span>Updating...</span>
                        ) : (
                          <>
                            {user.role === 'admin' && <Check className="h-4 w-4" />}
                            Admin
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-xs text-slate-600">Created</p>
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(user.created_at || '').toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Last Updated</p>
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(user.updated_at || '').toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
