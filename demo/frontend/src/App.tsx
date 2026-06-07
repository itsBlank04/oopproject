import { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import AuthModal from './components/AuthModal'
import SiteLayout from './components/SiteLayout'
import { useAuthModal } from './contexts/AuthModalContext'
import HomePage from './pages/HomePage'
import ProductListPage from './pages/products/ProductListPage'
import ProductDetailPage from './pages/products/ProductDetailPage'
import CartPage from './pages/cart/CartPage'
import CheckoutPage from './pages/cart/CheckoutPage'
import OrderSuccessPage from './pages/cart/OrderSuccessPage'
import AccountOrdersPage from './pages/account/AccountOrdersPage'
import ProfilePage from './pages/account/ProfilePage'
import WishlistPage from './pages/account/WishlistPage'
import AddressesPage from './pages/account/AddressesPage'
import NotificationsPage from './pages/account/NotificationsPage'
import MessagesPage from './pages/account/MessagesPage'
import VendorProductsPage from './pages/vendor/VendorProductsPage'
import VendorDashboardPage from './pages/vendor/VendorDashboardPage'
import VendorAuctionsPage from './pages/vendor/VendorAuctionsPage'
import VendorOrdersPage from './pages/vendor/VendorOrdersPage'
import VendorShopPage from './pages/vendor/VendorShopPage'
import UsedListingsPage from './pages/used/UsedListingsPage'
import UsedListingDetailPage from './pages/used/UsedListingDetailPage'
import CreateUsedListingPage from './pages/used/CreateUsedListingPage'
import AuctionsPage from './pages/auctions/AuctionsPage'
import AuctionDetailPage from './pages/auctions/AuctionDetailPage'
import TechniciansPage from './pages/repair/TechniciansPage'
import RepairRequestsPage from './pages/repair/RepairRequestsPage'
import RepairMarketplacePage from './pages/repair/RepairMarketplacePage'
import RepairRequestDetailPage from './pages/repair/RepairRequestDetailPage'
import TechnicianDetailPage from './pages/repair/TechnicianDetailPage'
import TechnicianDashboardPage from './pages/repair/TechnicianDashboardPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'


function AuthRedirect({ tab }: { tab: 'signin' | 'register' }) {
  const { openModal } = useAuthModal()
  const navigate = useNavigate()

  useEffect(() => {
    openModal(tab)
    navigate('/', { replace: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

export default function App() {
  return (
    <>
      <AuthModal />
      <Routes>
        <Route path="/auth/login" element={<AuthRedirect tab="signin" />} />
        <Route path="/auth/register" element={<AuthRedirect tab="register" />} />

        {/* Products */}
        <Route path="/products" element={<SiteLayout><ProductListPage /></SiteLayout>} />
        <Route path="/products/:id" element={<SiteLayout><ProductDetailPage /></SiteLayout>} />
        <Route path="/shop/:slug" element={<SiteLayout><VendorShopPage /></SiteLayout>} />

        {/* Shopping */}
        <Route path="/cart" element={<SiteLayout><CartPage /></SiteLayout>} />
        <Route path="/checkout" element={<SiteLayout><CheckoutPage /></SiteLayout>} />
        <Route path="/order-success/:id" element={<SiteLayout><OrderSuccessPage /></SiteLayout>} />

        {/* Used Items */}
        <Route path="/used-listings" element={<SiteLayout><UsedListingsPage /></SiteLayout>} />
        <Route path="/used-listings/new" element={<SiteLayout><CreateUsedListingPage /></SiteLayout>} />
        <Route path="/used-listings/:id" element={<SiteLayout><UsedListingDetailPage /></SiteLayout>} />

        {/* Auctions */}
        <Route path="/auctions" element={<SiteLayout><AuctionsPage /></SiteLayout>} />
        <Route path="/auctions/:id" element={<SiteLayout><AuctionDetailPage /></SiteLayout>} />

        {/* Repair */}
        <Route path="/repair" element={<SiteLayout><RepairMarketplacePage /></SiteLayout>} />
        <Route path="/repair/technicians" element={<SiteLayout><TechniciansPage /></SiteLayout>} />
        <Route path="/repair/technicians/:id" element={<SiteLayout><TechnicianDetailPage /></SiteLayout>} />
        <Route path="/repair/requests" element={<SiteLayout><RepairRequestsPage /></SiteLayout>} />
        <Route path="/repair/requests/:id" element={<SiteLayout><RepairRequestDetailPage /></SiteLayout>} />
        <Route path="/repair/dashboard" element={<SiteLayout><TechnicianDashboardPage /></SiteLayout>} />

        {/* Account */}
        <Route path="/account/orders" element={<SiteLayout><AccountOrdersPage /></SiteLayout>} />
        <Route path="/profile" element={<SiteLayout><ProfilePage /></SiteLayout>} />
        <Route path="/wishlist" element={<SiteLayout><WishlistPage /></SiteLayout>} />
        <Route path="/addresses" element={<SiteLayout><AddressesPage /></SiteLayout>} />
        <Route path="/notifications" element={<SiteLayout><NotificationsPage /></SiteLayout>} />
        <Route path="/messages" element={<SiteLayout><MessagesPage /></SiteLayout>} />

        {/* Vendor */}
        <Route path="/vendor/dashboard" element={<SiteLayout><VendorDashboardPage /></SiteLayout>} />
        <Route path="/vendor/products" element={<SiteLayout><VendorProductsPage /></SiteLayout>} />
        <Route path="/vendor/orders" element={<SiteLayout><VendorOrdersPage /></SiteLayout>} />
        <Route path="/vendor/auctions" element={<SiteLayout><VendorAuctionsPage /></SiteLayout>} />

        {/* Admin */}
        <Route path="/admin" element={<SiteLayout><AdminDashboardPage /></SiteLayout>} />

        {/* Home */}
        <Route path="*" element={<SiteLayout><HomePage /></SiteLayout>} />
      </Routes>
    </>
  )
}
