/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  LayoutDashboard, 
  Monitor, 
  Filter, 
  Search,
  AlertCircle,
  BookOpen,
  Trophy,
  FileText,
  User,
  ChevronRight,
  Settings,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { Notice, NoticeInput, ServerEvent, ClientEvent } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [view, setView] = useState<'public' | 'admin'>('public');
  const [filter, setFilter] = useState<Notice['category'] | 'All'>('All');
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data) as ServerEvent;
      switch (data.type) {
        case 'INITIAL_STATE':
          setNotices(data.notices);
          break;
        case 'NOTICE_ADDED':
          setNotices(prev => [data.notice, ...prev]);
          break;
        case 'NOTICE_DELETED':
          setNotices(prev => prev.filter(n => n.id !== data.id));
          break;
      }
    };

    return () => socket.close();
  }, []);

  const addNotice = (notice: NoticeInput) => {
    socketRef.current?.send(JSON.stringify({ type: 'ADD_NOTICE', notice }));
    setIsAddModalOpen(false);
  };

  const deleteNotice = (id: number) => {
    socketRef.current?.send(JSON.stringify({ type: 'DELETE_NOTICE', id }));
  };

  const filteredNotices = notices.filter(n => {
    const matchesFilter = filter === 'All' || n.category === filter;
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                          n.content.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="glass sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">UniBoard</h1>
            <p className="text-[10px] uppercase tracking-widest text-black/40 font-semibold">Smart Digital Notice Board</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/5 p-1 rounded-full">
          <button 
            onClick={() => setView('public')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
              view === 'public' ? "bg-white shadow-sm text-black" : "text-black/60 hover:text-black"
            )}
          >
            <Monitor className="w-4 h-4" />
            Public View
          </button>
          <button 
            onClick={() => setView('admin')}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
              view === 'admin' ? "bg-white shadow-sm text-black" : "text-black/60 hover:text-black"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            Admin Panel
          </button>
        </div>
      </nav>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {view === 'public' ? (
          <PublicBoard 
            notices={filteredNotices} 
            filter={filter} 
            setFilter={setFilter} 
            search={search} 
            setSearch={setSearch} 
          />
        ) : (
          <AdminDashboard 
            notices={notices} 
            onDelete={deleteNotice} 
            onOpenAdd={() => setIsAddModalOpen(true)} 
          />
        )}
      </main>

      <AnimatePresence>
        {isAddModalOpen && (
          <AddNoticeModal 
            onClose={() => setIsAddModalOpen(false)} 
            onSubmit={addNotice} 
          />
        )}
      </AnimatePresence>

      <footer className="p-6 text-center text-black/40 text-xs border-t border-black/5">
        &copy; {new Date().getFullYear()} Smart University Digital Infrastructure. All rights reserved.
      </footer>
    </div>
  );
}

function PublicBoard({ 
  notices, 
  filter, 
  setFilter, 
  search, 
  setSearch 
}: { 
  notices: Notice[], 
  filter: string, 
  setFilter: (f: any) => void,
  search: string,
  setSearch: (s: string) => void
}) {
  const categories: (Notice['category'] | 'All')[] = ['All', 'Emergency', 'Academic', 'Exam', 'Event', 'General'];

  return (
    <div className="space-y-8">
      {/* Hero / Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-serif italic font-medium">Campus Announcements</h2>
          <p className="text-black/60">Stay updated with the latest happenings at the university.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
            <input 
              type="text" 
              placeholder="Search notices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 w-64"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                  filter === cat ? "bg-black text-white" : "bg-white border border-black/10 text-black/60 hover:bg-black/5"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {notices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} />
          ))}
        </AnimatePresence>
        {notices.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto text-black/20">
              <FileText className="w-8 h-8" />
            </div>
            <p className="text-black/40 font-medium">No notices found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NoticeCard({ notice }: { notice: Notice, key?: React.Key }) {
  const getIcon = (cat: Notice['category']) => {
    switch (cat) {
      case 'Emergency': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'Academic': return <BookOpen className="w-5 h-5 text-blue-500" />;
      case 'Exam': return <FileText className="w-5 h-5 text-amber-500" />;
      case 'Event': return <Trophy className="w-5 h-5 text-emerald-500" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "notice-card glass rounded-2xl p-6 flex flex-col gap-4",
        notice.priority === 'High' && "priority-high",
        notice.priority === 'Medium' && "priority-medium",
        notice.priority === 'Low' && "priority-low"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="p-2 bg-black/5 rounded-lg">
          {getIcon(notice.category)}
        </div>
        {notice.priority === 'High' && (
          <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider rounded">Urgent</span>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-xl leading-tight">{notice.title}</h3>
        <p className="text-black/70 text-sm line-clamp-4 leading-relaxed">
          {notice.content}
        </p>
      </div>

      <div className="mt-auto pt-4 border-t border-black/5 flex items-center justify-between text-[11px] font-medium text-black/40 uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <User className="w-3 h-3" />
          {notice.author}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          {format(new Date(notice.createdAt), 'MMM d, h:mm a')}
        </div>
      </div>
    </motion.div>
  );
}

function AdminDashboard({ 
  notices, 
  onDelete, 
  onOpenAdd 
}: { 
  notices: Notice[], 
  onDelete: (id: number) => void,
  onOpenAdd: () => void
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Admin Dashboard</h2>
          <p className="text-black/60">Manage all campus announcements and alerts.</p>
        </div>
        <button 
          onClick={onOpenAdd}
          className="bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-black/80 transition-all shadow-xl shadow-black/10"
        >
          <Plus className="w-5 h-5" />
          New Notice
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-widest text-black/40">Board Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/5 p-4 rounded-xl">
                <p className="text-2xl font-bold">{notices.length}</p>
                <p className="text-[10px] font-bold uppercase text-black/40">Total Notices</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl">
                <p className="text-2xl font-bold text-red-600">{notices.filter(n => n.priority === 'High').length}</p>
                <p className="text-[10px] font-bold uppercase text-red-400">High Priority</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-widest text-black/40">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-black/5 transition-all flex items-center justify-between group">
                <span className="text-sm font-medium">Clear Expired Notices</span>
                <ChevronRight className="w-4 h-4 text-black/20 group-hover:text-black/40" />
              </button>
              <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-black/5 transition-all flex items-center justify-between group">
                <span className="text-sm font-medium">Export Board History</span>
                <ChevronRight className="w-4 h-4 text-black/20 group-hover:text-black/40" />
              </button>
              <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-black/5 transition-all flex items-center justify-between group">
                <span className="text-sm font-medium">Board Settings</span>
                <Settings className="w-4 h-4 text-black/20 group-hover:text-black/40" />
              </button>
            </div>
          </div>
        </div>

        {/* Management Table */}
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/5 text-[10px] font-bold uppercase tracking-widest text-black/40">
                  <th className="px-6 py-4">Notice</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {notices.map(notice => (
                  <tr key={notice.id} className="hover:bg-black/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-sm">{notice.title}</div>
                      <div className="text-[10px] text-black/40">By {notice.author}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-black/5 rounded text-[10px] font-bold uppercase">{notice.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold uppercase",
                        notice.priority === 'High' ? "text-red-500" : 
                        notice.priority === 'Medium' ? "text-amber-500" : "text-blue-500"
                      )}>
                        {notice.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] text-black/40 font-medium">
                      {format(new Date(notice.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onDelete(notice.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {notices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-black/40 text-sm italic">
                      No notices currently on the board.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddNoticeModal({ 
  onClose, 
  onSubmit 
}: { 
  onClose: () => void, 
  onSubmit: (n: NoticeInput) => void 
}) {
  const [formData, setFormData] = useState<NoticeInput>({
    title: '',
    content: '',
    category: 'General',
    priority: 'Medium',
    author: 'Admin'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Post New Notice</h3>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Title</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Notice headline..."
                className="w-full px-4 py-3 bg-black/5 border-none rounded-xl focus:ring-2 focus:ring-black/10 outline-none font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                  className="w-full px-4 py-3 bg-black/5 border-none rounded-xl focus:ring-2 focus:ring-black/10 outline-none font-medium appearance-none"
                >
                  <option value="General">General</option>
                  <option value="Academic">Academic</option>
                  <option value="Exam">Exam</option>
                  <option value="Event">Event</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Priority</label>
                <select 
                  value={formData.priority}
                  onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-4 py-3 bg-black/5 border-none rounded-xl focus:ring-2 focus:ring-black/10 outline-none font-medium appearance-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Content</label>
              <textarea 
                rows={4}
                value={formData.content}
                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Detailed announcement..."
                className="w-full px-4 py-3 bg-black/5 border-none rounded-xl focus:ring-2 focus:ring-black/10 outline-none font-medium resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Author</label>
              <input 
                type="text" 
                value={formData.author}
                onChange={e => setFormData(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Department or Name"
                className="w-full px-4 py-3 bg-black/5 border-none rounded-xl focus:ring-2 focus:ring-black/10 outline-none font-medium"
              />
            </div>
          </div>

          <button 
            onClick={() => onSubmit(formData)}
            disabled={!formData.title || !formData.content}
            className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-black/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Publish Notice
          </button>
        </div>
      </motion.div>
    </div>
  );
}
