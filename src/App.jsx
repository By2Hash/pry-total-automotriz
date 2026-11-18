import { useEffect, useState } from 'react'
import { AdminPage } from './components/admin/AdminPage'
import { CatalogPage } from './components/catalog/CatalogPage'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'

function getRoute() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  return path === '/admin' ? 'admin' : 'catalog'
}

export default function App() {
  const [route, setRoute] = useState(getRoute)

  useEffect(() => {
    const handlePopState = () => setRoute(getRoute())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  if (route === 'admin') {
    return <AdminPage />
  }

  return (
    <div className="app">
      <a className="skip-link" href="#catalog-results">
        Saltar al catálogo
      </a>
      <Navbar />
      <CatalogPage />
      <Footer />
    </div>
  )
}
