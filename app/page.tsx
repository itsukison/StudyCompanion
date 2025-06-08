import React from 'react'
import { Button } from '@/components/ui/button'
import CompanionsList from '@/components/CompanionsList'
import CTA from '@/components/CTA'
import CompanionCard from '@/components/CompanionCard'

const Page = () => {
  return (
  <main>
    <h1 className="text-2xl underline">Popular Companions</h1>
    <section className="home-section">
      <CompanionCard />
      <CompanionCard />
      <CompanionCard />
    </section>
    <section className="home-section">
      <CompanionsList />
      <CTA />
    </section>
  </main>
  )
}

export default Page