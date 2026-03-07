import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalMitra: 0,
        activeProducts: 0,
        revenue: 0,
        pendingApprovals: 0
    });

    useEffect(() => {
        const fetchDashboardStats = async () => {
            setLoading(true);
            try {
                // Fetch Total Mitras
                const { count: cbMitras } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'mitra');

                // Fetch Active Products
                const { count: cbProducts } = await supabase
                    .from('master_products')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_active', true);

                // Fetch Monthly Revenue (this month)
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);

                const { data: ordersData } = await supabase
                    .from('orders')
                    .select('total_price')
                    .gte('created_at', startOfMonth.toISOString());

                const currentRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;

                // Pending Approvals (example: pending orders)
                const { count: cbPendingOrders } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'pending');

                setStats({
                    totalMitra: cbMitras || 0,
                    activeProducts: cbProducts || 0,
                    revenue: currentRevenue,
                    pendingApprovals: cbPendingOrders || 0
                });

            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardStats();
    }, []);

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
            <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">System Overview</h2>
                <p className="text-slate-500 mt-1">Manage your mitra partners and monitor real-time system health.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stat Card 1 */}
                <div className="p-6 rounded-xl bg-white border border-primary/10 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">groups</span>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Mitras</p>
                    <h4 className="text-3xl font-extrabold mt-1 text-slate-900">{stats.totalMitra}</h4>
                </div>

                {/* Stat Card 2 */}
                <div className="p-6 rounded-xl bg-white border border-primary/10 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <span className="material-symbols-outlined">inventory_2</span>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Products</p>
                    <h4 className="text-3xl font-extrabold mt-1 text-slate-900">{stats.activeProducts}</h4>
                </div>

                {/* Stat Card 3 */}
                <div className="p-6 rounded-xl bg-white border border-primary/10 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Monthly Revenue</p>
                    <h4 className="text-3xl font-extrabold mt-1 text-slate-900">
                        Rp {stats.revenue.toLocaleString('id-ID')}
                    </h4>
                </div>

                {/* Stat Card 4 */}
                <div className="p-6 rounded-xl bg-white border border-primary/10 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                            <span className="material-symbols-outlined">pending_actions</span>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Pending Orders</p>
                    <h4 className="text-3xl font-extrabold mt-1 text-slate-900">{stats.pendingApprovals}</h4>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Feedback States Block */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">feedback</span>
                        System Status
                    </h3>
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-3">
                        <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                        <div>
                            <p className="text-sm font-bold text-emerald-800">Semua Sistem Berjalan Normal</p>
                            <p className="text-xs text-emerald-700">Database Supabase dan Autentikasi berjalan sangat optimal. Data metrik termuat secara terhubung ({new Date().toLocaleTimeString()}).</p>
                        </div>
                    </div>
                </div>

                {/* Modals & Badges Block */}
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">smart_button</span>
                        Quick Actions
                    </h3>
                    <div className="bg-white border border-primary/10 rounded-2xl shadow-sm p-6 overflow-hidden relative">
                        <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-primary text-3xl">admin_panel_settings</span>
                        </div>
                        <h4 className="text-xl font-bold text-slate-900">Tugas Admin</h4>
                        <p className="text-sm text-slate-500 mt-2 mb-6">Mulai kelola produk-produk perusahaan beserta harga spesial dan pantau aktivitas logaritma member mitra.</p>
                        <div className="flex gap-3">
                            <Link to="/products" className="flex-1 text-center py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors">
                                Master Data Produk
                            </Link>
                            <Link to="/users" className="flex-1 text-center py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors">
                                Kelola Profil Mitra
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
