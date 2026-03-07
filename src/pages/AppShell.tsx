import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { toast } from "sonner";
import {
    LayoutDashboard,
    Box,
    Users,
    LogOut,
    Search,
    Bell,
    ShieldCheck,
    ChevronRight,
    BarChart3
} from 'lucide-react';

export default function AppShell() {
    const { session, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        try {
            await signOut();
            toast.success("Berhasil keluar");
        } catch (error) {
            toast.error("Gagal keluar");
        }
    };

    const NAV_ITEMS = [
        { id: '/', label: 'Dashboard', icon: LayoutDashboard },
        { id: '/products', label: 'Master Data', icon: Box },
        { id: '/users', label: 'Mitra Users', icon: Users },
    ];

    if (!session) {
        // Jangan render shell bila belum login
        return null;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background-light text-slate-900 border-border">
            {/* Side Navigation (Collapsible on Hover) */}
            <aside className="group w-[80px] hover:w-72 bg-white border-r border-primary/10 flex flex-col h-full shadow-sm z-20 transition-all duration-300 ease-in-out overflow-hidden shrink-0 relative">
                {/* Brand Area */}
                <div className="p-5 flex items-center gap-3 border-b border-primary/5 min-w-[288px]">
                    <div className="min-w-[40px] size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm border border-primary/20">
                        <BarChart3 className="size-5" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-in-out truncate">
                        <h1 className="text-lg font-bold leading-tight tracking-tight text-slate-900 truncate">Rekapan Mitra</h1>
                        <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest truncate">Admin Panel</p>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-3 py-6 space-y-2 overflow-x-hidden overflow-y-auto min-w-[288px]">
                    {NAV_ITEMS.map((item) => {
                        const isActive = location.pathname === item.id;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.id}
                                to={item.id}
                                className={cn(
                                    "flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all outline-none font-medium w-full group/navitem relative",
                                    isActive
                                        ? "bg-primary text-white shadow-md shadow-primary/20 font-semibold"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-primary"
                                )}
                            >
                                <Icon className={cn("size-5 shrink-0 transition-all", isActive ? "text-white" : "text-slate-400 group-hover/navitem:text-primary")} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-sm truncate opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-in-out delay-75">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer / Sign Out */}
                <div className="p-4 mt-auto border-t border-primary/5 min-w-[288px]">
                    <button
                        onClick={handleSignOut}
                        className="w-[calc(100%-32px)] flex items-center gap-3 py-3 px-3.5 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100 transition-colors group/logout"
                    >
                        <LogOut className="size-5 shrink-0 transition-transform group-hover/logout:-translate-x-0.5" strokeWidth={2} />
                        <span className="truncate opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-in-out delay-75">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="h-16 border-b border-primary/10 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-sm font-bold">Rekap Dashboard</span>
                            <ChevronRight className="size-4 opacity-50" strokeWidth={2.5} />
                            <span className="text-sm font-black text-slate-800 tracking-tight capitalize">
                                {location.pathname.split('/').filter(Boolean).pop() || 'Dashboard'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden lg:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" strokeWidth={2.5} />
                            <input
                                type="text"
                                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary w-64 transition-all outline-none font-medium placeholder:text-slate-400"
                                placeholder="Cari data..."
                            />
                        </div>

                        <button className="relative size-10 flex items-center justify-center text-slate-500 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-xl transition-all">
                            <Bell className="size-5" strokeWidth={2} />
                            <span className="absolute top-2 right-2.5 size-2 bg-rose-500 border-[1.5px] border-white rounded-full"></span>
                        </button>

                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold leading-none text-slate-900">{session.user.email?.split('@')[0] || 'Admin'}</p>
                                <p className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-wider">Super Admin</p>
                            </div>
                            <div className="size-10 rounded-full border-2 border-primary/20 p-0.5 bg-primary/5 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
                                <ShieldCheck className="size-5" strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="flex-1 overflow-y-auto bg-background-light">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
