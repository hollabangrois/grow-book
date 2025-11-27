'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import type { User } from '@/types/auth';

export default function UsersTable() {
  const [users, setUsers] = useState<Omit<User, 'password_hash'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<Omit<User, 'password_hash'> | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'user' | 'admin' | 'instructor',
    is_active: true,
    password: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // Search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);

  useEffect(() => {
    fetchUsers();
    
    // Wait for Bootstrap to be available
    if (!(window as any).bootstrap) {
      const checkBootstrap = setInterval(() => {
        if ((window as any).bootstrap) {
          clearInterval(checkBootstrap);
        }
      }, 100);
      
      return () => clearInterval(checkBootstrap);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const url = searchTerm
        ? `/api/users?search=${encodeURIComponent(searchTerm)}&page=${currentPage}&limit=${limit}`
        : `/api/users?page=${currentPage}&limit=${limit}`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (response.ok) {
        if (result.data) {
          setUsers(result.data);
          setTotal(result.total);
          setTotalPages(result.totalPages);
        } else {
          // Fallback
          setUsers(result);
          setTotal(result.length);
          setTotalPages(1);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'user',
      is_active: true,
      password: '',
    });
    setMessage(null);
    
    setTimeout(() => {
      const modalElement = document.getElementById('userModal');
      if (modalElement) {
        if ((window as any).bootstrap) {
          let modal = (window as any).bootstrap.Modal.getInstance(modalElement);
          if (!modal) {
            modal = new (window as any).bootstrap.Modal(modalElement);
          }
          modal.show();
        } else {
          const triggerBtn = document.createElement('button');
          triggerBtn.setAttribute('data-bs-toggle', 'modal');
          triggerBtn.setAttribute('data-bs-target', '#userModal');
          triggerBtn.style.display = 'none';
          document.body.appendChild(triggerBtn);
          triggerBtn.click();
          document.body.removeChild(triggerBtn);
        }
      }
    }, 10);
  };

  const handleEdit = (user: Omit<User, 'password_hash'>) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      password: '', // Don't pre-fill password
    });
    setMessage(null);
    
    const showModal = () => {
      const modalElement = document.getElementById('userModal');
      if (modalElement && (window as any).bootstrap) {
        let modal = (window as any).bootstrap.Modal.getInstance(modalElement);
        if (!modal) {
          modal = new (window as any).bootstrap.Modal(modalElement);
        }
        modal.show();
      } else if (modalElement) {
        setTimeout(showModal, 100);
      }
    };
    
    if ((window as any).bootstrap) {
      showModal();
    } else {
      setTimeout(showModal, 100);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'User deleted successfully!' });
        fetchUsers();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete user' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete user' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        is_active: formData.is_active,
      };

      // Only include password if it's provided (for new users or when updating)
      if (!editingUser || formData.password) {
        if (!formData.password && !editingUser) {
          setMessage({ type: 'error', text: 'Password is required for new users' });
          return;
        }
        if (formData.password) {
          payload.password = formData.password;
        }
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: editingUser ? 'User updated!' : 'User created!' });
        const modalElement = document.getElementById('userModal');
        if (modalElement) {
          const modal = (window as any).bootstrap?.Modal?.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }
        }
        fetchUsers();
        setFormData({
          name: '',
          email: '',
          role: 'user',
          is_active: true,
          password: '',
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save user' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save user' });
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {message && (
        <div
          className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible`}
          role="alert"
        >
          {message.text}
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="alert"
            aria-label="Tutup"
            onClick={() => setMessage(null)}
          ></button>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Daftar Pengguna</h3>
          <div className="card-tools">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleCreate}
              data-bs-toggle="modal"
              data-bs-target="#userModal"
            >
              <i className="bi bi-plus-lg me-1"></i>Tambah Baru
            </button>
          </div>
        </div>
        <div className="card-body">
          {/* Search */}
          <div className="mb-3">
            <div className="row">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cari nama atau email pengguna..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="col-md-6 text-end">
                <small className="text-muted">
                  Menampilkan {users.length} dari {total} pengguna
                </small>
              </div>
            </div>
          </div>

          <table className="table table-bordered table-striped">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Login Terakhir</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Memuat...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center">
                    Tidak ada pengguna ditemukan
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name || '-'}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className="badge text-bg-info">{user.role}</span>
                    </td>
                    <td>
                      {user.is_active ? (
                        <span className="badge text-bg-success">Aktif</span>
                      ) : (
                        <span className="badge text-bg-danger">Tidak Aktif</span>
                      )}
                    </td>
                    <td>{user.last_login ? new Date(user.last_login).toLocaleString('id-ID') : 'Belum pernah'}</td>
                    <td>
                      <button className="btn btn-sm btn-info me-1" onClick={() => handleEdit(user)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(user.id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Page navigation">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Sebelumnya
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(page)}>
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Selanjutnya
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>

      <Modal id="userModal" title={editingUser ? 'Edit User' : 'Add New User'} size="lg">
        <form onSubmit={handleSubmit}>
          {message && (
            <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`}>
              {message.text}
            </div>
          )}
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Name
            </label>
            <input
              type="text"
              className="form-control"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password {editingUser ? '(leave blank to keep current)' : <span className="text-danger">*</span>}
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
            />
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="role" className="form-label">
                Role <span className="text-danger">*</span>
              </label>
              <select
                className="form-control"
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                required
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="is_active" className="form-label">
                Status
              </label>
              <select
                className="form-control"
                id="is_active"
                value={formData.is_active ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingUser ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

