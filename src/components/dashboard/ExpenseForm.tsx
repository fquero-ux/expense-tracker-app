'use client';

import { useState, useRef } from 'react';
import { addExpense, updateExpense } from '@/app/actions/expenses';
import { scanReceipt } from '@/app/actions/scan';
import { Button } from '@/components/ui/Button';
import { Camera, Loader2, X } from 'lucide-react';

// Categorías definidas (se podrían mover a una constante global)
const CATEGORIES = [
    'Comida',
    'Transporte',
    'Oficina',
    'Software',
    'Servicios',
    'Otros'
];

interface Expense {
    id: string;
    description: string;
    amount: number;
    date: string;
    category: string;
}

interface ExpenseFormProps {
    expense?: Expense;
    onSuccess?: () => void;
}

export const ExpenseForm = ({ expense, onSuccess }: ExpenseFormProps) => {
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form states
    const [amount, setAmount] = useState(expense?.amount?.toString() || '');
    const [description, setDescription] = useState(expense?.description || '');
    const [date, setDate] = useState(expense?.date || new Date().toLocaleDateString('en-CA'));
    const [category, setCategory] = useState(expense?.category || '');

    const isEditing = !!expense;

    const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show preview
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        setScanning(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('receipt', file);

        try {
            const result = await scanReceipt(formData);

            if (result.error) {
                setMessage({ type: 'error', text: result.error });
            } else if (result.data) {
                // Update states
                if (result.data.description) setDescription(result.data.description);
                if (result.data.amount) setAmount(result.data.amount.toString());
                if (result.data.date) setDate(result.data.date);
                if (result.data.category) setCategory(result.data.category);

                setMessage({ type: 'success', text: '¡Boleta analizada! Revisa los datos.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión con el escáner.' });
        } finally {
            setScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const formData = new FormData(e.currentTarget);

        try {
            let result;

            if (isEditing && expense) {
                result = await updateExpense(expense.id, formData);
            } else {
                result = await addExpense(formData);
            }

            if (result?.error) {
                setMessage({ type: 'error', text: result.error });
            } else {
                setMessage({
                    type: 'success',
                    text: isEditing ? '¡Gasto actualizado!' : '¡Gasto registrado!'
                });

                if (!isEditing) {
                    setAmount('');
                    setDescription('');
                    setDate(new Date().toLocaleDateString('en-CA'));
                    setCategory('');
                    setPreviewUrl(null);
                }

                if (onSuccess) {
                    setTimeout(() => onSuccess(), 1000);
                }
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Ocurrió un error inesperado.' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={!isEditing ? "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700" : ""}>
            {!isEditing && (
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 h-full my-auto">Registrar Nuevo Gasto</h2>

                    {/* Scan Button */}
                    <div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleScan}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={scanning || loading}
                            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-md transition-colors"
                        >
                            {scanning ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Camera className="w-4 h-4" />
                            )}
                            {scanning ? 'Analizando...' : 'Escanear Boleta'}
                        </button>
                    </div>
                </div>
            )}

            {/* Image Preview */}
            {previewUrl && (
                <div className="mb-6 relative group">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Previsualización de Boleta:</div>
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <img
                            src={previewUrl}
                            alt="Scan preview"
                            className="h-full w-full object-contain"
                        />
                        {scanning && (
                            <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
                                <div className="bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                    <span className="text-sm font-medium">Extrayendo datos...</span>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setPreviewUrl(null)}
                            className="absolute top-2 right-2 p-1.5 bg-gray-900/50 hover:bg-gray-900/70 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <span className="sr-only">Cerrar</span>
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {message && (
                <div className={`mb-6 p-4 rounded-lg text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`} />
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Monto */}
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Monto
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400">$</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                name="amount"
                                id="amount"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                className="w-full pl-7 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 transition-all"
                            />
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Descripción
                        </label>
                        <input
                            type="text"
                            name="description"
                            id="description"
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ej: Almuerzo de trabajo"
                            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fecha */}
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Fecha
                        </label>
                        <input
                            type="date"
                            name="date"
                            id="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white dark:bg-gray-700 transition-all"
                        />
                    </div>

                    {/* Categoría (Custom) */}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Categoría
                        </label>
                        <input
                            list="categories-list"
                            name="category"
                            id="category"
                            required
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Escribe o selecciona..."
                            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700 transition-all"
                        />
                        <datalist id="categories-list">
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat} />
                            ))}
                        </datalist>
                    </div>
                </div>

                <div className="pt-2">
                    <Button type="submit" disabled={loading} className="w-full py-3">
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{isEditing ? 'Actualizando...' : 'Guardando...'}</span>
                            </div>
                        ) : (
                            isEditing ? 'Actualizar Gasto' : 'Guardar Gasto'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};
