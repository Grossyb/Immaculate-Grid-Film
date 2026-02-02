import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { HomePage } from './components/home/HomePage'
import { CoStarsPage } from './pages/CoStarsPage'
import { FilmographyPage } from './pages/FilmographyPage'
import { SixDegreesPage } from './pages/SixDegreesPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/costars" element={<CoStarsPage />} />
        <Route path="/filmography" element={<FilmographyPage />} />
        <Route path="/sixdegrees" element={<SixDegreesPage />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  )
}

export default App
