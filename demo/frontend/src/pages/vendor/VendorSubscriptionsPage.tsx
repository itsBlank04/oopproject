import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import { Check, Calendar, CreditCard, ShieldCheck, Sparkles, Clock } from 'lucide-react'

type SubscriptionPlan = {
  id: number
  name: string
  displayName: string
  maxShops: number
  priceMonthlyBdt: number
  priceYearlyBdt: number
  discountPercent: number
  features: string // JSON string list
}

type SubscriptionSummary = {
  subscriptionId: number | null
  planName: string
  planDisplayName: string
  maxShops: number
  billingCycle: string
  status: string
  startsAt: string | null
  expiresAt: string | null
  gracePeriodEnds: string | null
  currentShopCount: number
}

type SubscriptionDeal = {
  id: number
  title: string
  description: string
  dealType: 'FREE_TRIAL' | 'DISCOUNT' | 'FREE_MONTHS'
  value: number
  startsAt: string
  endsAt: string
}

export default function VendorSubscriptionsPage() {
  const queryClient = useQueryClient()
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'card'>('bkash')
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'payment' | 'success'>('details')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [pin, setPin] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Queries
  const { data: summary, isLoading: summaryLoading } = useQuery<SubscriptionSummary>({
    queryKey: ['subscription-summary'],
    queryFn: () => apiClient.get('/api/vendor/subscription/summary').then((r) => r.data),
  })

  const { data: plans = [], isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription-plans'],
    queryFn: () => apiClient.get('/api/vendor/subscription/plans').then((r) => r.data),
  })

  const { data: deals = [] } = useQuery<SubscriptionDeal[]>({
    queryKey: ['subscription-deals'],
    queryFn: () => apiClient.get('/api/vendor/subscription/deals').then((r) => r.data),
  })

  // Mutation
  const subscribeMutation = useMutation({
    mutationFn: (args: { planId: number; billingCycle: string }) =>
      apiClient.post('/api/vendor/subscription/subscribe', args).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-summary'] })
      setCheckoutStep('success')
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error || 'Subscription failed. Please try again.')
    },
  })

  const handleOpenCheckout = (plan: SubscriptionPlan) => {
    if (plan.name === 'BASIC') {
      alert('You are already on the free Basic plan.')
      return
    }
    setSelectedPlan(plan)
    setCheckoutStep('details')
    setErrorMsg('')
    setPhoneNumber('')
    setCardNumber('')
    setPin('')
  }

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (checkoutStep === 'details') {
      setCheckoutStep('payment')
    } else if (checkoutStep === 'payment') {
      if (!selectedPlan) return
      // Validation
      if (paymentMethod === 'card') {
        if (!cardNumber.trim() || !pin.trim()) {
          setErrorMsg('Card details and security code are required.')
          return
        }
      } else {
        if (!phoneNumber.trim() || !pin.trim()) {
          setErrorMsg('Phone number and PIN are required.')
          return
        }
      }
      
      // Call endpoint
      subscribeMutation.mutate({
        planId: selectedPlan.id,
        billingCycle: billingCycle,
      })
    }
  }

  if (summaryLoading || plansLoading) {
    return (
      <div className="min-h-screen bg-[#fcfbfa] py-12 px-6">
        <div className="mx-auto max-w-5xl animate-pulse space-y-8">
          <div className="h-40 rounded-2xl bg-[#e4d6c8]/30" />
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-xl bg-[#e4d6c8]/30" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcfbfa] py-12 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-[Fraunces] text-4xl font-bold text-[#221b16]">Vendor Subscriptions</h1>
          <p className="text-[#8c7564] text-sm mt-2">Manage your storefront slots, staff accounts, and premium feature allocations.</p>
        </div>

        {/* Current Subscription Status */}
        {summary && (
          <div className="mb-12 rounded-2xl border border-[#e4d6c8]/60 bg-white p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8c7564]">Current Active Plan</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  summary.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {summary.status}
                </span>
              </div>
              <h2 className="font-[Fraunces] text-2xl font-bold text-[#221b16]">
                {summary.planDisplayName}
              </h2>
              <div className="text-sm text-[#8c7564] flex flex-wrap gap-x-4 gap-y-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-[#a89280]" />
                  Limit: {summary.maxShops === -1 ? 'Unlimited' : `${summary.maxShops} Shop Slots`} ({summary.currentShopCount} Active)
                </span>
                {summary.expiresAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-[#a89280]" />
                    Renews/Expires: {new Date(summary.expiresAt).toLocaleDateString('en-BD')}
                  </span>
                )}
                <span className="flex items-center gap-1 capitalize">
                  <CreditCard className="h-4 w-4 text-[#a89280]" />
                  Billing: {summary.billingCycle.toLowerCase()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-[#fcfbfa] border border-[#e4d6c8]/50 p-4 rounded-xl w-full md:w-auto">
              <div className="text-center w-full">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-[#8c7564]">Shop Capacity</p>
                <div className="flex items-baseline justify-center gap-1 mt-1">
                  <span className="text-2xl font-bold text-[#221b16]">{summary.currentShopCount}</span>
                  <span className="text-sm text-[#8c7564]">/ {summary.maxShops === -1 ? '∞' : summary.maxShops}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Promotional Deals Banner */}
        {deals.length > 0 && (
          <div className="mb-12 rounded-2xl bg-gradient-to-r from-[#8c7564] to-[#6c5b4f] p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 h-40 w-40 rounded-full bg-white/5" />
            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  Special Promotion Active
                </div>
                <h3 className="font-[Fraunces] text-2xl font-semibold">{deals[0].title}</h3>
                <p className="text-white/80 text-sm max-w-xl">{deals[0].description}</p>
              </div>
              <div className="flex items-center gap-2 bg-black/10 px-4 py-2.5 rounded-xl border border-white/10">
                <Clock className="h-4 w-4 text-amber-300" />
                <span className="text-xs font-semibold">Ends: {new Date(deals[0].endsAt).toLocaleDateString('en-BD')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cycle Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white border border-[#e4d6c8] p-1 rounded-xl flex gap-1 shadow-sm">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                billingCycle === 'MONTHLY' ? 'bg-[#8c7564] text-white' : 'text-[#8c7564] hover:bg-[#8c7564]/5'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('YEARLY')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                billingCycle === 'YEARLY' ? 'bg-[#8c7564] text-white' : 'text-[#8c7564] hover:bg-[#8c7564]/5'
              }`}
            >
              Yearly Billing (Save up to 25%)
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = summary?.planName === plan.name
            const featuresList = plan.features ? JSON.parse(plan.features) : []
            const price = billingCycle === 'MONTHLY' ? plan.priceMonthlyBdt : plan.priceYearlyBdt
            const displayPrice = price === 0 ? 'Free' : `৳${price.toLocaleString()}`

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border bg-white p-6 shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-md ${
                  isCurrent ? 'border-2 border-[#8c7564]' : 'border-[#e4d6c8]/60'
                }`}
              >
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#8c7564] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Current Plan
                  </span>
                )}
                <div>
                  <div className="mb-4">
                    <h3 className="font-[Fraunces] text-xl font-bold text-[#221b16]">{plan.displayName}</h3>
                    <p className="text-xs text-[#8c7564] mt-1">
                      {plan.maxShops === -1 ? 'Unlimited shop slots' : `Up to ${plan.maxShops} shops`}
                    </p>
                  </div>

                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="font-[Fraunces] text-3xl font-bold text-[#221b16]">{displayPrice}</span>
                    {price > 0 && (
                      <span className="text-xs text-[#8c7564]">
                        /{billingCycle === 'MONTHLY' ? 'mo' : 'yr'}
                      </span>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="mb-8 space-y-3">
                    {featuresList.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#4f4035]">
                        <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  disabled={isCurrent || plan.name === 'BASIC'}
                  onClick={() => handleOpenCheckout(plan)}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                    isCurrent
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : plan.name === 'BASIC'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#8c7564] text-white hover:bg-[#6c5b4f]'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : plan.name === 'BASIC' ? 'Free Tier' : 'Upgrade Plan'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Dummy Payment Checkout Modal */}
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-[#e4d6c8] bg-white p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
              
              <button
                onClick={() => setSelectedPlan(null)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>

              {checkoutStep !== 'success' ? (
                <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                  <div>
                    <h3 className="font-[Fraunces] text-2xl text-[#221b16] font-bold">Secure Checkout</h3>
                    <p className="text-[#8c7564] text-xs mt-1">
                      Upgrading to <span className="font-semibold text-[#221b16]">{selectedPlan.displayName}</span> ({billingCycle.toLowerCase()})
                    </p>
                  </div>

                  {checkoutStep === 'details' ? (
                    <div className="space-y-4">
                      {/* Summary fields */}
                      <div className="rounded-xl bg-[#fcfbfa] border border-[#e4d6c8]/40 p-4 space-y-2">
                        <div className="flex justify-between text-xs text-[#8c7564]">
                          <span>Subtotal</span>
                          <span>৳{(billingCycle === 'MONTHLY' ? selectedPlan.priceMonthlyBdt : selectedPlan.priceYearlyBdt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                          <span>Discount ({selectedPlan.discountPercent}%)</span>
                          <span>-৳{((billingCycle === 'MONTHLY' ? selectedPlan.priceMonthlyBdt : selectedPlan.priceYearlyBdt) * (selectedPlan.discountPercent / 100)).toLocaleString()}</span>
                        </div>
                        <div className="border-t border-[#e4d6c8]/40 pt-2 flex justify-between text-sm font-bold text-[#221b16]">
                          <span>Total Amount</span>
                          <span>
                            ৳{((billingCycle === 'MONTHLY' ? selectedPlan.priceMonthlyBdt : selectedPlan.priceYearlyBdt) * (1 - selectedPlan.discountPercent / 100)).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-800 text-[11px] leading-relaxed">
                        <strong>Notice:</strong> This is a secure dummy sandbox payment environment. No actual money will be charged from your wallet/card.
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-[#8c7564] text-white rounded-xl text-sm font-semibold hover:bg-[#6c5b4f] transition-all"
                      >
                        Proceed to Payment
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Payment Method Tabs */}
                      <div className="grid grid-cols-3 gap-2 bg-gray-50 border border-[#e4d6c8] p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => { setPaymentMethod('bkash'); setErrorMsg(''); }}
                          className={`py-2 text-xs font-bold rounded-lg transition-all ${
                            paymentMethod === 'bkash' ? 'bg-[#e2125f] text-white' : 'text-[#8c7564] hover:bg-gray-100'
                          }`}
                        >
                          bKash
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPaymentMethod('nagad'); setErrorMsg(''); }}
                          className={`py-2 text-xs font-bold rounded-lg transition-all ${
                            paymentMethod === 'nagad' ? 'bg-[#f47321] text-white' : 'text-[#8c7564] hover:bg-gray-100'
                          }`}
                        >
                          Nagad
                        </button>
                        <button
                          type="button"
                          onClick={() => { setPaymentMethod('card'); setErrorMsg(''); }}
                          className={`py-2 text-xs font-bold rounded-lg transition-all ${
                            paymentMethod === 'card' ? 'bg-slate-700 text-white' : 'text-[#8c7564] hover:bg-gray-100'
                          }`}
                        >
                          Card
                        </button>
                      </div>

                      {/* Payment Fields */}
                      {paymentMethod !== 'card' ? (
                        <div className="space-y-3">
                          <label className="block text-xs font-semibold text-[#8c7564]">
                            {paymentMethod === 'bkash' ? 'bKash Wallet Number' : 'Nagad Wallet Number'}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-semibold">+880</span>
                            <input
                              type="tel"
                              required
                              placeholder="1XXXXXXXXX"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                              className="w-full border border-gray-300 rounded-xl py-2 pl-14 pr-4 text-sm focus:outline-none focus:border-[#8c7564]"
                            />
                          </div>

                          <label className="block text-xs font-semibold text-[#8c7564] mt-3">Account PIN</label>
                          <input
                            type="password"
                            required
                            placeholder="XXXX"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#8c7564]"
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <label className="block text-xs font-semibold text-[#8c7564]">Credit/Debit Card Number</label>
                          <input
                            type="text"
                            required
                            placeholder="4111 2222 3333 4444"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#8c7564]"
                          />

                          <label className="block text-xs font-semibold text-[#8c7564] mt-3">CVV / Security Code</label>
                          <input
                            type="password"
                            required
                            placeholder="***"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 3))}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#8c7564]"
                          />
                        </div>
                      )}

                      {errorMsg && <p className="text-red-500 text-xs mt-2">{errorMsg}</p>}

                      <button
                        type="submit"
                        disabled={subscribeMutation.isPending}
                        className={`w-full py-3 text-white rounded-xl text-sm font-semibold transition-all ${
                          subscribeMutation.isPending ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {subscribeMutation.isPending ? 'Processing Payment...' : 'Confirm & Pay'}
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-[Fraunces] text-2xl text-[#221b16] font-bold">Subscription Upgraded!</h3>
                    <p className="text-[#8c7564] text-xs mt-1">
                      You are now subscribed to the <span className="font-semibold text-[#221b16]">{selectedPlan?.displayName}</span> package.
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPlan(null)}
                    className="w-full py-2.5 bg-[#8c7564] text-white rounded-xl text-xs font-semibold hover:bg-[#6c5b4f] transition-all"
                  >
                    Return to Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
