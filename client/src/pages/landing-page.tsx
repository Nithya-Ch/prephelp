import { useState } from 'react'
import { Audience } from '../components/landing/audience'
import { Cta } from '../components/landing/cta'
import { Demo } from '../components/landing/demo'
import { Faq } from '../components/landing/faq'
import { Features } from '../components/landing/features'
import { Footer } from '../components/landing/footer'
import { Hero } from '../components/landing/hero'
import { HowItWorks } from '../components/landing/how-it-works'
import { Stats } from '../components/landing/stats'
import { Testimonials } from '../components/landing/testimonials'
import { TourModal } from '../components/landing/tour-modal'
import { TrustStrip } from '../components/landing/trust-strip'

export function LandingPage() {
  const [tourOpen, setTourOpen] = useState(false)

  return (
    <main id="main">
      <Hero onWatchTour={() => setTourOpen(true)} />
      <TrustStrip />
      <Features />
      <HowItWorks />
      <Audience />
      <Demo />
      <Stats />
      <Testimonials />
      <Faq />
      <Cta />
      <Footer />
      <TourModal open={tourOpen} onClose={() => setTourOpen(false)} />
    </main>
  )
}
