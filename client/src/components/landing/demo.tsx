import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { sampleSkills } from '../../content/landing'
import { Container } from '../layout/container'
import { Reveal } from '../motion/reveal'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { cn } from '../../lib/utils'

export function Demo() {
  const [tab, setTab] = useState('overview')
  const [skill, setSkill] = useState(sampleSkills[0].skill)
  const [loading, setLoading] = useState(false)
  const selected = sampleSkills.find((item) => item.skill === skill) ?? sampleSkills[0]

  return (
    <section id="demo" className="scroll-mt-24 bg-white py-20 sm:py-28">
      <Container>
        <Reveal>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Badge>Interactive preview</Badge>
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-section">
                A session view, with sample numbers
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                Hover a card, switch tabs, or pick a skill. Nothing here is a live analysis.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setLoading((value) => !value)}>
              {loading ? 'Show sample chart' : 'Show loading state'}
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <Card className="mt-10 overflow-hidden">
            <div className="grid lg:grid-cols-[240px_minmax(0,1fr)]">
              <aside className="border-b border-line bg-canvas p-4 lg:border-r lg:border-b-0">
                <p className="px-2 text-xs font-medium tracking-wide text-subtle uppercase">Sample skills</p>
                <ul className="mt-3 space-y-1">
                  {sampleSkills.map((item) => {
                    const active = item.skill === skill
                    return (
                      <li key={item.skill}>
                        <button
                          type="button"
                          onClick={() => {
                            setSkill(item.skill)
                            setTab('overview')
                          }}
                          className={cn(
                            'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                            active ? 'bg-white font-medium text-ink shadow-card' : 'text-muted hover:bg-white',
                          )}
                          aria-pressed={active}
                        >
                          <span>{item.skill}</span>
                          <span className="tabular-nums">{item.score}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </aside>
              <div className="p-5 sm:p-6">
                <Tabs value={tab} onValueChange={setTab}>
                  <TabsList label="Sample session views">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="transcript">Transcript</TabsTrigger>
                    <TabsTrigger value="feedback">Feedback</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview">
                    {loading ? (
                      <div className="space-y-3" aria-hidden>
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-52 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-muted">
                          Selected: <span className="font-medium text-ink">{selected.skill}</span>. {selected.note}
                        </p>
                        <div className="mt-4 h-64 w-full min-w-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sampleSkills} barSize={28}>
                              <CartesianGrid vertical={false} stroke="var(--color-line)" />
                              <XAxis
                                dataKey="skill"
                                tick={{ fill: 'var(--color-subtle)', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                                interval={0}
                                angle={-28}
                                textAnchor="end"
                                height={52}
                              />
                              <YAxis
                                domain={[0, 100]}
                                tick={{ fill: 'var(--color-subtle)', fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                                width={32}
                              />
                              <Tooltip
                                cursor={{ fill: 'var(--color-primary-soft)' }}
                                contentStyle={{
                                  borderRadius: 12,
                                  borderColor: 'var(--color-line)',
                                  fontSize: 13,
                                }}
                              />
                              <Bar dataKey="score" radius={[6, 6, 0, 0]} isAnimationActive>
                                {sampleSkills.map((item) => (
                                  <Cell
                                    key={item.skill}
                                    fill={
                                      item.skill === skill
                                        ? 'var(--color-primary)'
                                        : 'color-mix(in srgb, var(--color-primary) 28%, white)'
                                    }
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-xs text-subtle">Sample scores for the preview. Not a student result.</p>
                      </>
                    )}
                  </TabsContent>
                  <TabsContent value="transcript">
                    <p className="text-xs font-medium tracking-wide text-subtle uppercase">Sample transcript</p>
                    <p className="mt-3 text-base leading-7 text-ink">
                      I think, <mark className="rounded bg-primary-soft px-1 text-ink">um</mark>, the main
                      point is that I led the campus drive. I,{' '}
                      <mark className="rounded bg-primary-soft px-1 text-ink">uh</mark>, started with the
                      schedule{' '}
                      <span className="mx-1 rounded-md border border-dashed border-line px-1.5 py-0.5 text-xs text-subtle">
                        pause 0.8s
                      </span>{' '}
                      and then gave one example from the vendor calls.
                    </p>
                    <ul className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
                      <li className="inline-flex items-center gap-2">
                        <span className="size-3 rounded bg-primary-soft" aria-hidden /> Filler
                      </li>
                      <li className="inline-flex items-center gap-2">
                        <span className="h-3 w-6 rounded border border-dashed border-line" aria-hidden /> Long pause
                      </li>
                    </ul>
                  </TabsContent>
                  <TabsContent value="feedback">
                    <p className="text-xs font-medium tracking-wide text-subtle uppercase">Sample rubric</p>
                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        ['Intro', '3 / 5'],
                        ['Point', '4 / 5'],
                        ['Example', '2 / 5'],
                        ['Conclusion', '3 / 5'],
                        ['Coherence', '3 / 5'],
                      ].map(([label, score]) => (
                        <div key={label} className="rounded-xl border border-line px-4 py-3">
                          <dt className="text-sm text-muted">{label}</dt>
                          <dd className="mt-1 font-semibold text-ink tabular-nums">{score}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-4 text-sm leading-6 text-muted">
                      In this sample the example is the weak spot, so a later selector would prefer a prompt
                      that asks for a concrete example. These marks are not from a model run.
                    </p>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </Card>
        </Reveal>
      </Container>
    </section>
  )
}
