import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { Container } from "@/components/container";
import { JsonLd, buildPageGraph, buildWebPageSchema } from "@/lib/seo/schema";
import { buildProcessMetadata } from "@/lib/seo/routes";
import { loadPageContent, detectEditMode } from "@/lib/page-content/loader";
import { EditableText } from "@/components/editable/EditableText";
import { EditablePhoto } from "@/components/editable/EditablePhoto";
import { EditModeOverlay } from "@/components/editable/EditModeOverlay";

export const metadata: Metadata = buildProcessMetadata();
export const revalidate = 3600;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProcessPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const isEditMode = await detectEditMode(sp);
  const content = await loadPageContent("process", isEditMode);

  return (
    <PageShell>
      <JsonLd
        data={buildPageGraph([
          buildWebPageSchema(
            "/process",
            "Our Remodeling Process | M.R. Renovations"
          ),
        ])}
      />

      {/* -- HERO ------------------------------------------------------- */}
      <section className="bg-paper">
        <Container width="wide" className="py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: text */}
            <div>
              <p className="font-display font-bold uppercase tracking-[0.06em] text-4xl sm:text-5xl text-orange leading-none">
                <EditableText content={content} blockKey="process.hero.eyebrow" fallback="Our Process" />
              </p>
              <div className="mt-4 h-1.5 w-24 bg-orange rounded-full" />
              <h1 className="mt-5 font-display font-bold text-3xl sm:text-4xl tracking-tight text-navy leading-[1.1]">
                <EditableText
                  content={content}
                  blockKey="process.hero.headline"
                  fallback="What to expect when you work with us."
                  multiline
                />
              </h1>
              <p className="mt-5 text-lg text-muted leading-relaxed">
                <EditableText
                  content={content}
                  blockKey="process.hero.subcopy"
                  fallback="At M.R. Renovations, we believe it takes teamwork to achieve your dream. You will have access to:"
                  multiline
                />
              </p>
              <ul className="mt-5 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="mt-2 inline-block w-2 h-2 rounded-full bg-orange shrink-0" aria-hidden="true" />
                  <p className="text-base sm:text-lg text-muted leading-relaxed">
                    <span className="font-display font-semibold text-navy">Customer Service Manager</span> who always answers the phone.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 inline-block w-2 h-2 rounded-full bg-orange shrink-0" aria-hidden="true" />
                  <p className="text-base sm:text-lg text-muted leading-relaxed">
                    <span className="font-display font-semibold text-navy">Sales Representative</span> who will learn your full vision and help translate it to production.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 inline-block w-2 h-2 rounded-full bg-orange shrink-0" aria-hidden="true" />
                  <p className="text-base sm:text-lg text-muted leading-relaxed">
                    <span className="font-display font-semibold text-navy">Production Manager</span> who oversees coordinator and managers to ensure a smooth process.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 inline-block w-2 h-2 rounded-full bg-orange shrink-0" aria-hidden="true" />
                  <p className="text-base sm:text-lg text-muted leading-relaxed">
                    <span className="font-display font-semibold text-navy">Project Coordinator</span> who will help with material selections, permitting details, ordering and logistics.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 inline-block w-2 h-2 rounded-full bg-orange shrink-0" aria-hidden="true" />
                  <p className="text-base sm:text-lg text-muted leading-relaxed">
                    <span className="font-display font-semibold text-navy">Project Manager</span> to coordinate labor, deliveries, progress and quality control, and our employees (not subbed out labor) who put all the pieces together.
                  </p>
                </li>
              </ul>
              <div className="mt-8">
                <Link
                  href="/consultation"
                  className="inline-flex items-center justify-center bg-orange hover:brightness-105 text-ink font-display font-semibold px-7 py-3 rounded-md transition"
                >
                  <EditableText
                    content={content}
                    blockKey="process.hero.cta"
                    fallback="Request a Free Consultation"
                  />
                </Link>
              </div>
            </div>

            {/* Right: photo */}
            <div className="relative border-l-4 border-orange pl-0 overflow-hidden rounded-lg">
              <div className="relative aspect-[4/3] w-full">
                <EditablePhoto
                  content={content}
                  slotKey="process.hero.image"
                  fallback={{
                    src: "/images/whole-home/whole-home-remodel-walnut-kitchen-open-concept-maple-grove-mn.jpg",
                    alt: "Completed whole-home kitchen remodel with open concept layout",
                  }}
                  render={({ src, alt }) => (
                    <Image
                      src={src}
                      alt={alt}
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-cover"
                      priority
                    />
                  )}
                />
              </div>
            </div>

          </div>
        </Container>
      </section>

      {/* -- STAT STRIP ------------------------------------------------- */}
      <section className="bg-white border-y border-faint">
        <Container width="wide" className="py-10">
          <dl className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-faint">
            {[
              { value: "40+",       label: "Years of hands-on experience" },
              { value: "10 steps",  label: "First call through final walkthrough" },
              { value: "Lifetime",  label: "Transferable workmanship warranty" },
            ].map((stat) => (
              <div key={stat.value} className="px-8 py-6 sm:py-0 text-center">
                <div className="mx-auto w-10 h-1 bg-orange rounded-full mb-4" />
                <dt className="font-display font-bold text-3xl text-navy">{stat.value}</dt>
                <dd className="mt-1 text-sm text-muted">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* -- PHASE LABEL: GETTING STARTED ------------------------------- */}
      <div className="bg-paper">
        <Container width="wide" className="pt-16">
          <p className="font-display font-semibold tracking-[0.18em] uppercase text-xs text-muted border-b border-faint pb-3">
            <EditableText
              content={content}
              blockKey="process.phase.getting-started"
              fallback="Getting started"
            />
          </p>
        </Container>
      </div>

      {/* -- STEP 01 ---------------------------------------------------- */}
      <section className="bg-paper">
        <Container width="wide" className="py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="font-display font-bold text-5xl text-orange/20 tracking-tight select-none">01</p>
              <h2 className="mt-2 font-display font-bold text-2xl text-navy tracking-tight">
                <EditableText content={content} blockKey="process.step.01.title" fallback="Reach out" />
              </h2>
              <p className="mt-3 text-base text-muted leading-relaxed">
                <EditableText
                  content={content}
                  blockKey="process.step.01.body"
                  fallback="Call, email, or submit the online form. A real person at M.R. Renovations responds. Not a call center, not an automated booking system. We follow up before anything is scheduled so we understand your project before we send anyone to your door."
                  multiline
                />
              </p>
            </div>
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-soft-orange/30">
              <EditablePhoto
                content={content}
                slotKey="process.step.01.image"
                fallback={{
                  src: "/images/process/process-step-01-reach-out.jpg",
                  alt: "Twin Cities homeowner speaking with M.R. Renovations on the phone from her kitchen and reviewing project notes on a tablet.",
                }}
                render={({ src, alt }) => (
                  <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 45vw, 90vw" className="object-cover" />
                )}
              />
            </div>
          </div>
        </Container>
      </section>

      {/* -- STEP 02 ---------------------------------------------------- */}
      <section className="bg-soft-navy">
        <Container width="wide" className="py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-soft-orange/30 order-2 lg:order-1">
              <EditablePhoto
                content={content}
                slotKey="process.step.02.image"
                fallback={{
                  src: "/images/process/process-step-02-discovery-appointment.jpg",
                  alt: "M.R. Renovations rep in a branded navy polo taking notes on a clipboard while a homeowner points out cabinet details in her kitchen during an on-site discovery visit.",
                }}
                render={({ src, alt }) => (
                  <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 45vw, 90vw" className="object-cover" />
                )}
              />
            </div>
            <div className="order-1 lg:order-2">
              <p className="font-display font-bold text-5xl text-orange/20 tracking-tight select-none">02</p>
              <h2 className="mt-2 font-display font-bold text-2xl text-navy tracking-tight">
                <EditableText content={content} blockKey="process.step.02.title" fallback="Discovery appointment" />
              </h2>
              <p className="mt-3 text-base text-muted leading-relaxed">
                <EditableText
                  content={content}
                  blockKey="process.step.02.body"
                  fallback="Your Dedicated Sales Rep visits the site in person. We take measurements, photos, and detailed notes, and we ask the questions most contractors skip. Structural considerations, permit requirements, how you use the space today, what has been done before. The visit takes 45 to 90 minutes and produces a real scope."
                  multiline
                />
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* -- STEP 03 ---------------------------------------------------- */}
      <section className="bg-paper">
        <Container width="wide" className="py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="font-display font-bold text-5xl text-orange/20 tracking-tight select-none">03</p>
              <h2 className="mt-2 font-display font-bold text-2xl text-navy tracking-tight">
                <EditableText content={content} blockKey="process.step.03.title" fallback="Estimate preparation" />
              </h2>
              <p className="mt-3 text-base text-muted leading-relaxed">
                <EditableText
                  content={content}
                  blockKey="process.step.03.body"
                  fallback="You receive a fully itemized written proposal within one week. It covers scope of work, materials specified by brand and grade, a payment schedule tied to project milestones, and a projected timeline with start date. We schedule a presentation date so we can walk every line with you. No emailed PDFs left without context."
                  multiline
                />
              </p>
            </div>
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-faint">
              <EditablePhoto
                content={content}
                slotKey="process.step.03.image"
                fallback={{
                  src: "/images/process/process-step-03-estimate-preparation.jpg",
                  alt: "M.R. Renovations branded proposal portfolio on a light-wood desk with pens and a plant, ready for the estimate presentation meeting.",
                }}
                render={({ src, alt }) => (
                  <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 45vw, 90vw" className="object-cover" />
                )}
              />
            </div>
          </div>
        </Container>
      </section>

      {/* -- STEPS 04 + 05 --------------------------------------------- */}
      <section className="bg-soft-navy">
        <Container width="wide" className="py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            <div className="bg-white rounded-lg border-l-[3px] border-orange p-8">
              <p className="font-display font-semibold tracking-[0.14em] uppercase text-xs text-muted">Step 04</p>
              <h2 className="mt-3 font-display font-bold text-xl text-navy tracking-tight">
                <EditableText content={content} blockKey="process.step.04.title" fallback="Presentation meeting" />
              </h2>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                <EditableText
                  content={content}
                  blockKey="process.step.04.body"
                  fallback="We walk every line of the estimate with you in person. All decision-makers in the room. Questions answered before ink hits paper. No pressure to sign at the meeting. The proposal is yours to review."
                  multiline
                />
              </p>
            </div>

            <div className="bg-white rounded-lg border-l-[3px] border-orange p-8">
              <p className="font-display font-semibold tracking-[0.14em] uppercase text-xs text-muted">Step 05</p>
              <h2 className="mt-3 font-display font-bold text-xl text-navy tracking-tight">
                <EditableText content={content} blockKey="process.step.05.title" fallback="Signing and next steps" />
              </h2>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                <EditableText
                  content={content}
                  blockKey="process.step.05.body"
                  fallback="Once you sign, the yard sign goes up and the clock starts. A material selection meeting is scheduled 7 to 21 days out, early enough to get materials on order without rushing your decisions."
                  multiline
                />
              </p>
            </div>

          </div>
        </Container>
      </section>

      {/* -- PHASE LABEL: AFTER SIGNING -------------------------------- */}
      <div className="bg-paper">
        <Container width="wide" className="pt-16">
          <p className="font-display font-semibold tracking-[0.18em] uppercase text-xs text-muted border-b border-faint pb-3">
            <EditableText
              content={content}
              blockKey="process.phase.after-signing"
              fallback="After signing"
            />
          </p>
        </Container>
      </div>

      {/* -- STEP 06 ---------------------------------------------------- */}
      <section className="bg-soft-navy">
        <Container width="wide" className="py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="relative h-[230px] rounded-lg overflow-hidden bg-navy/20 order-2 lg:order-1">
              <EditablePhoto
                content={content}
                slotKey="process.step.06.image"
                fallback={{
                  src: "/images/process/process-step-06-material-selection-showroom.jpg",
                  alt: "M.R. Renovations vendor-partner showroom with kitchen vignettes in cream, navy, natural wood, and green cabinetry paired with quartz countertop displays.",
                }}
                render={({ src, alt }) => (
                  <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 45vw, 90vw" className="object-cover" />
                )}
              />
            </div>
            <div className="order-1 lg:order-2">
              <span className="inline-block bg-soft-orange text-orange font-display font-semibold text-xs tracking-[0.14em] uppercase px-3 py-1 rounded-sm mb-3">
                <EditableText
                  content={content}
                  blockKey="process.step.06.badge"
                  fallback="What sets us apart"
                />
              </span>
              <p className="font-display font-bold text-5xl text-orange/20 tracking-tight select-none">06</p>
              <h2 className="mt-2 font-display font-bold leading-tight text-navy" style={{fontSize: "1.4rem"}}>
                <EditableText content={content} blockKey="process.step.06.title" fallback="Material selection" />
              </h2>
              <p className="mt-3 text-muted leading-relaxed" style={{fontSize: "0.96rem"}}>
                <EditableText
                  content={content}
                  blockKey="process.step.06.body"
                  fallback="We walk the showroom with you. Not a catalog, not a sample board left at your door. Actual materials chosen in person from our vendor network. Tile, cabinetry, countertops, fixtures. You see exactly what will be installed in your home before a single order is placed. Our contractor pricing on materials gets passed through to you at no markup on select vendor lines. We also schedule a subcontractor walkthrough during this phase so plumbing and electrical trades can price the actual scope on site, not off a blueprint, so the numbers you sign against are the numbers the trades quoted."
                  multiline
                />
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* -- STEPS 07 + 08 --------------------------------------------- */}
      <section className="bg-paper">
        <Container width="wide" className="py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            <div className="border border-faint rounded-lg p-7">
              <p className="font-display font-semibold tracking-[0.14em] uppercase text-xs text-muted">Step 07</p>
              <h2 className="mt-3 font-display font-bold text-xl text-navy tracking-tight">
                <EditableText content={content} blockKey="process.step.07.title" fallback="Approval Meeting" />
              </h2>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                <EditableText
                  content={content}
                  blockKey="process.step.07.body"
                  fallback="Approval Meeting. We sit down with your final numbers: material selections priced, subcontractor scopes confirmed, allowances reconciled. Any dollar that lands under the proposed budget is refunded back to you before work begins. This is where the estimate becomes real, not a placeholder."
                  multiline
                />
              </p>
            </div>

            <div className="border border-faint rounded-lg p-7">
              <p className="font-display font-semibold tracking-[0.14em] uppercase text-xs text-muted">Step 08</p>
              <h2 className="mt-3 font-display font-bold text-xl text-navy tracking-tight">
                <EditableText content={content} blockKey="process.step.08.title" fallback="Ordering and scheduling" />
              </h2>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                <EditableText
                  content={content}
                  blockKey="process.step.08.body"
                  fallback="Materials are ordered. The project schedule is built. Work begins when materials arrive on site. No placeholder start dates that slip."
                  multiline
                />
              </p>
            </div>

          </div>
        </Container>
      </section>

      {/* -- SEPARATOR ------------------------------------------------- */}
      <div className="bg-paper">
        <Container width="wide">
          <hr className="border-faint" />
        </Container>
      </div>

      {/* -- STEP 09 ---------------------------------------------------- */}
      <section className="bg-soft-navy">
        <Container width="wide" className="py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-soft-orange/30 order-2 lg:order-1">
              <EditablePhoto
                content={content}
                slotKey="process.step.09.image"
                fallback={{
                  src: "/images/process/process-step-09-the-work-jobsite-floor-protection-drywall.jpg",
                  alt: "Active M.R. Renovations bathroom remodel jobsite with orange DensShield backer board installed on the shower walls, ceiling access cut for utilities, contractor toolbox on the floor, and Home Depot ram board floor protection laid across the adjacent room.",
                }}
                render={({ src, alt }) => (
                  <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 45vw, 90vw" className="object-cover" />
                )}
              />
            </div>
            <div className="order-1 lg:order-2">
              <p className="font-display font-bold text-5xl text-orange/20 tracking-tight select-none">09</p>
              <h2 className="mt-2 font-display font-bold leading-tight text-navy" style={{fontSize: "1.4rem"}}>
                <EditableText content={content} blockKey="process.step.09.title" fallback="The Work" />
              </h2>
              <p className="mt-3 text-muted leading-relaxed" style={{fontSize: "0.96rem"}}>
                <EditableText
                  content={content}
                  blockKey="process.step.09.body"
                  fallback="Your home stays protected from day one. Floor protection is laid throughout every path our crew uses. Plastic dust barriers are hung around the active work area and sealed at the perimeter. At the end of every work week, the barriers come down and the space is cleaned so you have the run of your home over the weekend. Then we rehang everything on Monday morning and pick right back up. Your project manager stays hands on while our guys are hard at work. Materials are inventoried at delivery, and every subcontractor is scheduled against a shared schedule you can see."
                  multiline
                />
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* -- STEP 10 ---------------------------------------------------- */}
      <section className="bg-paper">
        <Container width="wide" className="py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="font-display font-bold text-5xl text-orange/20 tracking-tight select-none">10</p>
              <h2 className="mt-2 font-display font-bold leading-tight text-navy" style={{fontSize: "1.4rem"}}>
                <EditableText content={content} blockKey="process.step.10.title" fallback="Final walkthrough and warranty" />
              </h2>
              <p className="mt-3 text-muted leading-relaxed" style={{fontSize: "0.96rem"}}>
                <EditableText
                  content={content}
                  blockKey="process.step.10.body"
                  fallback="Professional cleaning upon completion. A final walkthrough of every space together. Your Lifetime Transferable Workmanship Warranty is signed in person. Manufacturer warranty cards, permit close-out paperwork are all handed over at close."
                  multiline
                />
              </p>
              <div className="mt-6 flex items-start gap-3">
                <svg className="shrink-0 mt-0.5 w-5 h-5 text-orange" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 1.25l2.47 5.01 5.53.804-4 3.896.944 5.5L10 13.77l-4.947 2.69.944-5.5-4-3.896 5.53-.804L10 1.25z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-muted leading-relaxed">
                  The warranty stays with your home if you sell. The new owner is signed up in person. It does not get mailed. It does not expire.{" "}
                  <Link href="/warranty" className="text-orange underline underline-offset-2 hover:text-orange-deep transition-colors">
                    See full warranty terms.
                  </Link>
                </p>
              </div>
            </div>
            <div className="relative h-[230px] rounded-lg overflow-hidden bg-navy/10">
              <EditablePhoto
                content={content}
                slotKey="process.step.10.image"
                fallback={{
                  src: "/images/bathroom/bathroom-remodel-marble-tile-shower-quartz-vanity-maple-grove-mn.jpg",
                  alt: "Completed bathroom remodel with a marble tile shower and quartz vanity in Maple Grove, MN.",
                }}
                render={({ src, alt }) => (
                  <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
                )}
              />
            </div>
          </div>
        </Container>
      </section>

      {/* -- CTA STRIP -------------------------------------------------- */}
      <section className="bg-soft-navy">
        <Container width="wide" className="py-16 lg:py-20 text-center">
          <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-navy">
            <EditableText
              content={content}
              blockKey="process.final.headline"
              fallback="Ready to get started?"
            />
          </h2>
          <p className="mt-4 text-base text-muted max-w-xl mx-auto leading-relaxed">
            <EditableText
              content={content}
              blockKey="process.final.subcopy"
              fallback="Talk to a real person. No automated quotes, no call centers. Free, no-obligation consultation at your site hand delivered by our team."
              multiline
            />
          </p>
          <div className="mt-8">
            <Link
              href="/consultation"
              className="inline-flex items-center justify-center bg-orange hover:brightness-105 text-ink font-display font-semibold px-7 py-3 rounded-md transition"
            >
              <EditableText
                content={content}
                blockKey="process.final.cta"
                fallback="Request a Free Consultation"
              />
            </Link>
          </div>
        </Container>
      </section>

      {content.isEditMode ? (
        <EditModeOverlay currentPath="/process?edit=1" />
      ) : null}

    </PageShell>
  );
}
