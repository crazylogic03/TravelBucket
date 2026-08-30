import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell.jsx';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button.jsx';
import { Modal } from '@/components/ui/Modal.jsx';
import { ErrorState } from '@/components/ui/EmptyState.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import {
  listExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getBudgetAnalysis,
} from '@/features/trips/tripApi.js';

const CATEGORIES = ['TRANSPORT', 'HOTEL', 'FOOD', 'ACTIVITY', 'SHOPPING', 'OTHER'];

const emptyForm = () => ({
  amount: '',
  category: 'FOOD',
  description: '',
  expenseDate: new Date().toISOString().slice(0, 10),
});

export default function ExpensesPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await listExpenses(tripId);
    setExpenses(data.expenses || []);
    setBudget(data.budget);
    try {
      const a = await getBudgetAnalysis(tripId);
      setAnalysis(a.analysis);
    } catch {
      setAnalysis(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    setExpenses([]);
    setBudget(null);
    setError(null);
    load()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (expense) => {
    setEditing(expense);
    setForm({
      amount: String(expense.amount),
      category: expense.category,
      description: expense.description,
      expenseDate: expense.expenseDate,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    setFormError(null);
    const payload = {
      amount: Number(form.amount),
      category: form.category,
      description: form.description.trim(),
      expenseDate: form.expenseDate,
      currency: budget?.currency || 'INR',
    };
    try {
      const data = editing
        ? await updateExpense(tripId, editing.id, payload)
        : await addExpense(tripId, payload);
      setExpenses(data.expenses || []);
      setBudget(data.budget);
      setModalOpen(false);
      const a = await getBudgetAnalysis(tripId);
      setAnalysis(a.analysis);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setFormError(null);
    try {
      const data = await deleteExpense(tripId, deleteId);
      setExpenses(data.expenses || []);
      setBudget(data.budget);
      setDeleteId(null);
      try {
        const a = await getBudgetAnalysis(tripId);
        setAnalysis(a.analysis);
      } catch {
        /* ignore */
      }
    } catch (err) {
      setFormError(err.message);
      setDeleteId(null);
    }
  };

  const pct =
    budget && budget.budget > 0
      ? Math.min(100, Math.round((budget.totalSpent / budget.budget) * 100))
      : 0;

  return (
    <AppShell title="Expenses">
      <PageHeader
        title="Trip expenses"
        subtitle="Track spend and stay within budget"
        actions={
          <PrimaryButton onClick={openAdd}>+ Add Expense</PrimaryButton>
        }
      />

      {loading && <Skeleton className="h-40 w-full" />}
      {error && !loading && <ErrorState description={error} onRetry={load} />}

      {budget && (
        <div className="rounded-2xl bg-[var(--surface-elevated)] shadow-card p-6 mb-6">
          <div className="grid sm:grid-cols-4 gap-4">
            <Metric label="Total Budget" value={`${budget.currency} ${budget.budget.toLocaleString()}`} />
            <Metric label="Amount Spent" value={`${budget.currency} ${budget.totalSpent.toLocaleString()}`} />
            <Metric label="Remaining" value={`${budget.currency} ${budget.remaining.toLocaleString()}`} />
            <Metric
              label="Projected Final"
              value={`${budget.currency} ${budget.projectedFinalSpend.toLocaleString()}`}
            />
          </div>
          <div className="mt-5 h-3 rounded-full bg-[var(--surface-muted)] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">{pct}% of budget used</p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(budget.byCategory || {}).map(([cat, amount]) => (
              <div key={cat} className="rounded-xl bg-[var(--background)] px-3 py-2">
                <p className="text-xs text-[var(--text-muted)]">{cat}</p>
                <p className="font-medium text-[var(--text-primary)]">
                  {budget.currency} {Number(amount).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis && (
        <div className="rounded-2xl border border-primary-100 bg-primary-50 p-5 mb-6">
          <p className="font-semibold text-[var(--text-primary)]">{analysis.statusLabel}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{analysis.explanation}</p>
          {analysis.suggestions?.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-[var(--text-secondary)] list-disc pl-5">
              {analysis.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
          {analysis.meta?.fallback && (
            <p className="mt-2 text-xs text-amber-700">Using deterministic budget analysis.</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {expenses.map((e) => (
          <div
            key={e.id}
            className="rounded-2xl bg-[var(--surface-elevated)] shadow-card px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div>
              <p className="font-medium text-[var(--text-primary)]">{e.description}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {e.category} · {e.expenseDate}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-semibold text-[var(--text-primary)]">
                {e.currency} {Number(e.amount).toLocaleString()}
              </p>
              <SecondaryButton className="!px-3 !py-1.5 text-xs" onClick={() => openEdit(e)}>
                Edit
              </SecondaryButton>
              <SecondaryButton
                className="!px-3 !py-1.5 text-xs !text-red-600"
                onClick={() => setDeleteId(e.id)}
              >
                Delete
              </SecondaryButton>
            </div>
          </div>
        ))}
        {!loading && !error && !expenses.length && (
          <p className="text-[var(--text-muted)] text-sm">No expenses yet. Add your first spend.</p>
        )}
      </div>

      <div className="mt-8">
        <SecondaryButton onClick={() => navigate(`/trips/${tripId}`)}>Back to trip</SecondaryButton>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--live-bg)]/40"
            aria-label="Close"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-[var(--surface-elevated)] shadow-xl p-6">
            <h3 className="font-display font-semibold text-lg">
              {editing ? 'Edit expense' : 'Add expense'}
            </h3>
            {formError && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">{formError}</p>
            )}
            <div className="mt-4 space-y-3">
              <Field label="Amount">
                <input
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border-strong)] px-3 py-2"
                />
              </Field>
              <Field label="Category">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border-strong)] px-3 py-2"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Description">
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border-strong)] px-3 py-2"
                />
              </Field>
              <Field label="Date">
                <input
                  type="date"
                  value={form.expenseDate}
                  onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border-strong)] px-3 py-2"
                />
              </Field>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <SecondaryButton onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
              <PrimaryButton
                disabled={saving || !form.amount || !form.description}
                onClick={submit}
              >
                {saving ? 'Saving…' : 'Save'}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={!!deleteId}
        title="Delete expense?"
        confirmLabel="Delete"
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      >
        This will remove the expense and recalculate your budget totals.
      </Modal>
    </AppShell>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 font-display font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="text-[var(--text-secondary)] font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
