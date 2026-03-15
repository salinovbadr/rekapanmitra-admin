import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { 
    Users, 
    ShoppingBag, 
    TrendingUp, 
    Search, 
    ArrowUpRight, 
    ArrowDownRight,
    Filter,
    Calendar,
    ChevronRight,
    BarChart3
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type MitraSales = {
    user_id: string;
    name: string;
    total_pcs: number;
    total_revenue: number;
    order_count: number;
    last_sale: string | null;
};

export default function MonitoringSalesPage() {
    const [salesData, setSalesData] = useState<MitraSales[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');

    useEffect(() => {
        fetchSalesData();
    }, [timeFilter]);

    const fetchSalesData = async () => {
        setLoading(true);
        try {
            // 1. Fetch all profiles (mitra)
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('user_id, name')
                .eq('role', 'mitra');

            if (profileError) throw profileError;

            // 2. Fetch orders with time filter
            let query = supabase.from('orders').select('user_id, quantity, total_price, created_at');
            
            if (timeFilter === 'month') {
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);
                query = query.gte('created_at', startOfMonth.toISOString());
            } else if (timeFilter === 'week') {
                const lastWeek = new Date();
                lastWeek.setDate(lastWeek.getDate() - 7);
                query = query.gte('created_at', lastWeek.toISOString());
            }

            const { data: orders, error: orderError } = await query;
            if (orderError) throw orderError;

            // 3. Aggregate data
            const aggregation: Record<string, MitraSales> = {};
            
            // Initialize with all profiles
            profiles?.forEach(p => {
                aggregation[p.user_id] = {
                    user_id: p.user_id,
                    name: p.name,
                    total_pcs: 0,
                    total_revenue: 0,
                    order_count: 0,
                    last_sale: null
                };
            });

            // Add order data
            orders?.forEach(o => {
                if (aggregation[o.user_id]) {
                    aggregation[o.user_id].total_pcs += o.quantity;
                    aggregation[o.user_id].total_revenue += o.total_price;
                    aggregation[o.user_id].order_count += 1;
                    
                    if (!aggregation[o.user_id].last_sale || new Date(o.created_at) > new Date(aggregation[o.user_id].last_sale!)) {
                        aggregation[o.user_id].last_sale = o.created_at;
                    }
                }
            });

            setSalesData(Object.values(aggregation).sort((a, b) => b.total_pcs - a.total_pcs));
        } catch (error: any) {
            toast.error("Gagal memuat data monitoring", { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const filteredData = salesData.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalStats = filteredData.reduce((acc, curr) => ({
        pcs: acc.pcs + curr.total_pcs,
        rev: acc.rev + curr.total_revenue,
        orders: acc.orders + curr.order_count
    }), { pcs: 0, rev: 0, orders: 0 });

    if (loading && salesData.length === 0) return <LoadingScreen />;

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-wider uppercase mb-1">
                        <TrendingUp className="size-4" />
                        Sales Performance
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Monitoring Penjualan</h1>
                    <p className="text-slate-500 font-medium">Pantau detail PCS terjual dan performa setiap mitra secara real-time.</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                        {(['all', 'month', 'week'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setTimeFilter(f)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize",
                                    timeFilter === f 
                                        ? "bg-primary text-white shadow-md shadow-primary/20" 
                                        : "text-slate-500 hover:text-primary hover:bg-slate-50"
                                )}
                            >
                                {f === 'all' ? 'Semua' : f === 'month' ? 'Bulan Ini' : 'Minggu Ini'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    label="Total Pcs Terjual" 
                    value={totalStats.pcs.toLocaleString()} 
                    subValue="Volume Penjualan"
                    icon={<ShoppingBag className="size-5" />}
                    color="primary"
                />
                <StatCard 
                    label="Total Omzet Produk" 
                    value={formatCurrency(totalStats.rev)} 
                    subValue="Revenue Terpantau"
                    icon={<TrendingUp className="size-5" />}
                    color="emerald"
                />
                <StatCard 
                    label="Mitra Aktif" 
                    value={filteredData.length.toString()} 
                    subValue="Total Database"
                    icon={<Users className="size-5" />}
                    color="amber"
                />
                <StatCard 
                    label="Total Transaksi" 
                    value={totalStats.orders.toLocaleString()} 
                    subValue="Pesanan Selesai"
                    icon={<BarChart3 className="size-5" />}
                    color="indigo"
                />
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-[2rem] border border-primary/10 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Filter className="size-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Daftar Performa Mitra</h3>
                            <p className="text-xs text-slate-400 font-medium">Urutan berdasarkan volume penjualan terbanyak</p>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                        <input 
                            type="text" 
                            placeholder="Cari nama mitra..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm w-full md:w-64 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Mitra</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Total PCS</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Omzet Penjualan</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Transaksi</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Terakhir Aktif</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold italic">
                                        Tidak ada data penjualan untuk periode ini
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((data, idx) => (
                                    <tr key={data.user_id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-sm border border-slate-200 group-hover:border-primary/30 group-hover:text-primary transition-all">
                                                    {data.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-slate-800 text-sm tracking-tight">{data.name}</p>
                                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">ID: {data.user_id.split('-')[0]}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1 bg-primary/5 text-primary text-sm font-black rounded-lg border border-primary/10">
                                                {data.total_pcs}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-slate-700 text-sm">
                                            {formatCurrency(data.total_revenue)}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <p className="text-xs font-bold text-slate-500">{data.order_count} Pesanan</p>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <p className="text-xs font-bold text-slate-600">
                                                    {data.last_sale ? new Date(data.last_sale).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Belum ada'}
                                                </p>
                                                {idx < 3 && data.total_pcs > 0 && (
                                                    <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">
                                                        <ArrowUpRight className="size-3" /> Top Seller
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                    <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">
                        Data diperbarui secara otomatis setiap ada transaksi masuk
                    </p>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, subValue, icon, color }: { label: string, value: string, subValue: string, icon: React.ReactNode, color: 'primary' | 'emerald' | 'amber' | 'indigo' }) {
    const colorClasses = {
        primary: "bg-primary/10 text-primary border-primary/20",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100"
    };

    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:shadow-lg hover:border-primary/20 transition-all duration-300">
            <div className={cn("size-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110 duration-300", colorClasses[color])}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</p>
                <div className="flex items-baseline gap-2">
                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{value}</h4>
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1 uppercase tracking-widest">
                    <span>{subValue}</span>
                </p>
            </div>
            {/* Subtle background decoration */}
            <div className={cn("absolute -right-4 -bottom-4 size-24 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity", color === 'primary' ? 'bg-primary' : 'bg-slate-900')} />
        </div>
    );
}
