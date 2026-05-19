import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ProductListPage from './pages/products/ProductListPage'
import ProductDetailPage from './pages/products/ProductDetailPage'
import CartPage from './pages/cart/CartPage'
import CheckoutPage from './pages/cart/CheckoutPage'
import AccountOrdersPage from './pages/account/AccountOrdersPage'
import ProfilePage from './pages/account/ProfilePage'
import WishlistPage from './pages/account/WishlistPage'
import AddressesPage from './pages/account/AddressesPage'
import NotificationsPage from './pages/account/NotificationsPage'
import MessagesPage from './pages/account/MessagesPage'
import VendorProductsPage from './pages/vendor/VendorProductsPage'
import VendorDashboardPage from './pages/vendor/VendorDashboardPage'
import VendorAuctionsPage from './pages/vendor/VendorAuctionsPage'
import UsedListingsPage from './pages/used/UsedListingsPage'
import UsedListingDetailPage from './pages/used/UsedListingDetailPage'
import CreateUsedListingPage from './pages/used/CreateUsedListingPage'
import AuctionsPage from './pages/auctions/AuctionsPage'
import AuctionDetailPage from './pages/auctions/AuctionDetailPage'
import TechniciansPage from './pages/repair/TechniciansPage'
import RepairRequestsPage from './pages/repair/RepairRequestsPage'


export default function App() {
  return (
    <>
      <Routes>
        {/* Auth */}
        <Route path="/auth/login" element={<><Navbar /><LoginPage /></>} />
        <Route path="/auth/register" element={<><Navbar /><RegisterPage /></>} />

        {/* Products */}
        <Route path="/products" element={<><Navbar /><ProductListPage /></>} />
        <Route path="/products/:id" element={<><Navbar /><ProductDetailPage /></>} />

        {/* Shopping */}
        <Route path="/cart" element={<><Navbar /><CartPage /></>} />
        <Route path="/checkout" element={<><Navbar /><CheckoutPage /></>} />

        {/* Used Items */}
        <Route path="/used-listings" element={<><Navbar /><UsedListingsPage /></>} />
        <Route path="/used-listings/new" element={<><Navbar /><CreateUsedListingPage /></>} />
        <Route path="/used-listings/:id" element={<><Navbar /><UsedListingDetailPage /></>} />

        {/* Auctions */}
        <Route path="/auctions" element={<><Navbar /><AuctionsPage /></>} />
        <Route path="/auctions/:id" element={<><Navbar /><AuctionDetailPage /></>} />

        {/* Repair */}
        <Route path="/repair/technicians" element={<><Navbar /><TechniciansPage /></>} />
        <Route path="/repair/requests" element={<><Navbar /><RepairRequestsPage /></>} />

        {/* Account */}
        <Route path="/account/orders" element={<><Navbar /><AccountOrdersPage /></>} />
        <Route path="/profile" element={<><Navbar /><ProfilePage /></>} />
        <Route path="/wishlist" element={<><Navbar /><WishlistPage /></>} />
        <Route path="/addresses" element={<><Navbar /><AddressesPage /></>} />
        <Route path="/notifications" element={<><Navbar /><NotificationsPage /></>} />
        <Route path="/messages" element={<><Navbar /><MessagesPage /></>} />

        {/* Vendor */}
        <Route path="/vendor/dashboard" element={<><Navbar /><VendorDashboardPage /></>} />
        <Route path="/vendor/products" element={<><Navbar /><VendorProductsPage /></>} />
        <Route path="/vendor/auctions" element={<><Navbar /><VendorAuctionsPage /></>} />

        {/* Home (catch-all) */}
        <Route path="*" element={<><Navbar /><HomePage /></>} />
      </Routes>
    </>
  )
}
