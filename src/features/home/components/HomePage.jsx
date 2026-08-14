import { Hero } from './Hero';
import { FeaturedDestinations } from './FeaturedDestinations';
import { ValueProps } from './ValueProps';
import { DiscoverSpaces } from './DiscoverSpaces';
import { FeaturedSpaces } from './FeaturedSpaces';
import { LuxuryBanner } from './LuxuryBanner';
import { Testimonials } from './Testimonials';

/**
 * Landing route — composed strictly in the order of the Figma flow:
 * hero + search, destinations, value props, featured residences, CTA band,
 * social proof.
 */
export const HomePage = () => (
  <>
    <Hero />
    <FeaturedDestinations />
    <ValueProps />
    <DiscoverSpaces />
    <FeaturedSpaces />
    <LuxuryBanner />
    <Testimonials />
  </>
);
