import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type MasterProduct = {
    id: string;
    name: string;
    category: string;
    package_type: string;
    quantity_per_package: number;
    price: number;
    is_active: boolean;
};

// Derived categories from data
const DEFAULT_CATEGORIES = ['STEFFI', 'BELGIE', 'BP', 'BRO', 'BRE', 'NORWAY'];
const PACKAGE_TYPES = [
    { value: '200_botol', label: '200 Botol', qty: 200 },
    { value: '40_botol', label: '40 Botol', qty: 40 },
    { value: '10_botol', label: '10 Botol', qty: 10 },
    { value: '5_botol', label: '5 Botol', qty: 5 },
    { value: '3_botol', label: '3 Botol', qty: 3 },
    { value: 'satuan', label: 'Satuan', qty: 1 }
];

export default function ProdukPage() {
    const [products, setProducts] = useState<MasterProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<MasterProduct | null>(null);
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
    
    // Category renaming state
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isRenaming, setIsRenaming] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
    const [packageType, setPackageType] = useState(PACKAGE_TYPES[5].value);
    const [price, setPrice] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const dynamicCategories = useMemo(() => {
        const cats = Array.from(new Set(products.map(p => p.category)));
        // Ensure default categories are always available for selection/filtering if needed, 
        // or just use what's in the DB. Let's use what's in DB + defaults if empty for initial state.
        if (cats.length === 0) return DEFAULT_CATEGORIES;
        return cats.sort();
    }, [products]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('master_products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            toast.error("Gagal memuat data produk", { description: error.message });
        } else {
            setProducts(data as MasterProduct[]);
        }
        setLoading(false);
    };

    const categoriesMap = useMemo(() => {
        const map: Record<string, MasterProduct[]> = {};
        dynamicCategories.forEach(c => map[c] = []);
        products.forEach(p => {
            if (map[p.category]) map[p.category].push(p);
        });
        dynamicCategories.forEach(c => map[c].sort((a, b) => b.quantity_per_package - a.quantity_per_package));
        return map;
    }, [products, dynamicCategories]);

    const toggleExpand = (cat: string) => {
        setExpandedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const handleOpenModal = (product?: MasterProduct | null, defaultCategory?: string) => {
        if (product) {
            setEditingProduct(product);
            setName(product.name);
            setCategory(product.category);
            setPackageType(product.package_type);
            setPrice(product.price.toString());
            setIsActive(product.is_active);
        } else {
            setEditingProduct(null);
            setName('');
            setCategory(defaultCategory || dynamicCategories[0] || DEFAULT_CATEGORIES[0]);
            setPackageType(PACKAGE_TYPES[5].value);
            setPrice('');
            setIsActive(true);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !price) {
            toast.error("Form belum lengkap", { description: "Semua kolom input wajib diisi." });
            return;
        }

        setIsSubmitting(true);
        const qty = PACKAGE_TYPES.find(p => p.value === packageType)?.qty || 1;

        const productData = {
            name,
            category,
            package_type: packageType,
            quantity_per_package: qty,
            price: Number(price),
            is_active: isActive
        };

        if (editingProduct) {
            // Update
            const { error } = await supabase
                .from('master_products')
                .update(productData)
                .eq('id', editingProduct.id);

            if (error) {
                toast.error("Gagal mengubah produk", { description: error.message });
            } else {
                toast.success("Produk berhasil diubah");
                handleCloseModal();
                fetchProducts();
            }
        } else {
            // Insert
            const { error } = await supabase
                .from('master_products')
                .insert(productData);

            if (error) {
                toast.error("Gagal menambah produk", { description: error.message });
            } else {
                toast.success("Produk berhasil ditambahkan");
                handleCloseModal();
                fetchProducts();
            }
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: string, productName: string) => {
        if (window.confirm(`Yakin ingin menghapus produk ${productName}?`)) {
            const { error } = await supabase
                .from('master_products')
                .delete()
                .eq('id', id);

            if (error) {
                toast.error("Gagal menghapus produk", { description: error.message });
            } else {
                toast.success("Produk berhasil dihapus");
                fetchProducts();
            }
        }
    };

    const handleStartRename = (e: React.MouseEvent, cat: string) => {
        e.stopPropagation();
        setEditingCategory(cat);
        setNewCategoryName(cat);
    };

    const handleCancelRename = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingCategory(null);
        setNewCategoryName('');
    };

    const handleSaveRename = async (e: React.MouseEvent, oldName: string) => {
        e.stopPropagation();
        if (!newCategoryName.trim() || newCategoryName === oldName) {
            setEditingCategory(null);
            return;
        }

        setIsRenaming(true);
        const { error } = await supabase
            .from('master_products')
            .update({ category: newCategoryName.trim() })
            .eq('category', oldName);

        if (error) {
            toast.error("Gagal mengubah nama kategori", { description: error.message });
        } else {
            toast.success("Kategori berhasil diubah");
            fetchProducts();
        }
        setIsRenaming(false);
        setEditingCategory(null);
    };

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">Product Master Data</h2>
                    <p className="text-slate-500 mt-1">Kelola daftar dan harga paket produk (STEFFI, BELGIE, BP) untuk Mitra.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => fetchProducts()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-300 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">refresh</span> Refresh
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-lg">add</span> Tambah Produk
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
                </div>
            ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 bg-white border border-dashed border-slate-300 rounded-2xl">
                    <div className="w-64 h-64 bg-slate-50 rounded-full flex items-center justify-center mb-8 relative">
                        <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full"></div>
                        <div className="relative flex flex-col items-center">
                            <span className="material-symbols-outlined text-primary text-8xl mb-4">inventory</span>
                            <div className="flex gap-2">
                                <span className="material-symbols-outlined text-slate-300 text-4xl animate-pulse">package_2</span>
                                <span className="material-symbols-outlined text-slate-300 text-2xl">category</span>
                            </div>
                        </div>
                    </div>
                    <h4 className="text-xl font-bold mb-2">Belum ada Master Produk</h4>
                    <p className="text-slate-500 max-w-sm text-center mb-8">
                        Katalog produk dan harga masih kosong. Mulai tambahkan Master Produk untuk dibeli oleh mitra.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleOpenModal()}
                            className="px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            Tambah Produk Pertama
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-primary/10 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-primary/10">
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 w-1/3">Kategori / Nama Varian</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Tipe Paket</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Harga Jual</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center w-32">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right w-40">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-primary/5">
                                {dynamicCategories.map(category => {
                                    const items = categoriesMap[category] || [];
                                    const isExpanded = expandedCategories.includes(category);

                                    if (items.length === 0) {
                                        return (
                                            <tr key={category} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <span className="material-symbols-outlined text-slate-300">category</span>
                                                        {editingCategory === category ? (
                                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                                <input
                                                                    type="text"
                                                                    value={newCategoryName}
                                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                                    className="px-2 py-1 border border-primary rounded-md text-sm outline-none"
                                                                    autoFocus
                                                                />
                                                                <button onClick={(e) => handleSaveRename(e, category)} className="text-emerald-500 hover:text-emerald-600">
                                                                    <span className="material-symbols-outlined text-lg">check</span>
                                                                </button>
                                                                <button onClick={handleCancelRename} className="text-rose-500 hover:text-rose-600">
                                                                    <span className="material-symbols-outlined text-lg">close</span>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 group/cat">
                                                                <div className="font-extrabold text-slate-800 text-base">{category}</div>
                                                                <button
                                                                    onClick={(e) => handleStartRename(e, category)}
                                                                    className="opacity-0 group-hover/cat:opacity-100 text-slate-400 hover:text-primary transition-all"
                                                                >
                                                                    <span className="material-symbols-outlined text-base">edit</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td colSpan={3} className="px-6 py-5 text-center text-sm text-slate-400 font-medium">Belum ada varian paket</td>
                                                <td className="px-6 py-5 text-right">
                                                    <button onClick={() => handleOpenModal(null, category)} className="text-sm font-bold text-primary hover:text-primary/80 bg-primary/5 px-4 py-2 rounded-lg transition-colors">
                                                        + Varian Baru
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    }

                                    const minPrice = Math.min(...items.map(i => i.price));
                                    const maxPrice = Math.max(...items.map(i => i.price));
                                    const activeCount = items.filter(i => i.is_active).length;

                                    return (
                                        <React.Fragment key={category}>
                                            <tr onClick={() => toggleExpand(category)} className="cursor-pointer hover:bg-slate-50 transition-colors border-b-2 border-slate-100 group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary' : ''}`}>expand_more</span>
                                                        {editingCategory === category ? (
                                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                                <input
                                                                    type="text"
                                                                    value={newCategoryName}
                                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                                    className="px-2 py-1 border border-primary rounded-md text-sm outline-none font-bold"
                                                                    autoFocus
                                                                />
                                                                <button onClick={(e) => handleSaveRename(e, category)} className="text-emerald-500 hover:text-emerald-600">
                                                                    {isRenaming ? (
                                                                        <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                                                                    ) : (
                                                                        <span className="material-symbols-outlined text-lg">check</span>
                                                                    )}
                                                                </button>
                                                                <button onClick={handleCancelRename} className="text-rose-500 hover:text-rose-600">
                                                                    <span className="material-symbols-outlined text-lg">close</span>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 group/cat">
                                                                <div className="font-extrabold text-slate-900 text-base tracking-tight">{category}</div>
                                                                <button
                                                                    onClick={(e) => handleStartRename(e, category)}
                                                                    className="opacity-0 group-hover/cat:opacity-100 text-slate-400 hover:text-primary transition-all"
                                                                >
                                                                    <span className="material-symbols-outlined text-base">edit</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">{items.length} Paket</span>
                                                </td>
                                                <td className="px-6 py-5 text-right font-black text-slate-800">
                                                    Rp {minPrice.toLocaleString('id-ID')} <span className="text-slate-400 font-medium mx-1">-</span> Rp {maxPrice.toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <div className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full inline-block">
                                                        {activeCount} Aktif
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleOpenModal(null, category); }}
                                                            className="text-sm font-bold text-primary hover:text-primary/80 bg-primary/5 px-3 py-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                        >
                                                            + Varian
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {isExpanded && items.map((product) => (
                                                <tr key={product.id} className="bg-slate-50/80 hover:bg-slate-100/80 transition-colors">
                                                    <td className="px-6 py-4 pl-14">
                                                        <div className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                                            {product.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-sm">
                                                            {PACKAGE_TYPES.find(p => p.value === product.package_type)?.label || product.package_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black text-slate-700">
                                                        Rp {product.price.toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {product.is_active ?
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                                                                <span className="size-1.5 rounded-full bg-emerald-500"></span> Aktif
                                                            </span>
                                                            :
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700">
                                                                <span className="size-1.5 rounded-full bg-rose-500"></span> Nonaktif
                                                            </span>
                                                        }
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleOpenModal(product)}
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-primary shadow-sm hover:border-primary/50 transition-all"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(product.id, product.name)}
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-500 shadow-sm hover:border-rose-500/50 transition-all"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-primary/10 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-900">
                                {editingProduct ? 'Edit Master Produk' : 'Tambah Master Produk'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nama Produk Paket</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Contoh: Paket Steffi 3 Botol"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Kategori Brand</label>
                                    <div className="relative">
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        >
                                            {dynamicCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Tipe Paket</label>
                                    <div className="relative">
                                        <select
                                            value={packageType}
                                            onChange={(e) => setPackageType(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        >
                                            {PACKAGE_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Harga Jual Paket (Rp)</label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="Misal: 450000"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                                </label>
                                <span className="text-sm font-bold text-slate-700">Status Produk Aktif</span>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
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
                                    {editingProduct ? 'Simpan' : 'Tambah'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
