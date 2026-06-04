import HeroSection from '../components/HeroSection'
import CategoryGrid from '../components/CategoryGrid'
import HotProducts from '../components/HotProducts'
import AuctionHighlight from '../components/AuctionHighlight'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoryGrid />
      <HotProducts />
      <AuctionHighlight />
    </>
  )
}
