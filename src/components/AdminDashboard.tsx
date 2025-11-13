import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';

interface UserData {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  createdAt?: any;
  updatedAt?: any;
}

interface AdminDashboardProps {
  onNavigateBack?: () => void;
}

export function AdminDashboard({ onNavigateBack }: AdminDashboardProps = {}) {
  const { currentUser, logout } = useAuth();
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalRegularUsers: 0,
  });

  // Load users from Firestore
  const loadUsers = async () => {
    if (!db) {
      showError('Firestore tidak tersedia');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const usersList: UserData[] = [];
      let adminCount = 0;
      let userCount = 0;

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        usersList.push({
          id: docSnapshot.id,
          email: data.email || '',
          displayName: data.displayName || 'User',
          role: data.role || 'user',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });

        if (data.role === 'admin') {
          adminCount++;
        } else {
          userCount++;
        }
      });

      setUsers(usersList);
      setStats({
        totalUsers: usersList.length,
        totalAdmins: adminCount,
        totalRegularUsers: userCount,
      });
    } catch (error) {
      console.error('Error loading users:', error);
      showError('Gagal memuat data users');
    } finally {
      setLoading(false);
    }
  };

  // Update user role
  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    if (!db) {
      showError('Firestore tidak tersedia');
      return;
    }

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date(),
      });

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      // Update stats
      setStats(prevStats => {
        const user = users.find(u => u.id === userId);
        if (!user) return prevStats;

        const wasAdmin = user.role === 'admin';
        const isAdmin = newRole === 'admin';

        return {
          ...prevStats,
          totalAdmins: prevStats.totalAdmins + (isAdmin ? 1 : 0) - (wasAdmin ? 1 : 0),
          totalRegularUsers: prevStats.totalRegularUsers + (isAdmin ? 0 : 1) - (wasAdmin ? 0 : 1),
        };
      });

      success(`Role user berhasil diubah menjadi ${newRole}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      showError('Gagal mengubah role user');
    }
  };

  useEffect(() => {
    // Check if user is admin
    if (currentUser && currentUser.role !== 'admin') {
      // Redirect to home if not admin
      window.location.href = '/';
      return;
    }

    if (currentUser && currentUser.role === 'admin') {
      loadUsers();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      // Navigate back to chat view after logout
      if (onNavigateBack) {
        onNavigateBack();
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleBackToChat = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      window.location.href = '/';
    }
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-chat-darker">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">Akses ditolak</p>
          <p className="text-gray-500 text-sm">Hanya admin yang dapat mengakses halaman ini</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-chat-darker text-white">
      {/* Header */}
      <header className="bg-chat-dark border-b border-chat-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}Gambar/ChatGPT_Image_Nov_11__2025__07_22_25_AM-removebg-preview.png`}
              alt="G Chat Logo"
              className="h-8 w-8 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              {currentUser.displayName || currentUser.email}
            </span>
            <button
              onClick={handleBackToChat}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-chat-hover rounded-lg hover:bg-chat-border transition-colors"
            >
              Kembali ke Chat
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-chat-dark rounded-lg border border-chat-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Users</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.totalUsers}</p>
              </div>
              <div className="p-3 bg-blue-600/20 rounded-full">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-chat-dark rounded-lg border border-chat-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Admin</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.totalAdmins}</p>
              </div>
              <div className="p-3 bg-red-600/20 rounded-full">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-chat-dark rounded-lg border border-chat-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Regular Users</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.totalRegularUsers}</p>
              </div>
              <div className="p-3 bg-green-600/20 rounded-full">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-chat-dark rounded-lg border border-chat-border">
          <div className="p-6 border-b border-chat-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">User Management</h2>
            <button
              onClick={loadUsers}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-400">Memuat data...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Tidak ada user ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-chat-border">
                  <thead className="bg-chat-darker">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Dibuat
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-chat-dark divide-y divide-chat-border">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-chat-darker transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {user.displayName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'admin'
                                ? 'bg-red-600/20 text-red-400 border border-red-600/30'
                                : 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.id !== currentUser.uid && (
                            <button
                              onClick={() =>
                                updateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')
                              }
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                user.role === 'admin'
                                  ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 border border-yellow-600/30'
                                  : 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30'
                              }`}
                            >
                              {user.role === 'admin' ? 'Jadikan User' : 'Jadikan Admin'}
                            </button>
                          )}
                          {user.id === currentUser.uid && (
                            <span className="text-xs text-gray-500">(Anda)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

