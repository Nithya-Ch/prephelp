import {
  AudioLines,
  LayoutDashboard,
  MessageSquareText,
  Mic,
  PenLine,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'

export type Feature = {
  title: string
  body: string
  icon: LucideIcon
}

export const features: Feature[] = [
  {
    title: 'Voice analysis',
    body: 'Pace, pauses, pitch, and energy are scored separately, so a recording is not collapsed into one grade.',
    icon: Mic,
  },
  {
    title: 'Written analysis',
    body: 'Typed answers are checked for grammar by error type, vocabulary range, and how common the words are.',
    icon: PenLine,
  },
  {
    title: 'Filler and pace tracking',
    body: 'Fillers are counted and pauses longer than half a second are marked, so you can see where an answer stalls.',
    icon: AudioLines,
  },
  {
    title: 'Adaptive exercises',
    body: 'The next prompt follows weak skills, how recently you practiced them, and whether you have already seen it.',
    icon: Waypoints,
  },
  {
    title: 'Progress dashboard',
    body: 'Each skill keeps its own score, trend, and uncertainty instead of a single number for the whole student.',
    icon: LayoutDashboard,
  },
  {
    title: 'Detailed feedback',
    body: 'A transcript can mark fillers, grammar spans, and long pauses, with notes on how the answer is structured.',
    icon: MessageSquareText,
  },
]

export const steps = [
  {
    title: 'Speak',
    body: 'Read the prompt, use the prep timer, then answer out loud or in text.',
  },
  {
    title: 'Analyze',
    body: 'Speech and writing are scored on named signals. There is no single hidden grade.',
  },
  {
    title: 'Profile',
    body: 'Your profile stores a score, a trend, and the errors that keep returning.',
  },
  {
    title: 'Adapt',
    body: 'The next exercise changes skill target, difficulty, and feedback tone.',
  },
]

export const trustMarks = [
  'Northwind College',
  'Harbor Institute',
  'Lumen Campus',
  'Fieldstone',
  'Ashworth Hall',
]

/** Product-scope counts. These are not usage, accuracy, or survey results. */
export const stats = [
  {
    value: 7,
    label: 'Signals on a session',
    detail: 'Grammar, vocabulary, fluency, pace, fillers, structure, and confidence.',
  },
  {
    value: 5,
    label: 'Exercise formats planned',
    detail: 'Read-aloud, interview, description, retelling, and a short written answer.',
  },
  {
    value: 4,
    label: 'Steps in the loop',
    detail: 'Speak, analyze, update the profile, then adapt the next exercise.',
  },
]

export const sampleSkills = [
  { skill: 'Grammar', score: 74, note: 'Few agreement errors in this sample. Articles still slip.' },
  { skill: 'Pace', score: 61, note: 'Sample pace sits under a steady interview range.' },
  { skill: 'Fillers', score: 58, note: 'Three fillers in a short sample answer.' },
  { skill: 'Structure', score: 69, note: 'A point is present. The example is thin.' },
  { skill: 'Vocab', score: 77, note: 'Word choice is clear, with little repetition.' },
  { skill: 'Fluency', score: 66, note: 'One pause over half a second in the sample.' },
]

export const faqs = [
  {
    question: 'What does PrepHelp score?',
    answer:
      'A session is designed to report grammar, vocabulary, fluency, speaking pace, filler words, response structure, and a confidence score built from those measurements. The scoring service is not connected on this page.',
  },
  {
    question: 'Will every student get the same exercise?',
    answer:
      'No. The selector is meant to follow each student’s weak skills, how recently they practiced them, and which prompts they have already seen. That selector is not running in this phase.',
  },
  {
    question: 'Is audio stored?',
    answer:
      'Not in this phase, because recording is not live yet. Before any audio is kept, the account will include an explicit consent flag and a way to delete stored data.',
  },
  {
    question: 'Who is it for?',
    answer:
      'Students practicing interviews, presentations, and short written answers. Cohort reporting for institutions is planned. There is no admin console yet.',
  },
  {
    question: 'Can I create an account now?',
    answer:
      'Sign in and Get started are layout previews. They do not create an account, and nothing you type is sent or stored.',
  },
  {
    question: 'Are the numbers on this page real results?',
    answer:
      'No. Charts, skill bars, and testimonial cards are sample layout content. Each block that could be mistaken for a live result is labeled.',
  },
]

export const tourSteps = [
  {
    title: 'Start from a prompt',
    body: 'Each practice item has a prompt, a prep window, and either a spoken or a written answer.',
  },
  {
    title: 'Read the signals',
    body: 'Feedback stays split by skill: grammar, pace, fillers, structure, and the rest. You can see which part moved.',
  },
  {
    title: 'Keep a profile',
    body: 'Scores update across sessions, with a trend so one noisy attempt does not rewrite the profile.',
  },
  {
    title: 'Practice the weak spot',
    body: 'The next exercise is chosen from that profile. Two students with different gaps should not see the same sequence.',
  },
]
