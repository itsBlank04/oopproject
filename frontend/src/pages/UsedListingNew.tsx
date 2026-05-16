import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import toast from 'react-hot-toast'
import type { Category, ConditionLevel } from '@/types'

export default function UsedListingNew() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    title: '',
    description: '',
    priceBdt: '',
    categoryId: '',
    conditionId: '',
    warrantyFlag: 'NO',
    imageUrl: '',
    ownerCount: '1',
    usageDurationMonths: '',
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
  })

  const { data: conditions } = useQuery({
    queryKey: ['conditions'],
    queryFn: () => api.get<ConditionLevel[]>('/condition-levels'),
  })

  const mutation = useMutation({
    mutationFn: (data: unknown) => api.post('/used-listings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['used-listings'] })
      toast.success('Listing created!')
      navigate('/used')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      title: form.title,
      description: form.description || null,
      priceBdt: Number(form.priceBdt),
      categoryId: Number(form.categoryId),
      conditionId: Number(form.conditionId),
      warrantyFlag: form.warrantyFlag,
      imageUrls: form.imageUrl ? [form.imageUrl] : [],
      videoUrls: [],
      ownerCount: Number(form.ownerCount),
      usageDurationMonths: form.usageDurationMonths ? Number(form.usageDurationMonths) : null,
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="font-display text-2xl text-ink-950 mb-8">List Used Item</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input type="text" name="title" className="input" value={form.title} onChange={handleChange} required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea name="description" className="input min-h-[80px]" value={form.description} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Price (৳)</label>
          <input type="number" name="priceBdt" className="input" value={form.priceBdt} onChange={handleChange} required min="0" step="0.01" />
        </div>
        <div>
          <label className="label">Category</label>
          <select name="categoryId" className="input" value={form.categoryId} onChange={handleChange} required>
            <option value="">Select category</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Condition</label>
          <select name="conditionId" className="input" value={form.conditionId} onChange={handleChange} required>
            <option value="">Select condition</option>
            {conditions?.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Warranty</label>
          <select name="warrantyFlag" className="input" value={form.warrantyFlag} onChange={handleChange}>
            <option value="NO">No warranty</option>
            <option value="YES">Warranty included</option>
          </select>
        </div>
        <div>
          <label className="label">Image URL</label>
          <input type="text" name="imageUrl" className="input" value={form.imageUrl} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Owner count</label>
          <input type="number" name="ownerCount" className="input" value={form.ownerCount} onChange={handleChange} min="1" />
        </div>
        <div>
          <label className="label">Usage duration (months)</label>
          <input type="number" name="usageDurationMonths" className="input" value={form.usageDurationMonths} onChange={handleChange} min="0" />
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating...' : 'Create Listing'}
        </button>
      </form>
    </div>
  )
}
