import { useState } from 'react'
import { tourSteps } from '../../content/landing'
import { Button, ButtonLink } from '../ui/button'
import { Modal } from '../ui/modal'

export function TourModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0)
  const current = tourSteps[step]
  const last = step === tourSteps.length - 1

  return (
    <Modal
      open={open}
      title="Product tour"
      onClose={() => {
        setStep(0)
        onClose()
      }}
    >
      <p className="text-xs font-medium tracking-wide text-subtle uppercase">
        Step {step + 1} of {tourSteps.length}
      </p>
      <h3 className="mt-3 text-lg font-semibold text-ink">{current.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{current.body}</p>
      <div className="mt-4 flex gap-2" aria-hidden>
        {tourSteps.map((item, index) => (
          <span
            key={item.title}
            className={index === step ? 'h-1.5 w-8 rounded-full bg-primary' : 'h-1.5 w-4 rounded-full bg-line'}
          />
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>
          Back
        </Button>
        {last ? (
          <ButtonLink to="/get-started" size="sm" showArrow>
            Get started
          </ButtonLink>
        ) : (
          <Button size="sm" showArrow onClick={() => setStep((value) => value + 1)}>
            Next
          </Button>
        )}
      </div>
    </Modal>
  )
}
