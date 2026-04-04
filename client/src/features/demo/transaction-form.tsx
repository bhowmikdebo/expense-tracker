import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { accounts, dateKey, expenseCategories, incomeCategories, parseMinorUnits, type Account, type Category, type Flow, type Transaction } from './data'

const schema = z.object({
  name: z.string().trim().min(2, 'Enter a merchant or source.').max(80, 'Use 80 characters or fewer.'),
  amount: z.string().regex(/^\d{1,7}(\.\d{1,2})?$/, 'Use up to seven digits and two decimal places.').refine((amount) => parseMinorUnits(amount) > 0, 'Enter an amount greater than zero.'),
  type: z.enum(['income', 'expense']),
  category: z.string(),
  account: z.enum(accounts),
  date: z.iso.date('Enter a valid date.').refine((date) => date <= dateKey(), 'Choose today or an earlier date.'),
}).superRefine(({ category, type }, context) => {
  const available: readonly string[] = type === 'income' ? incomeCategories : expenseCategories
  if (!available.includes(category)) context.addIssue({ code: 'custom', path: ['category'], message: 'Choose a category.' })
})

export function TransactionDialog({ type, close, add, returnFocus }: { type: Flow; close: () => void; returnFocus: () => void; add: (row: Transaction) => void }) {
  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', amount: '', type, category: '', account: 'Primary bank' as Account, date: dateKey() },
  })
  const flow = useWatch({ name: 'type', control })
  const categories = flow === 'income' ? incomeCategories : expenseCategories

  return <Dialog open onOpenChange={(open) => { if (!open) close() }}>
    <DialogContent returnFocus={returnFocus}>
      <DialogTitle>Add a transaction</DialogTitle>
      <DialogDescription>This entry stays in your sample ledger until you leave the preview.</DialogDescription>
      <form className="transaction-form" onSubmit={handleSubmit(({ amount, category, ...data }) => {
        add({ ...data, id: crypto.randomUUID(), amount: parseMinorUnits(amount), category: category as Category })
        close()
      })} noValidate>
        <div className="segmented" aria-label="Transaction type">
          {(['expense', 'income'] as const).map((value) => <button key={value} type="button" aria-pressed={flow === value} onClick={() => {
            setValue('type', value)
            setValue('category', '')
          }}>{value === 'expense' ? 'Expense' : 'Income'}</button>)}
        </div>
        <label className="field">Merchant or source<input {...register('name')} placeholder="e.g. Weekend groceries" aria-invalid={!!errors.name} />
          {errors.name && <small className="field-error">{errors.name.message}</small>}
        </label>
        <div className="form-grid">
          <label className="field">Amount (INR)<input {...register('amount')} inputMode="decimal" placeholder="0.00" aria-invalid={!!errors.amount} />
            {errors.amount && <small className="field-error">{errors.amount.message}</small>}
          </label>
          <label className="field">Date<input {...register('date')} type="date" max={dateKey()} aria-invalid={!!errors.date} />
            {errors.date && <small className="field-error">{errors.date.message}</small>}
          </label>
          <label className="field">Category<select {...register('category')} aria-invalid={!!errors.category}>
            <option value="">Select category</option>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>{errors.category && <small className="field-error">{errors.category.message}</small>}</label>
          <label className="field">Account<select {...register('account')}>
            {accounts.map((account) => <option key={account}>{account}</option>)}
          </select></label>
        </div>
        <div className="dialog-actions"><Button variant="outline" onClick={close}>Cancel</Button><Button type="submit">Add to preview</Button></div>
      </form>
    </DialogContent>
  </Dialog>
}
