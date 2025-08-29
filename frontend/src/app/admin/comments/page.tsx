'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, commentsApi } from '@/lib/api';
import { User, Comment } from '@/lib/types';
import Link from 'next/link';

export default function AdminCommentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const router = useRouter();

  const fetchComments = useCallback(async () => {
    try {
      const params: Record<string, string | number> = { page: currentPage, limit: 20 };
      if (statusFilter) params.status = statusFilter;

      const response = await commentsApi.getAll(params);
      setComments(response.data.comments || []);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      try {
        const userResponse = await authApi.getMe();
        setUser(userResponse.data.user);

        if (!['ADMIN', 'MODERATOR'].includes(userResponse.data.user.role)) {
          alert('У вас нет прав для модерации комментариев');
          router.push('/admin');
          return;
        }

        await fetchComments();
      } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('auth_token');
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, fetchComments]);

  useEffect(() => {
    if (user) {
      fetchComments();
    }
  }, [fetchComments, user]);

  const handleModerate = async (commentId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await commentsApi.moderate(commentId, status);
      setComments(comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, status, moderatedBy: user?.id, moderatedAt: new Date().toISOString() }
          : comment
      ));
    } catch (error) {
      console.error('Error moderating comment:', error);
      alert('Ошибка при модерации комментария');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) return;

    try {
      await commentsApi.delete(commentId);
      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Ошибка при удалении комментария');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'На модерации';
      case 'APPROVED': return 'Одобрен';
      case 'REJECTED': return 'Отклонен';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Модерация комментариев</h1>
              <p className="text-sm text-gray-600">Управление комментариями к новостям</p>
            </div>
            <Link href="/admin" className="text-blue-600 hover:text-blue-800">
              ← Назад в админ панель
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Фильтр по статусу
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Фильтр по статусу комментариев"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Все комментарии</option>
                <option value="PENDING">На модерации</option>
                <option value="APPROVED">Одобренные</option>
                <option value="REJECTED">Отклоненные</option>
              </select>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Комментарии ({comments.length})
            </h2>
          </div>
          
          {comments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Комментарии не найдены
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {comments.map((comment) => (
                <div key={comment.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {comment.authorName}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({comment.authorEmail})
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(comment.status)}`}>
                          {getStatusText(comment.status)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-500 mb-2">
                        <span>Новость: </span>
                        <Link 
                          href={`/news/${comment.newsId}`}
                          className="text-blue-600 hover:text-blue-800"
                          target="_blank"
                        >
                          {(comment as unknown as { news?: { titleRu: string } }).news?.titleRu || 'Неизвестная новость'}
                        </Link>
                      </div>
                      
                      <div className="text-sm text-gray-500 mb-3">
                        {new Date(comment.createdAt).toLocaleString('ru-RU')}
                      </div>
                      
                      {comment.parentId && (comment as unknown as { parent?: { authorName: string; content: string } }).parent && (
                        <div className="bg-gray-50 p-3 rounded-md mb-3">
                          <div className="text-xs text-gray-500 mb-1">Ответ на комментарий:</div>
                          <div className="text-sm text-gray-700">
                            <strong>{(comment as unknown as { parent: { authorName: string; content: string } }).parent.authorName}:</strong> {(comment as unknown as { parent: { authorName: string; content: string } }).parent.content.substring(0, 100)}...
                          </div>
                        </div>
                      )}
                      
                      <div className="text-gray-900 whitespace-pre-wrap">
                        {comment.content}
                      </div>
                      
                      {comment.moderatedAt && (
                        <div className="text-xs text-gray-500 mt-2">
                          Модерировано: {new Date(comment.moderatedAt).toLocaleString('ru-RU')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {comment.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleModerate(comment.id, 'APPROVED')}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Одобрить
                        </button>
                        <button
                          onClick={() => handleModerate(comment.id, 'REJECTED')}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Отклонить
                        </button>
                      </>
                    )}
                    
                    {comment.status === 'APPROVED' && (
                      <button
                        onClick={() => handleModerate(comment.id, 'REJECTED')}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        Отклонить
                      </button>
                    )}
                    
                    {comment.status === 'REJECTED' && (
                      <button
                        onClick={() => handleModerate(comment.id, 'APPROVED')}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Одобрить
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Предыдущая
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Следующая
                  </button>
                </nav>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}