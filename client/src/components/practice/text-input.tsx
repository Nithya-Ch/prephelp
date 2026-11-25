import { Send } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'

interface TextInputProps {
  onSubmit: (text: string) => void
  isSubmitting?: boolean
  minWords?: number
  placeholder?: string
}

export function TextInput({
  onSubmit,
  isSubmitting = false,
  minWords = 10,
  placeholder = 'Type your response here...',
}: TextInputProps) {
  const [text, setText] = useState('')

  const trimmed = text.trim()
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0
  const charCount = text.length

  const canSubmit = wordCount >= minWords && !isSubmitting

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canSubmit) {
      onSubmit(text)
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label htmlFor="written-response" className="text-sm font-semibold text-ink">
            Written Practice Response
          </label>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span>
              Words:{' '}
              <strong className={wordCount >= minWords ? 'text-ink font-semibold' : 'text-amber-600'}>
                {wordCount}
              </strong>
              {minWords > 0 && ` / ${minWords} min`}
            </span>
            <span>Chars: {charCount}</span>
          </div>
        </div>

        <textarea
          id="written-response"
          rows={7}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="w-full resize-y rounded-xl border border-line bg-canvas p-4 text-sm text-ink placeholder:text-muted/60 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          disabled={isSubmitting}
        />

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted">
            {wordCount < minWords
              ? `Write at least ${minWords - wordCount} more word${minWords - wordCount === 1 ? '' : 's'} to analyze.`
              : 'Ready for structural and vocabulary evaluation.'}
          </p>

          <Button
            type="submit"
            disabled={!canSubmit}
            size="md"
            className="gap-2"
          >
            <Send className="size-4" />
            {isSubmitting ? 'Analyzing...' : 'Submit Written Response'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
