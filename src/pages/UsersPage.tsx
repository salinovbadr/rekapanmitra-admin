import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

type Profile = {
    id: string;
    user_id: string;
    name: string;
    phone: string | null;
    mitra_level: string;
    role: string;
    created_at: string;
};

const MITRA_LEVELS = [
    { value: 'satuan', label: 'Eceran (Satuan)' },
    { value: 'reseller', label: 'Reseller' },
    { value: 'agen', label: 'Agen Utama' },
    { value: 'agen_plus', label: 'Agen Plus' },
    { value: 'sap', label: 'Distributor SAP' },
];

export default function UsersPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Profile | null>(null);
    const [newLevel, setNewLevel] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'mitra') // Only load mitra 
            .order('created_at', { ascending: false });

        if (error) {
            toast.error("Gagal memuat daftar mitra", { description: error.message });
        } else {
            setUsers(data as Profile[]);
        }
        setLoading(false);
    };

    const handleOpenEdit = (user: Profile) => {
        setEditingUser(user);
        setNewLevel(user.mitra_level);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setIsSubmitting(true);
        const { error } = await supabase
            .from('profiles')
            .update({ mitra_level: newLevel })
            .eq('id', editingUser.id);

        if (error) {
            toast.error("Gagal mengubah level mitra", { description: error.message });
        } else {
            toast.success("Level kemitraan berhasil diubah");
            fetchUsers();
            setIsEditModalOpen(false);
        }
        setIsSubmitting(false);
    };

    const handleResetPassword = async (email: string) => {
        if (!email) {
            toast.error("Informasi email tidak ditemukan untuk mitra ini.");
            return;
        }

        if (window.confirm(`Kirim link ubah password ke akun ${email}?`)) {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) {
                toast.error("Gagal mengirim email reset", { description: error.message });
            } else {
                toast.success("Email reset password berhasil dikirim");
            }
        }
    };

    // Helper: generate fake email from name purely for UI and Reset Auth purpose 
    // In actual production, we need to join profiles with auth.users to get real email, 
    // but without admin role RLS bypass or RPC, it's blocked. 
    // So for MVP we will just fetch the phone/name and if we need email we assume standard format or disable it.
    // For now we will mock the email send success response or inform user about constraint.

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900">Partner Management</h3>
                    <p className="text-slate-500 mt-1">Kelola Profil Mitra, ubah level kemitraan, dan reset akses mereka.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => fetchUsers()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-300 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">refresh</span> Refresh
                    </button>
                    {/* Placeholder action for manual add */}
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20 opacity-50 cursor-not-allowed"
                        disabled
                    >
                        <span className="material-symbols-outlined text-lg">add</span> Tambah Manual
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
                </div>
            ) : users.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">person_off</span>
                    <h4 className="font-bold text-slate-700">Belum Ada Mitra</h4>
                    <p className="text-sm text-slate-500">Anda belum memiliki mitra yang terdaftar.</p>
                </div>
            ) : (
                <div className="bg-white border border-primary/10 rounded-xl overflow-hidden shadow-sm flex-1">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-primary/10">
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Nama Mitra</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Level Mitra</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Kontak</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Terdaftar</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-primary/10">
                                {users.map((user) => {
                                    const initilial = user.name.substring(0, 2).toUpperCase();
                                    const joinDate = new Date(user.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
                                    const levelLabel = MITRA_LEVELS.find(l => l.value === user.mitra_level)?.label || user.mitra_level;

                                    return (
                                        <tr key={user.id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                        {initilial}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{user.name}</p>
                                                        <p className="text-xs text-slate-500 font-medium">Mitra Aktif</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                                    {levelLabel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-slate-700">{user.phone || '-'}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-medium">{joinDate}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenEdit(user)}
                                                        className="px-3 py-1.5 rounded-lg font-bold text-xs bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                                                    >
                                                        Ubah Level
                                                    </button>
                                                    <button
                                                        onClick={() => toast.info('Fitur Segera Datang', { description: 'Fungsi reset email auth memerlukan RPC di Supabase.' })}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all flex items-center justify-center"
                                                        title="Kirim Email Reset Password"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">lock_reset</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && editingUser && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-primary/10 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-900">Ubah Level Kemitraan</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nama Mitra</label>
                                <input
                                    type="text"
                                    value={editingUser.name}
                                    disabled
                                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Tingkat Level Mitra</label>
                                <div className="relative">
                                    <select
                                        value={newLevel}
                                        onChange={(e) => setNewLevel(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    >
                                        {MITRA_LEVELS.map(lvl => <option key={lvl.value} value={lvl.value}>{lvl.label}</option>)}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2.5 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting && <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>}
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
