import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/apiClient'
import { Star, Shield, Briefcase, Award, MapPin, Clock, ArrowLeft } from 'lucide-react'

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
      <div className="flex min-h-screen items-center justify-center bg-[#f9f5f0]">
        <div className="text-center text-[#8c7564]">Loading technician profile...</div>
      </div>
    )
  }

  if (error || !tech) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f5f0]">
        <div className="text-center">
          <p className="text-[#8c7564]">Technician not found.</p>
          <Link to="/repair/technicians" className="mt-4 inline-block text-sm font-semibold text-[#221b16] underline">
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
    <div className="min-h-screen bg-[#f9f5f0] text-[#221b16] pb-16">
      {/* Header breadcrumb */}
      <div className="mx-auto max-w-5xl px-6 pt-8">
        <Link to="/repair/technicians" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6c5b4f] hover:text-[#221b16] transition">
          <ArrowLeft className="h-4 w-4" /> Back to Technicians
        </Link>
      </div>

      <div className="mx-auto max-w-5xl px-6 mt-6 grid gap-8 md:grid-cols-3">
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {tech.photoUrl ? (
                <img src={tech.photoUrl} alt="" className="h-24 w-24 rounded-full object-cover border-2 border-[#e4d6c8]" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#221b16] text-3xl font-bold text-[#f9f5f0]">
                  {tech.user?.displayName?.[0] || '?'}
                </div>
              )}

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                  <h1 className="font-[Fraunces] text-2xl font-bold">{tech.user?.displayName}</h1>
                  <span className={`mx-auto sm:mx-0 rounded-full px-3 py-0.5 text-xs font-semibold ${tech.level === 'EXPERT' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {tech.level || 'VERIFIED'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#8c7564] font-medium">{tech.specialization}</p>

                <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-y-2 gap-x-4 text-xs text-[#6c5b4f]">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {tech.serviceArea || 'Dhaka'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {tech.responseTime || 'Replies in 30 mins'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> {tech.experienceYears || 3}+ years exp.
                  </span>
                </div>
              </div>
            </div>

            <hr className="my-6 border-[#e4d6c8]" />

            <div>
              <h3 className="font-[Fraunces] text-lg font-bold">About {tech.user?.displayName}</h3>
              <p className="mt-2 text-sm text-[#6c5b4f] leading-relaxed whitespace-pre-line">
                {tech.bio || `${tech.user?.displayName} is a certified repair technician specializing in ${tech.specialization}. Ready to provide high quality diagnostics and repairs.`}
              </p>
            </div>

            {parsedCertifications.length > 0 && (
              <div className="mt-6">
                <h3 className="font-[Fraunces] text-sm font-bold text-[#221b16] uppercase tracking-wider">Certifications</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {parsedCertifications.map((c: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1 rounded-lg bg-[#f9f5f0] border border-[#e4d6c8] px-3 py-1.5 text-xs font-medium text-[#6c5b4f]">
                      <Award className="h-3.5 w-3.5 text-amber-600" />
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Services Offered */}
          <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6 md:p-8 shadow-sm">
            <h3 className="font-[Fraunces] text-xl font-bold">Services & Pricing</h3>
            <p className="text-xs text-[#8c7564] mt-1">Standard rates for common repairs. Final price may vary based on diagnostics.</p>

            {servicesLoading ? (
              <p className="mt-4 text-xs text-[#8c7564]">Loading services...</p>
            ) : services.length === 0 ? (
              <p className="mt-4 text-xs text-[#8c7564]">No specialized service listings posted yet. You can still request general repairs.</p>
            ) : (
              <div className="mt-6 divide-y divide-[#e4d6c8]/60">
                {services.map((s: any) => (
                  <div key={s.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-sm text-[#221b16]">{s.title}</h4>
                      <p className="mt-1 text-xs text-[#6c5b4f] leading-relaxed">{s.description}</p>
                      {s.estimatedHours && (
                        <span className="mt-2 inline-block rounded bg-[#f9f5f0] px-2 py-0.5 text-[10px] text-[#8c7564]">
                          ⏱ Est: {s.estimatedHours} hours
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-[#221b16]">{s.priceBdt} BDT</p>
                      <span className="text-[10px] text-[#8c7564]">Starting from</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-[Fraunces] text-xl font-bold">Client Reviews ({reviews.length})</h3>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-5 w-5 fill-current" />
                <span className="font-bold text-sm text-[#221b16]">{tech.ratingAvg ? tech.ratingAvg.toFixed(1) : '5.0'}</span>
              </div>
            </div>

            {reviewsLoading ? (
              <p className="text-xs text-[#8c7564]">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-xs text-[#8c7564]">No reviews yet. Be the first to review after a service!</p>
            ) : (
              <div className="space-y-6 divide-y divide-[#e4d6c8]/60">
                {reviews.map((r: any, idx: number) => (
                  <div key={r.id} className={`pt-6 ${idx === 0 ? 'pt-0' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-xs text-[#221b16]">{r.customer?.displayName || 'Client'}</p>
                        <p className="text-[10px] text-[#8c7564]">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const avg = (r.workQuality + r.professionalism + r.communication + r.timeliness + r.pricingFairness) / 5.0
                          return (
                            <Star key={i} className={`h-3 w-3 ${i < Math.round(avg) ? 'fill-current' : 'text-[#d7c7b8]'}`} />
                          )
                        })}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="mt-3 text-xs text-[#6c5b4f] leading-relaxed italic">
                        "{r.comment}"
                      </p>
                    )}
                    {/* Dimension breakdown tags */}
                    <div className="mt-3 flex flex-wrap gap-2 text-[9px] text-[#8c7564]">
                      <span className="bg-[#f9f5f0] border border-[#e4d6c8] px-2 py-0.5 rounded">Quality: {r.workQuality}/5</span>
                      <span className="bg-[#f9f5f0] border border-[#e4d6c8] px-2 py-0.5 rounded">Professionalism: {r.professionalism}/5</span>
                      <span className="bg-[#f9f5f0] border border-[#e4d6c8] px-2 py-0.5 rounded">Communication: {r.communication}/5</span>
                      <span className="bg-[#f9f5f0] border border-[#e4d6c8] px-2 py-0.5 rounded">Timeliness: {r.timeliness}/5</span>
                      <span className="bg-[#f9f5f0] border border-[#e4d6c8] px-2 py-0.5 rounded">Fair Pricing: {r.pricingFairness}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Summary & CTA */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#e4d6c8] bg-white p-6 shadow-sm sticky top-24">
            <h3 className="font-[Fraunces] text-lg font-bold mb-4">Service Details</h3>

            <div className="space-y-4 text-xs text-[#6c5b4f]">
              <div className="flex justify-between border-b border-[#f9f5f0] pb-2">
                <span>Completed Jobs</span>
                <span className="font-semibold text-[#221b16]">{tech.completedJobs || 0}</span>
              </div>
              <div className="flex justify-between border-b border-[#f9f5f0] pb-2">
                <span>Success Rate</span>
                <span className="font-semibold text-[#221b16]">{tech.successRate ? `${tech.successRate}%` : '98%'}</span>
              </div>
              <div className="flex justify-between border-b border-[#f9f5f0] pb-2">
                <span>Experience</span>
                <span className="font-semibold text-[#221b16]">{tech.experienceYears || 3} Years</span>
              </div>
              <div className="flex justify-between border-b border-[#f9f5f0] pb-2">
                <span>Response Time</span>
                <span className="font-semibold text-[#221b16]">{tech.responseTime || '30 mins'}</span>
              </div>
            </div>

            <hr className="my-5 border-[#e4d6c8]" />

            {/* Dimension Metrics */}
            <div className="space-y-3">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-[#8c7564]">Metrics breakdown</h4>
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Work Quality</span>
                  <span className="font-semibold">{workQuality} ★</span>
                </div>
                <div className="h-1.5 w-full bg-[#f9f5f0] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${parseFloat(workQuality) * 20}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Professionalism</span>
                  <span className="font-semibold">{professionalism} ★</span>
                </div>
                <div className="h-1.5 w-full bg-[#f9f5f0] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${parseFloat(professionalism) * 20}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Communication</span>
                  <span className="font-semibold">{communication} ★</span>
                </div>
                <div className="h-1.5 w-full bg-[#f9f5f0] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${parseFloat(communication) * 20}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Timeliness</span>
                  <span className="font-semibold">{timeliness} ★</span>
                </div>
                <div className="h-1.5 w-full bg-[#f9f5f0] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${parseFloat(timeliness) * 20}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span>Pricing Fairness</span>
                  <span className="font-semibold">{pricingFairness} ★</span>
                </div>
                <div className="h-1.5 w-full bg-[#f9f5f0] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${parseFloat(pricingFairness) * 20}%` }}></div>
                </div>
              </div>
            </div>

            <hr className="my-5 border-[#e4d6c8]" />

            <Link
              to={`/repair/requests?open=true&techId=${tech.id}&techName=${encodeURIComponent(tech.user?.displayName || '')}`}
              className="w-full text-center block rounded-xl bg-[#221b16] py-3 text-sm font-semibold text-[#f9f5f0] hover:bg-[#3a3028] transition shadow-sm"
            >
              Request {tech.user?.displayName}
            </Link>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-[#8c7564]">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <span>Protected by Escrow Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
