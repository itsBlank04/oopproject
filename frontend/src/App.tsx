import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import AdminSetup from '@/pages/AdminSetup'
import Dashboard from '@/pages/Dashboard'
import Products from '@/pages/Products'
import ProductDetail from '@/pages/ProductDetail'
import ProductNew from '@/pages/ProductNew'
import Orders from '@/pages/Orders'
import UsedListings from '@/pages/UsedListings'
import UsedListingDetail from '@/pages/UsedListingDetail'
import UsedListingNew from '@/pages/UsedListingNew'
import Repairs from '@/pages/Repairs'
import AuctionNew from '@/pages/AuctionNew'
import Auctions from '@/pages/Auctions'
import AuctionDetail from '@/pages/AuctionDetail'
import AdminAuctions from '@/pages/AdminAuctions'
import FraudAlerts from '@/pages/FraudAlerts'
import Inbox from '@/pages/Inbox'
import Notifications from '@/pages/Notifications'
import Analytics from '@/pages/Analytics'
import Returns from '@/pages/Returns'
import AdminReturns from '@/pages/AdminReturns'
import AdminUsers from '@/pages/AdminUsers'
import Reports from '@/pages/Reports'
import AdminReports from '@/pages/AdminReports'
import BidderReputation from '@/pages/BidderReputation'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/setup" element={<AdminSetup />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/new"
          element={
            <ProtectedRoute role="VENDOR">
              <ProductNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <ProtectedRoute>
              <ProductDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/used"
          element={
            <ProtectedRoute>
              <UsedListings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/used/new"
          element={
            <ProtectedRoute>
              <UsedListingNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/used/:id"
          element={
            <ProtectedRoute>
              <UsedListingDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/repair"
          element={
            <ProtectedRoute>
              <Repairs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/auctions"
          element={
            <ProtectedRoute>
              <Auctions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auctions/new"
          element={
            <ProtectedRoute role="VENDOR">
              <AuctionNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auctions/:id"
          element={
            <ProtectedRoute>
              <AuctionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/auctions"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminAuctions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/fraud"
          element={
            <ProtectedRoute role="ADMIN">
              <FraudAlerts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <Inbox />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/returns"
          element={
            <ProtectedRoute>
              <Returns />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bidder-reputation"
          element={
            <ProtectedRoute>
              <BidderReputation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/returns"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminReturns />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminReports />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
