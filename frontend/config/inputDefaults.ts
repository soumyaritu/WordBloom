export type InputMode = 'voice' | 'tap' | 'type'

export const DYSLEXIA_INPUT_DEFAULTS: Record<string, InputMode> = {
  phonological: 'voice',
  surface: 'tap',
  visual: 'tap',
  visual_spatial: 'tap',
  double: 'voice',
  double_deficit: 'voice',
  attentional: 'tap',
  not_sure: 'voice',
  unknown: 'voice',
  non_dyslexic: 'type',
}

export const INPUT_MODE_REASONS: Record<string, string> = {
  voice: 'Saying words out loud takes away the pressure of spelling.',
  tap: 'Letter tiles keep the letters steady and in order.',
  type: 'Standard typing.',
  not_sure: 'An easy way to start while WordBloom learns how they answer.',
  unknown: 'An easy way to start while WordBloom learns how they answer.',
}

export function getInputModeRecommendation(profileType: string): {
  recommendedMode: InputMode | null
  reason: string
} {
  if (!profileType) {
    return { recommendedMode: null, reason: '' }
  }
  const normalized = profileType.toLowerCase().trim()
  const mode = DYSLEXIA_INPUT_DEFAULTS[normalized] || null
  if (!mode) {
    return { recommendedMode: null, reason: '' }
  }
  const reason = (normalized === 'not_sure' || normalized === 'unknown')
    ? INPUT_MODE_REASONS.not_sure
    : (INPUT_MODE_REASONS[mode] || INPUT_MODE_REASONS.voice)

  return { recommendedMode: mode, reason }
}
