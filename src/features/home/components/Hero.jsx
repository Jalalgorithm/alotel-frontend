import { Image } from '@/components/ui/Image';
import { SearchBar } from '@/components/shared/SearchBar';
import HERO_IMAGE from '@/assets/images/home-hero.jpg';


/** "Premium Stays, Professionally Managed." — landing hero with the search bar. */
export const Hero = () => (
  <section className="relative">
    <Image src={HERO_IMAGE} alt="" wrapperClassName="absolute inset-0 size-full" />
    <div className="absolute inset-0 hero-scrim" aria-hidden="true" />

    <div className="shell relative pb-28 pt-20 sm:pb-32 sm:pt-28">
      <h1 className="max-w-2xl font-display text-[32px] font-bold leading-[1.15] text-white sm:text-[46px]">
        Premium Stays,
        <br />
        Professionally Managed.
      </h1>

      <p className="mt-4 max-w-xl text-[13px] leading-6 text-white/85 sm:text-sm">
        Discover verified luxury residences and extended-stay accommodations across the world&apos;s most
        desirable destinations.
      </p>
    </div>

    {/* The search bar straddles the hero and the section below it. */}
    <div className="shell relative -mt-14 pb-4">
      <SearchBar className="max-w-5xl" />
    </div>
  </section>
);
