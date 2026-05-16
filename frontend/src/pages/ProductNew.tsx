import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import toast from 'react-hot-toast'
import type { Category } from '@/types'

export default function ProductNew() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: '',
    description: '',
    priceBdt: '',
    categoryId: '',
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
  })

  const mutation = useMutation({
    mutationFn: (data: unknown) => api.post('/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product created!')
      navigate('/products')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      name: form.name,
      description: form.description || null,
      priceBdt: Number(form.priceBdt),
      categoryId: Number(form.categoryId),
      imageUrls: [],
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="font-display text-2xl text-ink-950 mb-8">New Product</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Product Name</label>
          <input type="text" name="name" className="input" value={form.name} onChange={handleChange} required />
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
        <button type="submit" className="btn btn-primary w-full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating...' : 'Create Product'}
        </button>
      </form>
    </div>
  )
}
