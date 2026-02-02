import { createClient } from "@/lib/supabase/server";
import { ExpenseTable, ExpenseForm, ExportButton, DateFilter } from "@/components/dashboard";
import { signout } from "@/app/actions/auth";

export default async function Home(props: { searchParams: Promise<{ startDate?: string; endDate?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  // Date Filters (Default: Current Month)
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA');

  const startDate = searchParams.startDate || defaultStart;
  const endDate = searchParams.endDate || defaultEnd;

  // Fetch expenses from Supabase
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  // Transform data if necessary to match ExpenseTable props
  // Supabase returns 'amount' as number or string depending on config, but usually number for low precision or string for high
  // We can just cast if we trust it, or map.
  // The ExpenseTable interface expects: id, description, amount (number), date, category.

  // Calculate total amount
  const totalAmount = expenses?.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0) || 0;

  return (
    <div className="min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gray-50 dark:bg-gray-900">
      <main className="max-w-4xl mx-auto flex flex-col gap-8 row-start-2 items-center sm:items-start">

        {/* Header Section */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Seguimiento de Gastos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            Gestiona tus finanzas personales
            <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded text-[10px] font-bold">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              v2.9-LIVE
            </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">

            <DateFilter />

            <ExportButton expenses={expenses || []} />

            <form action={signout} className="w-full sm:w-auto">
              <button
                type="submit"
                className="w-full sm:w-auto text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 px-4 py-2 rounded-lg transition-colors h-10"
              >
                Cerrar Sesión
              </button>
            </form>
          </div>
        </div>

        {/* Add Expense Form Section */}
        <div className="w-full">
          <ExpenseForm />
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {/* Card Total */}
          <div className="bg-blue-600 dark:bg-blue-700 p-4 rounded-lg shadow-sm text-white">
            <p className="text-sm text-blue-100 dark:text-blue-200 font-medium">Total Gastado</p>
            <p className="text-2xl font-bold mt-1">
              ${totalAmount.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
            </p>
          </div>

          {/* Dynamic Category Cards */}
          {(Object.entries(
            // Generar resumen por categoría
            (expenses || []).reduce((acc, expense) => {
              const cat = expense.category || 'Otros';
              acc[cat] = (acc[cat] || 0) + (Number(expense.amount) || 0);
              return acc;
            }, {} as Record<string, number>)
          ) as [string, number][]).map(([category, amount]) => (
            <div key={category} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate">{category}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                ${amount.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
              </p>
            </div>
          ))}
        </div>

        {/* Recent Transactions */}
        <div className="w-full">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Últimos Movimientos</h2>

          <ExpenseTable expenses={expenses || []} />
        </div>

      </main>
    </div>
  );
}
