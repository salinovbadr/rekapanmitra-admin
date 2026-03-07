import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { toast } from 'sonner';

export function AdminProtectedRoute() {
    const { session, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const location = useLocation();

    useEffect(() => {
        if (!session?.user) {
            if (!authLoading) setIsAdmin(false);
            return;
        }

        const checkAdminRole = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('user_id', session.user.id)
                    .single();

                if (error || !data) {
                    console.error("Error fetching role:", error);
                    setIsAdmin(false);
                } else {
                    setIsAdmin(data.role === 'admin');
                    if (data.role !== 'admin') {
                        toast.error("Akses Ditolak", {
                            description: "Akun ini tidak memiliki akses Administrator."
                        });
                    }
                }
            } catch (error) {
                setIsAdmin(false);
            }
        };

        checkAdminRole();
    }, [session, authLoading]);

    if (authLoading || (session?.user && isAdmin === null)) {
        return <LoadingScreen />;
    }

    if (!session?.user || !isAdmin) {
        // Redirect to login if not authenticated or not admin
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
