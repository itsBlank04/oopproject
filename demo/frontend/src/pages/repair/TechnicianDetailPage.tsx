/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'

export default function TechnicianDetailPage() {
  const { id } = useParams<{ id: string }>()

  // Fetch technician profile
  const { data: tech, isLoading: techLoading, error } = useQuery<any>({
    queryKey: ['technician', id],
    queryFn: () => apiClient.get(`/api/technicians/${id}`).then(r => r.data),
  })

  // Fetch technician reviews
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<any[]>({
    queryKey: ['technician-reviews', id],
    queryFn: () => apiClient.get(`/api/technicians/${id}/reviews`).then(r => Array.isArray(r.data) ? r.data : []),
  })

  // Fetch technician services
  const { data: services = [], isLoading: servicesLoading } = useQuery<any[]>({
    queryKey: ['technician-services', id],
    queryFn: () => apiClient.get(`/api/technicians/${id}/services`).then(r => Array.isArray(r.data) ? r.data : []),
  })

  if (techLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center text-on-surface-variant flex flex-col items-center gap-4">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          <span>Loading technician profile...</span>
        </div>
      </div>
    )
  }

  if (error || !tech) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center py-12 px-6 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm">
          <p className="text-on-surface-variant">Technician not found.</p>
          <Link to="/repair/technicians" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-label-md font-semibold text-on-primary hover:bg-primary/95 transition shadow-sm">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Technicians
          </Link>
        </div>
      </div>
    )
  }

  // Calculate detailed dimensions averages
  const calculateDimensionAvg = (dimension: string): string => {
    if (reviews.length === 0) return "5.0"
    const sum = reviews.reduce((acc, curr) => acc + (curr[dimension] || 0), 0)
    return (sum / reviews.length).toFixed(1)
  }

  const workQuality = calculateDimensionAvg('workQuality')
  const professionalism = calculateDimensionAvg('professionalism')
  const communication = calculateDimensionAvg('communication')
  const timeliness = calculateDimensionAvg('timeliness')
  const pricingFairness = calculateDimensionAvg('pricingFairness')

  const parsedCertifications = tech.certifications
    ? tech.certifications.split(',').map((c: string) => c.trim()).filter(Boolean)
    : []

  return (
    <div className="min-h-screen bg-background text-on-surface pb-16 px-margin-mobile md:px-margin-desktop py-8">
      {/* Header breadcrumb */}
      <div className="mx-auto max-w-5xl">
        <Link to="/repair/technicians" className="inline-flex items-center gap-1.5 text-label-md font-semibold text-on-surface-variant hover:text-primary transition">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to Technicians
        </Link>
      </div>

      <div className="mx-auto max-w-5xl mt-8 grid gap-8 md:grid-cols-3">
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {tech.photoUrl ? (
                <img src={tech.photoUrl} alt="" className="h-24 w-24 rounded-full object-cover border-2 border-primary/20 shadow-sm" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-3xl font-bold text-on-primary shadow-sm">
                  {tech.user?.displayName?.[0] || '?'}
                </div>
              )}

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                  <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">{tech.user?.displayName}</h1>
                  <span className={`mx-auto sm:mx-0 rounded-full px-3 py-0.5 text-label-sm font-semibold ${tech.level === 'EXPERT' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {tech.level === 'EXPERT' ? 'Master Tech' : (tech.level || 'VERIFIED')}
                  </span>
                </div>
                <p className="mt-1 text-label-md text-on-surface-variant font-medium">{tech.specialization}</p>

                <div className="mt-6 flex flex-wrap items-center justify-center sm:justify-start gap-y-2 gap-x-4 text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">pin_drop</span> {tech.serviceArea || 'Dhaka'}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">schedule</span> {tech.responseTime || 'Replies in 30 mins'}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">handyman</span> {tech.experienceYears || 3}+ years exp.
                  </span>
                </div>
              </div>
            </div>

            <hr className="my-6 border-outline-variant/20" />

            <div>
              <h3 className="text-headline-sm font-bold text-on-surface text-base">About {tech.user?.displayName}</h3>
              <p className="mt-2 text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">
                {tech.bio || `${tech.user?.displayName} is a certified repair technician specializing in ${tech.specialization}. Ready to provide high quality diagnostics and repairs.`}
              </p>
            </div>

            {parsedCertifications.length > 0 && (
              <div className="mt-6">
                <h3 className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Certifications</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {parsedCertifications.map((c: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-1.5 text-label-sm font-medium text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px] text-amber-600">workspace_premium</span>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Services Offered */}
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 md:p-8 shadow-sm">
            <h3 className="text-headline-sm font-bold text-on-surface text-base">Services & Pricing</h3>
            <p className="text-label-sm text-on-surface-variant mt-1">Standard rates for common repairs. Final price may vary based on diagnostics.</p>

            {servicesLoading ? (
              <p className="mt-6 text-label-sm text-on-surface-variant">Loading services...</p>
            ) : services.length === 0 ? (
              <p className="mt-6 text-label-sm text-on-surface-variant">No specialized service listings posted yet. You can still request general repairs.</p>
            ) : (
              <div className="mt-6 divide-y divide-outline-variant/20">
                {services.map((s: any) => (
                  <div key={s.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-body-md text-on-surface">{s.title}</h4>
                      <p className="mt-1 text-label-md text-on-surface-variant leading-relaxed">{s.description}</p>
                      {s.estimatedHours && (
                        <span className="mt-3 inline-flex items-center gap-1 rounded bg-surface-container-low px-2 py-0.5 text-label-sm text-on-surface-variant">
                          <span className="material-symbols-outlined text-[14px]">schedule</span> Est: {s.estimatedHours} hours
                        </span>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-body-md text-primary">{s.priceBdt} BDT</p>
                      <span className="text-label-sm text-on-surface-variant">Starting from</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-headline-sm font-bold text-on-surface text-base">Client Reviews ({reviews.length})</h3>
              <div className="flex items-center gap-1 text-tertiary">
                <span className="material-symbols-outlined text-[20px] icon-fill">star</span>
                <span className="font-bold text-body-md text-on-surface">{tech.ratingAvg ? tech.ratingAvg.toFixed(1) : '5.0'}</span>
              </div>
            </div>

            {reviewsLoading ? (
              <p className="text-label-sm text-on-surface-variant">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-label-sm text-on-surface-variant">No reviews yet. Be the first to review after a service!</p>
            ) : (
              <div className="space-y-6 divide-y divide-outline-variant/20">
                {reviews.map((r: any, idx: number) => (
                  <div key={r.id} className={`pt-6 ${idx === 0 ? 'pt-0' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-label-md text-on-surface">{r.customer?.displayName || 'Client'}</p>
                        <p className="text-label-sm text-on-surface-variant">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-0.5 text-tertiary">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const avg = (r.workQuality + r.professionalism + r.communication + r.timeliness + r.pricingFairness) / 5.0
                          return (
                            <span key={i} className={`material-symbols-outlined text-[16px] ${i < Math.round(avg) ? 'icon-fill' : 'text-outline-variant/50'}`}>star</span>
                          )
                        })}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="mt-3 text-body-md text-on-surface-variant leading-relaxed italic">
                        "{r.comment}"
                      </p>
                    )}
                    {/* Dimension breakdown tags */}
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-on-surface-variant">
                      <span className="bg-surface-container-low border border-outline-variant/10 px-2 py-0.5 rounded">Quality: {r.workQuality}/5</span>
                      <span className="bg-surface-container-low border border-outline-variant/10 px-2 py-0.5 rounded">Professionalism: {r.professionalism}/5</span>
                      <span className="bg-surface-container-low border border-outline-variant/10 px-2 py-0.5 rounded">Communication: {r.communication}/5</span>
                      <span className="bg-surface-container-low border border-outline-variant/10 px-2 py-0.5 rounded">Timeliness: {r.timeliness}/5</span>
                      <span className="bg-surface-container-low border border-outline-variant/10 px-2 py-0.5 rounded">Fair Pricing: {r.pricingFairness}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Summary & CTA */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm sticky top-24">
            <h3 className="text-headline-sm font-bold text-on-surface text-base mb-4">Service Details</h3>

            <div className="space-y-4 text-label-md text-on-surface-variant">
              <div className="flex justify-between border-b border-outline-variant/10 pb-2">
                <span>Completed Jobs</span>
                <span className="font-semibold text-on-surface">{tech.completedJobs || 0}</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/10 pb-2">
                <span>Success Rate</span>
                <span className="font-semibold text-on-surface">{tech.successRate ? `${tech.successRate}%` : '98%'}</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/10 pb-2">
                <span>Experience</span>
                <span className="font-semibold text-on-surface">{tech.experienceYears || 3} Years</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/10 pb-2">
                <span>Response Time</span>
                <span className="font-semibold text-on-surface">{tech.responseTime || '30 mins'}</span>
              </div>
            </div>

            <hr className="my-5 border-outline-variant/20" />

            {/* Dimension Metrics */}
            <div className="space-y-4">
              <h4 className="font-semibold text-label-sm uppercase tracking-wider text-on-surface-variant">Metrics breakdown</h4>
              <div>
                <div className="flex justify-between text-label-sm mb-1.5">
                  <span>Work Quality</span>
                  <span className="font-semibold">{workQuality} ★</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${parseFloat(workQuality) * 20}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-label-sm mb-1.5">
                  <span>Professionalism</span>
                  <span className="font-semibold">{professionalism} ★</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${parseFloat(professionalism) * 20}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-label-sm mb-1.5">
                  <span>Communication</span>
                  <span className="font-semibold">{communication} ★</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${parseFloat(communication) * 20}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-label-sm mb-1.5">
                  <span>Timeliness</span>
                  <span className="font-semibold">{timeliness} ★</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${parseFloat(timeliness) * 20}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-label-sm mb-1.5">
                  <span>Pricing Fairness</span>
                  <span className="font-semibold">{pricingFairness} ★</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${parseFloat(pricingFairness) * 20}%` }}></div>
                </div>
              </div>
            </div>

            <hr className="my-5 border-outline-variant/20" />

            <Link
              to={`/repair/requests?open=true&techId=${tech.id}&techName=${encodeURIComponent(tech.user?.displayName || '')}`}
              className="w-full text-center block rounded-xl bg-primary py-3.5 text-label-md font-semibold text-on-primary hover:bg-primary/95 transition shadow-sm hover:scale-[1.02] active:scale-95"
            >
              Request {tech.user?.displayName}
            </Link>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-label-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">verified_user</span>
              <span>Protected by Escrow Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

