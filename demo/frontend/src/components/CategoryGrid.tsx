import { Link } from 'react-router-dom'

const CATEGORIES = [
  {
    name: 'Electronics',
    slug: 'electronics',
    filter: 'smartphones-tablets,laptops-computers,tvs-home-entertainment,audio-headphones,gaming-consoles,cameras-drones',
    icon: 'devices',
    gradient: 'from-[#f9f5f0] via-[#f0e8df] to-[#e4d6c8]',
  },
  {
    name: 'Furniture',
    slug: 'furniture',
    filter: null,
    icon: 'chair',
    gradient: 'from-[#f9f5f0] via-[#e4d6c8] to-[#d7c7b8]',
  },
  {
    name: 'Home Appliances',
    slug: 'home-appliances',
    filter: 'home-appliances',
    icon: 'kitchen',
    gradient: 'from-[#f5ede4] via-[#e8ddd0] to-[#dccfc2]',
  },
  {
    name: 'Electric',
    slug: 'electric',
    filter: null,
    icon: 'bolt',
    gradient: 'from-[#f9f5f0] via-[#f0e8df] to-[#e4d6c8]',
  },
  {
    name: 'Fashion & Accessories',
    slug: 'fashion-accessories',
    filter: 'fashion-accessories',
    icon: 'styler',
    gradient: 'from-[#f5ede4] via-[#e8ddd0] to-[#dccfc2]',
  },
  {
    name: 'Sports & Outdoors',
    slug: 'sports-outdoors',
    filter: 'sports-outdoors',
    icon: 'sports_tennis',
    gradient: 'from-[#f9f5f0] via-[#e4d6c8] to-[#d7c7b8]',
  },
]

export default function CategoryGrid() {
  return (
    <section className="bg-[#faf6f2] px-6 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8c7564]">Categories</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#221b16]">Shop by Category</h2>
          </div>
          <Link
            to="/products"
            className="hidden items-center gap-1 text-xs font-semibold text-[#6c5b4f] transition-colors hover:text-[#221b16] md:inline-flex"
          >
            All products
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={cat.filter ? `/products?category=${cat.filter}` : '/products'}
              className="group relative flex flex-col items-center rounded-2xl bg-white px-4 py-8 shadow-sm ring-1 ring-[#e4d6c8]/50 transition-all duration-300 hover:shadow-lg hover:ring-[#c4956a]/30"
            >
              <div className={`flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br ${cat.gradient} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                <span className="material-symbols-outlined text-[28px] text-[#6c5b4f]">{cat.icon}</span>
              </div>
              <span className="mt-4 text-center text-sm font-medium text-[#221b16] transition-colors group-hover:text-[#6c5b4f]">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>

        <Link
          to="/products"
          className="mt-8 inline-flex items-center gap-1 text-xs font-semibold text-[#6c5b4f] transition-colors hover:text-[#221b16] md:hidden"
        >
          All products
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  )
}
