// Shared body of the home page.
//
// Rendered by two routes:
//   /          -- the canonical home page
//   /magazine  -- print-campaign landing page (INT-004), noindex
//
// Both share the SAME page_content key namespace ("home"), so a copy or photo
// edit made in the admin shows up on both surfaces with no second CMS entry to
// maintain. The routes differ only in metadata and cache policy; everything
// visible lives here.
//
// Do not add a `metadata` or `revalidate` export to this file -- those are
// route-level concerns and belong in the page.tsx that renders this.

import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Container } from "@/components/container";
import { getRecentPortfolioItems } from "@/lib/supabase/queries";
import { loadPageContent, detectEditMode } from "@/lib/page-content/loader";
import { EditableText } from "@/components/editable/EditableText";
import { EditablePhoto } from "@/components/editable/EditablePhoto";
import { EditModeOverlay } from "@/components/editable/EditModeOverlay";
import type { PortfolioItem } from "@/lib/supabase/types";

// -- Hardcoded fallbacks -----------------------------------------------------
// Every string/image below is the fallback for its corresponding block/slot
// in the page_content tables. Empty rows in the DB fall back to these values,
// so this file remains the source of truth if the DB is ever wiped.

type ServiceEntry = {
  slug: string;
  n: string;
  name: string;
  body: string;
  href: string;
  badge?: string;
  image: string;
  alt: string;
};

const services: readonly ServiceEntry[] = [
  {
    slug: "kitchens",
    n: "01",
    name: "Kitchen Remodeling",
    body: "Custom cabinetry, quartz, islands, and the hidden electrical, plumbing, and structural work that separates a real remodel from a refresh.",
    href: "/services/kitchens",
    badge: "Most Requested",
    image: "/images/service-kitchen.jpg",
    alt: "Recently completed M.R. Renovations kitchen with cherry cabinets and mosaic tile backsplash.",
  },
  {
    slug: "bathrooms",
    n: "02",
    name: "Bathroom Remodeling",
    body: "From en-suite spa retreats to family-friendly mushroom baths. Tile work that lasts decades.",
    href: "/services/bathrooms",
    image: "/images/bathroom/bathroom-remodel-double-vanity-walk-in-shower-maple-grove-mn.jpg",
    alt: "Bathroom remodel with a double vanity and walk-in tiled shower in Maple Grove, MN.",
  },
  {
    slug: "basements",
    n: "03",
    name: "Basement Finishing",
    body: "Code-correct egress, true-height ceilings, finished living square footage that adds resale value.",
    href: "/services/basements",
    image: "/images/service-basement-lvp-tray-ceiling-linear-fireplace-built-in-entertainment-center.jpg",
    alt: "Finished basement with luxury vinyl plank flooring, tray ceiling with cove lighting, linear fireplace, custom built-ins, and a light-fabric sectional.",
  },
  {
    slug: "additions",
    n: "04",
    name: "Home Additions",
    body: "Second-stories, primary-suite additions, four-season rooms. Engineered, permitted, beautiful.",
    href: "/services/additions",
    image: "/images/service-additions.jpg",
    alt: "Home addition framing in progress, structural rough-in visible.",
  },
  {
    slug: "whole-home",
    n: "05",
    name: "Whole-Home Renovation",
    body: "A single contract, a single project manager, one Lifetime Warranty covering the entire home.",
    href: "/services/whole-home",
    image: "/images/service-whole-home.jpg",
    alt: "Open-concept kitchen and living area from a whole-home renovation.",
  },
  {
    slug: "exterior",
    n: "06",
    name: "Roofing, Siding & Exterior",
    body: "Storm restoration, full exterior packages, windows, doors, and garages. James Hardie, GAF, Marvin, and Trex certified.",
    href: "/services/exterior",
    image: "/images/service-exterior.jpg",
    alt: "Exterior of a craftsman-style home with mature landscaping.",
  },
] as const;

const processSteps = [
  {
    n: "01",
    key: "step1",
    title: "Listen & Design",
    body: "In-home consult. We listen first, then sketch. Free design phase included with up to three concepts and two revisions. You see real renderings before any construction begins.",
  },
  {
    n: "02",
    key: "step2",
    title: "Plan & Price",
    body: "Line-itemized, guaranteed-price contract. Every selection priced with our contractor discount. Every assumption stated in writing. We help you stay in budget and on time.",
  },
  {
    n: "03",
    key: "step3",
    title: "Build & Warranty",
    body: "Full team at your disposal. You call, we answer. Multiple points of contact. Weekly walk-throughs. Final punch-list signed by you. Then backed by our Lifetime Transferable Workmanship Warranty.",
  },
] as const;

const fallbackProjects = [
  { area: "Kitchen", weeks: "6 weeks", title: "The Miller Kitchen", location: "Maple Grove, MN" },
  { area: "Basement", weeks: "8 weeks", title: "The Johnson Lower Level", location: "Plymouth, MN" },
  { area: "Addition", weeks: "12 weeks", title: "The Carter Addition", location: "Wayzata, MN" },
] as const;

const offers = [
  {
    key: "card1",
    label: "FREE",
    title: "No-Gimmick Estimates",
    body: "Real in-home consults with a real professional team. No \"today only\" pricing pressure. Ever.",
  },
  {
    key: "card2",
    label: "2%",
    title: "Cash Discount",
    body: "Pay by check or wire and we credit 2% off the full project cost.",
  },
  {
    key: "card3",
    label: "5%",
    title: "Service Discount",
    body: "First Responders, Veterans, and Seniors 65+ receive 5% off your project. Thank you for your service.",
  },
] as const;

/**
 * Resolve the three recent-work cards. In order of preference:
 *   1. Admin-set slot for that position (home.recent.1/2/3) -> renders that portfolio_item.
 *   2. Live portfolio feed (getRecentPortfolioItems).
 *   3. Static fallback (area/title/location placeholders).
 */
async function resolveRecentCards(slots: {
  1: { src: string; alt: string } | null;
  2: { src: string; alt: string } | null;
  3: { src: string; alt: string } | null;
}) {
  const feed = await getRecentPortfolioItems(3);
  return [1, 2, 3].map((i) => {
    const idx = i as 1 | 2 | 3;
    if (slots[idx]) {
      return { kind: "slot" as const, src: slots[idx]!.src, alt: slots[idx]!.alt };
    }
    const item: PortfolioItem | undefined = feed[i - 1];
    if (item) {
      return {
        kind: "feed" as const,
        src: item.photo_url,
        alt: item.caption ?? "Recent M.R. Renovations project",
        service: item.service,
        city: item.city,
        caption: item.caption,
      };
    }
    const fb = fallbackProjects[i - 1];
    return { kind: "fallback" as const, area: fb.area, weeks: fb.weeks, title: fb.title, location: fb.location };
  });
}

export async function HomePageBody({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const isEditMode = await detectEditMode(sp);
  const content = await loadPageContent("home", isEditMode);

  // Precompute recent-card slot resolutions (they can override the feed).
  const recent1 = content.photo("home.recent.1", { src: "", alt: "" });
  const recent2 = content.photo("home.recent.2", { src: "", alt: "" });
  const recent3 = content.photo("home.recent.3", { src: "", alt: "" });
  const recentCards = await resolveRecentCards({
    1: recent1.src ? recent1 : null,
    2: recent2.src ? recent2 : null,
    3: recent3.src ? recent3 : null,
  });

  const heroBg = content.photo("home.hero.background", {
    src: "/images/hero-home.jpg",
    alt: "",
  });

  return (
    <PageShell>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden text-paper bg-navy">
        <Image
          src={heroBg.src}
          alt={heroBg.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-75"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-navy/78 via-navy/40 to-navy/15"
          aria-hidden="true"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-navy-deep/45 via-navy-deep/40 via-70% to-transparent"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 hidden sm:block pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle 340px at 16% 20%, rgb(21 40 73 / 0.85), rgb(21 40 73 / 0) 70%)",
          }}
        />

        <Container width="wide" className="relative py-6 sm:py-10 lg:py-12">
          <div className="max-w-3xl">
            <p className="font-display font-semibold tracking-[0.14em] uppercase text-xs text-soft-orange/95">
              <EditableText
                content={content}
                blockKey="home.hero.eyebrow"
                fallback="Maple Grove, MN \u00b7 Twin Cities"
              />
            </p>
            <h1 className="mt-5 font-display font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] text-paper">
              <span className="accent">
                <EditableText content={content} blockKey="home.hero.headline.line1" fallback="We Design." />
              </span>
              <br />
              <span className="accent">
                <EditableText content={content} blockKey="home.hero.headline.line2" fallback="We Build." />
              </span>
              <br />
              <span className="accent">
                <EditableText content={content} blockKey="home.hero.headline.line3" fallback="We Renovate." />
              </span>
            </h1>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-soft-navy/95 max-w-2xl">
              <EditableText
                content={content}
                blockKey="home.hero.subcopy"
                fallback="Family-owned design-build for Twin Cities homeowners who want their renovation done with craft, transparency, and a Lifetime Transferable Workmanship Warranty."
                multiline
              />
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/consultation"
                className="inline-flex items-center justify-center bg-orange hover:brightness-105 text-ink font-display font-semibold px-6 py-3.5 rounded-md transition"
              >
                <EditableText content={content} blockKey="home.hero.cta.primary" fallback="Get a Free Estimate" />
              </Link>
              <Link
                href="#projects"
                className="inline-flex items-center justify-center bg-paper/10 hover:bg-paper/20 text-paper border border-paper/40 font-display font-semibold px-6 py-3.5 rounded-md transition-colors backdrop-blur-sm"
              >
                <EditableText content={content} blockKey="home.hero.cta.secondary" fallback="See Our Work" />
              </Link>
            </div>
          </div>

          <dl className="mt-8 lg:mt-10 grid grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8 border-t border-paper/15 pt-6">
            <div>
              <dt className="font-display font-semibold tracking-[0.12em] uppercase text-[10px] text-soft-orange/90">
                <EditableText content={content} blockKey="home.hero.stat1.label" fallback="Years of Craft" />
              </dt>
              <dd className="mt-1 font-display font-bold text-3xl text-paper">40+</dd>
            </div>
            <div>
              <dt className="font-display font-semibold tracking-[0.12em] uppercase text-[10px] text-soft-orange/90">
                <EditableText content={content} blockKey="home.hero.stat2.label" fallback="Twin Cities Homes" />
              </dt>
              <dd className="mt-1 font-display font-bold text-3xl text-paper">500+</dd>
            </div>
            <div>
              <dt className="font-display font-semibold tracking-[0.12em] uppercase text-[10px] text-soft-orange/90">
                <EditableText content={content} blockKey="home.hero.stat3.label" fallback="Lifetime Warranty" />
              </dt>
              <dd className="mt-1 font-display font-bold text-3xl text-paper">&infin;</dd>
            </div>
            <div>
              <dt className="font-display font-semibold tracking-[0.12em] uppercase text-[10px] text-soft-orange/90">
                <EditableText content={content} blockKey="home.hero.stat4.label" fallback="Google Rating" />
              </dt>
              <dd className="mt-1 font-display font-bold text-3xl text-paper">
                5.0 <span aria-hidden="true">&#9733;</span>
              </dd>
            </div>
          </dl>
        </Container>
      </section>

      {/* ── WARRANTY + DISCOUNTS + FINANCING STRIP ─────────────── */}
      <section id="warranty" className="bg-navy text-paper">
        <Container width="wide" className="py-6 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 md:items-center">
          <div className="flex items-start md:items-center gap-4">
            <span
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-paper/10 text-orange font-display font-bold text-xl shrink-0"
              aria-hidden="true"
            >
              &infin;
            </span>
            <div>
              <p className="font-display font-bold text-paper text-base sm:text-lg">
                <EditableText content={content} blockKey="home.warranty.title" fallback="Lifetime Transferable Workmanship Warranty" />
              </p>
              <p className="text-sm text-soft-navy/90">
                <EditableText content={content} blockKey="home.warranty.subtitle" fallback="Stays with the home, even if you sell." />
              </p>
              <Link
                href="/warranty"
                className="mt-2 inline-flex items-center justify-center bg-paper text-navy font-display font-semibold text-sm px-5 py-2.5 rounded-md hover:bg-soft-navy transition-colors whitespace-nowrap"
              >
                <EditableText content={content} blockKey="home.warranty.cta" fallback="How the warranty works" />{" "}
                &rarr;
              </Link>
            </div>
          </div>

          <div className="flex items-start md:items-center gap-4 md:border-l md:border-paper/15 md:pl-8">
            <span
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-paper/10 text-orange font-display font-bold text-base shrink-0"
              aria-hidden="true"
            >
              %
            </span>
            <div>
              <p className="font-display font-bold text-paper text-base sm:text-lg">
                <EditableText content={content} blockKey="home.discounts.title" fallback="Discounts" />
              </p>
              <p className="text-sm text-soft-navy/90">
                <EditableText content={content} blockKey="home.discounts.line1" fallback="2% cash or check." />
              </p>
              <p className="text-sm text-soft-navy/90">
                <EditableText content={content} blockKey="home.discounts.line2" fallback="5% Veterans, Seniors, First Responders." />
              </p>
            </div>
          </div>

          <div className="flex items-start md:items-center gap-4 md:border-l md:border-paper/15 md:pl-8">
            <span
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-paper/10 text-orange font-display font-bold text-lg shrink-0"
              aria-hidden="true"
            >
              $
            </span>
            <div className="min-w-0">
              <p className="font-display font-bold text-paper text-base sm:text-lg">
                <EditableText content={content} blockKey="home.financing.title" fallback="Financing available" />
              </p>
              <p className="text-sm text-soft-navy/90">
                <EditableText content={content} blockKey="home.financing.subtitle" fallback="Flexible monthly payments to fit your budget." />
              </p>
              <Link
                href="/financing"
                className="mt-2 inline-flex items-center justify-center bg-paper text-navy font-display font-semibold text-sm px-5 py-2.5 rounded-md hover:bg-soft-navy transition-colors whitespace-nowrap"
              >
                <EditableText content={content} blockKey="home.financing.cta" fallback="See financing options" />{" "}
                &rarr;
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────── */}
      <section id="services" className="bg-paper">
        <Container width="wide" className="py-20 lg:py-24">
          <p className="font-display font-semibold tracking-[0.14em] uppercase text-xs text-orange-deep">
            <EditableText content={content} blockKey="home.services.eyebrow" fallback="What we build" />
          </p>
          <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-ink max-w-3xl leading-[1.1]">
            <EditableText
              content={content}
              blockKey="home.services.headline"
              fallback="Whole-home transformations and specialty remodels for Twin Cities families."
              multiline
            />
          </h2>
          <p className="mt-5 text-base sm:text-lg text-muted leading-relaxed max-w-2xl">
            <EditableText
              content={content}
              blockKey="home.services.subcopy"
              fallback="Six core practices. Every project led by our full M.R. Renovation team. Every detail backed by our Lifetime Workmanship Warranty."
              multiline
            />
          </p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => (
              <article key={s.slug} className="group">
                <Link href={s.href} className="block">
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-navy">
                    <EditablePhoto
                      content={content}
                      slotKey={`home.services.${s.slug}.image`}
                      fallback={{ src: s.image, alt: s.alt }}
                      render={(resolved) => (
                        <Image
                          src={resolved.src}
                          alt={resolved.alt}
                          fill
                          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    />
                    {s.badge ? (
                      <span className="absolute top-3 left-3 inline-flex items-center bg-orange text-ink font-display font-semibold text-[10px] tracking-[0.1em] uppercase px-2.5 py-1 rounded">
                        {s.badge}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="font-display font-semibold text-orange-deep text-sm">{s.n}</span>
                    {s.badge ? <span className="text-xs text-muted">{s.badge}</span> : null}
                  </div>
                  <h3 className="mt-1 font-display font-bold text-xl text-ink group-hover:text-navy transition-colors">
                    <EditableText content={content} blockKey={`home.services.${s.slug}.name`} fallback={s.name} />
                  </h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">
                    <EditableText content={content} blockKey={`home.services.${s.slug}.body`} fallback={s.body} multiline />
                  </p>
                  <p className="mt-3 text-sm font-display font-semibold text-orange-deep">
                    View {s.name.toLowerCase().split(",")[0]} &rarr;
                  </p>
                </Link>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* ── PROCESS ─────────────────────────────────────────── */}
      <section id="process" className="bg-cream">
        <Container width="wide" className="py-20 lg:py-24">
          <p className="font-display font-semibold tracking-[0.14em] uppercase text-xs text-orange-deep">
            <EditableText content={content} blockKey="home.process.eyebrow" fallback="How we move" />
          </p>
          <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-ink max-w-3xl leading-[1.1]">
            <EditableText
              content={content}
              blockKey="home.process.headline"
              fallback="A transparent process, start to finish."
              multiline
            />
          </h2>
          <p className="mt-5 text-base sm:text-lg text-muted leading-relaxed max-w-2xl">
            <EditableText
              content={content}
              blockKey="home.process.subcopy"
              fallback="No mystery line items. No vanishing project managers. No surprise change orders. Just three clear phases and the same M.R. team from estimate to final walkthrough."
              multiline
            />
          </p>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-x-12 gap-y-10 lg:divide-x lg:divide-cream-deep">
            {processSteps.map((step, i) => (
              <div key={step.n} className={i > 0 ? "lg:pl-12" : ""}>
                <p className="font-display font-bold text-4xl text-orange-deep">{step.n}</p>
                <p className="mt-4 font-display font-bold text-xl text-ink">
                  <EditableText content={content} blockKey={`home.process.${step.key}.title`} fallback={step.title} />
                </p>
                <p className="mt-3 text-sm text-muted leading-relaxed">
                  <EditableText
                    content={content}
                    blockKey={`home.process.${step.key}.body`}
                    fallback={step.body}
                    multiline
                  />
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── RECENT WORK ──────────────────────────────────────── */}
      <section id="projects" className="bg-navy-deep text-paper">
        <Container width="wide" className="py-20 lg:py-24">
          <p className="font-display font-semibold tracking-[0.14em] uppercase text-xs text-orange-on-dark">
            <EditableText content={content} blockKey="home.recent.eyebrow" fallback="Recent work" />
          </p>
          <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-paper max-w-3xl leading-[1.1]">
            <EditableText
              content={content}
              blockKey="home.recent.headline"
              fallback="A few Twin Cities transformations."
              multiline
            />
          </h2>
          <p className="mt-5 text-base sm:text-lg text-soft-navy/85 leading-relaxed max-w-2xl">
            <EditableText
              content={content}
              blockKey="home.recent.subcopy"
              fallback="Real homes. Real budgets. Real timelines. Click any project for the full before-and-after story, scope, and homeowner interview."
              multiline
            />
          </p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentCards.map((card, i) => {
              const slotKey = `home.recent.${i + 1}` as const;
              const fallback = { src: "", alt: "" };
              return (
                <div key={i} className="group block rounded-lg overflow-hidden bg-navy">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {card.kind === "fallback" ? (
                      <EditablePhoto
                        content={content}
                        slotKey={slotKey}
                        fallback={fallback}
                        render={() => (
                          <div className="w-full h-full bg-navy-deep flex items-center justify-center">
                            <span className="font-display font-bold text-5xl text-paper/15 select-none pointer-events-none tracking-tight" aria-hidden="true">
                              {card.area}
                            </span>
                          </div>
                        )}
                      />
                    ) : (
                      <EditablePhoto
                        content={content}
                        slotKey={slotKey}
                        fallback={{ src: card.src, alt: card.alt }}
                        render={(resolved) => (
                          <Image
                            src={resolved.src}
                            alt={resolved.alt}
                            fill
                            sizes="(min-width: 1024px) 33vw, 50vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                      />
                    )}
                  </div>
                  <div className="p-5 border-t border-paper/15">
                    {card.kind === "feed" ? (
                      <>
                        <p className="font-display font-semibold tracking-[0.12em] uppercase text-[10px] text-orange-on-dark">
                          {[card.service, card.city].filter(Boolean).join(", ") || "Recent work"}
                        </p>
                        <p className="mt-1 font-display font-bold text-paper text-lg">
                          {card.caption ?? "Project"}
                        </p>
                      </>
                    ) : card.kind === "fallback" ? (
                      <>
                        <p className="font-display font-semibold tracking-[0.12em] uppercase text-[10px] text-orange-on-dark">
                          {card.area} &middot; {card.weeks}
                        </p>
                        <p className="mt-1 font-display font-bold text-paper text-lg">{card.title}</p>
                        <p className="text-sm text-soft-navy/85">{card.location}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-display font-semibold tracking-[0.12em] uppercase text-[10px] text-orange-on-dark">
                          Featured
                        </p>
                        <p className="mt-1 font-display font-bold text-paper text-lg">
                          {card.alt || "Recent M.R. Renovations project"}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── REVIEWS ─────────────────────────────────────────── */}
      <section id="reviews" className="bg-cream">
        <Container width="narrow" className="py-20 lg:py-24 text-center">
          <p className="text-orange-deep text-lg" aria-hidden="true">
            &#9733; &#9733; &#9733; &#9733; &#9733;
          </p>
          <blockquote className="mt-6">
            <p className="text-base sm:text-lg text-ink leading-relaxed">
              <EditableText
                content={content}
                blockKey="home.testimonial.quote"
                fallback="I have completed 2 projects with M.R. Renovations and am just starting my third. The first was a kitchen renovation in the lower level of my house. MR did an excellent job assembling appropriate contractors for the project, managing them to achieve a high-quality result, and provided a lifetime warranty. They worked directly with us to identify options and select products from several suppliers to meet our stated budgets. Cost, quality and schedule were all very well managed. The second project was to improve the sump pump system and water drainage around a rental property. Again, M.R. quickly proposed an approach, found and managed appropriate contractors, and ensured that a quality job was completed. Currently, we are renovating our main kitchen and M.R. is consistently providing the same excellent services. M.R. has worked closely with us to get great results in all our projects. I definitely recommend their services."
                render={(v) => <>&ldquo;{v}&rdquo;</>}
                multiline
              />
            </p>
            <footer className="mt-6 text-sm">
              <p className="font-display font-semibold text-ink tracking-[0.08em] uppercase text-xs">
                <EditableText
                  content={content}
                  blockKey="home.testimonial.attribution"
                  fallback="Ken G \u00b7 Kitchen Remodel \u00b7 Maple Grove"
                />
              </p>
            </footer>
          </blockquote>
        </Container>
      </section>

      {/* ── CURRENT OFFERS ──────────────────────────────────── */}
      <section id="offers" className="bg-paper">
        <Container width="wide" className="py-20 lg:py-24">
          <p className="font-display font-semibold tracking-[0.14em] uppercase text-xs text-orange-deep">
            <EditableText content={content} blockKey="home.offers.eyebrow" fallback="Current offers" />
          </p>
          <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-ink max-w-3xl leading-[1.1]">
            <EditableText
              content={content}
              blockKey="home.offers.headline"
              fallback="Honest savings, no gimmicks."
              multiline
            />
          </h2>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {offers.map((o) => (
              <div key={o.key} className="rounded-xl bg-cream border border-cream-deep p-7">
                <p className="font-display font-bold text-3xl text-orange-deep">
                  <EditableText content={content} blockKey={`home.offers.${o.key}.label`} fallback={o.label} />
                </p>
                <p className="mt-4 font-display font-bold text-lg text-ink">
                  <EditableText content={content} blockKey={`home.offers.${o.key}.title`} fallback={o.title} />
                </p>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  <EditableText content={content} blockKey={`home.offers.${o.key}.body`} fallback={o.body} multiline />
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <section className="bg-navy text-paper">
        <Container width="wide" className="py-20 lg:py-24 text-center">
          <p className="font-display font-semibold tracking-[0.14em] uppercase text-xs text-orange-on-dark">
            <EditableText content={content} blockKey="home.final.eyebrow" fallback="Ready when you are" />
          </p>
          <h2 className="mt-3 font-display font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-paper leading-[1.05] max-w-3xl mx-auto">
            <EditableText
              content={content}
              blockKey="home.final.headline"
              fallback="Let's build something that lasts."
              multiline
            />
          </h2>
          <p className="mt-5 text-base sm:text-lg text-soft-navy/85 leading-relaxed max-w-xl mx-auto">
            <EditableText
              content={content}
              blockKey="home.final.subcopy"
              fallback="Tell us about your project. We'll get back to you within one business day with next steps -- no pressure, no obligation."
              multiline
            />
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/consultation"
              className="inline-flex items-center justify-center bg-orange hover:brightness-105 text-ink font-display font-semibold px-6 py-3.5 rounded-md transition"
            >
              <EditableText content={content} blockKey="home.final.cta.primary" fallback="Start your free estimate" />
            </Link>
            <a
              href="tel:7639002024"
              className="inline-flex items-center justify-center bg-paper/10 hover:bg-paper/20 text-paper border border-paper/40 font-display font-semibold px-6 py-3.5 rounded-md transition-colors"
            >
              <EditableText content={content} blockKey="home.final.cta.secondary" fallback="Or call 763-900-2024" />
            </a>
          </div>
        </Container>
      </section>

      {isEditMode ? <EditModeOverlay currentPath="/?edit=1" /> : null}
    </PageShell>
  );
}
