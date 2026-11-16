import { CatalogPage } from './components/catalog/CatalogPage'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'

export default function App() {
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
