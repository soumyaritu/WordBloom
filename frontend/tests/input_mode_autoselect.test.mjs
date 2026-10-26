import assert from 'node:assert/strict'
import { DYSLEXIA_INPUT_DEFAULTS, getInputModeRecommendation, INPUT_MODE_REASONS } from '../config/inputDefaults.ts'

console.log('🧪 Running Test Suite: WordBloom Input Mode Auto-Selection\n' + '='.repeat(60))

// Test 1: Verify exact mappings for all 7 profiles
console.log('\n📍 Test 1: New child — Verify each of the 7 profiles auto-selects mapped mode')
const expectedMappings = {
  phonological: 'voice',
  surface: 'tap',
  visual: 'tap',
  visual_spatial: 'tap',
  double: 'voice',
  double_deficit: 'voice',
  attentional: 'tap',
  unknown: 'voice',
  not_sure: 'voice',
  non_dyslexic: 'type',
}

for (const [profile, expectedMode] of Object.entries(expectedMappings)) {
  const actualMode = DYSLEXIA_INPUT_DEFAULTS[profile]
  assert.equal(actualMode, expectedMode, `Profile '${profile}' should map to '${expectedMode}', got '${actualMode}'`)
  const rec = getInputModeRecommendation(profile)
  assert.equal(rec.recommendedMode, expectedMode, `Recommendation for '${profile}' should be '${expectedMode}'`)
  assert.ok(rec.reason.length > 0, `Recommendation for '${profile}' should have a non-empty reason`)
  console.log(`   ✅ Profile '${profile}' -> Auto-selects '${actualMode}' [Reason: "${rec.reason}"]`)
}

// Test 2: Verify plain wording short reasons
console.log('\n📍 Test 2: Verify short reasons (plain wording, no clinical claims)')
assert.equal(INPUT_MODE_REASONS.voice, 'Saying words out loud takes away the pressure of spelling.')
assert.equal(INPUT_MODE_REASONS.tap, 'Letter tiles keep the letters steady and in order.')
assert.equal(INPUT_MODE_REASONS.type, 'Standard typing.')
assert.equal(INPUT_MODE_REASONS.not_sure, 'An easy way to start while WordBloom learns how they answer.')
console.log('   ✅ All 4 plain-language explanation reasons verified.')

// Test 3: Simulation of ProfileForm behavior on a NEW child (isNew = true)
console.log('\n📍 Test 3: New child form simulation — changing profile updates inputMode while untouched')
function createNewChildForm() {
  const isNew = true
  let dyslexiaType = ''
  let inputMode = ''
  let inputModeTouched = false

  function selectDyslexiaType(typeId) {
    dyslexiaType = typeId
    if (isNew && !inputModeTouched) {
      const rec = DYSLEXIA_INPUT_DEFAULTS[typeId]
      if (rec) inputMode = rec
    }
  }

  function touchInputMode(modeId) {
    inputModeTouched = true
    inputMode = modeId
  }

  return {
    get dyslexiaType() { return dyslexiaType },
    get inputMode() { return inputMode },
    get inputModeTouched() { return inputModeTouched },
    selectDyslexiaType,
    touchInputMode,
  }
}

const formNew = createNewChildForm()
assert.equal(formNew.inputMode, '', 'New child should start with no inputMode selected')

formNew.selectDyslexiaType('phonological')
assert.equal(formNew.inputMode, 'voice', "Selecting 'phonological' should auto-select 'voice'")
console.log("   ✅ Selected 'phonological' -> inputMode is 'voice'")

formNew.selectDyslexiaType('surface')
assert.equal(formNew.inputMode, 'tap', "Changing to 'surface' should auto-select 'tap'")
console.log("   ✅ Changed to 'surface' -> inputMode is 'tap'")

formNew.selectDyslexiaType('double_deficit')
assert.equal(formNew.inputMode, 'voice', "Changing to 'double_deficit' should auto-select 'voice'")
console.log("   ✅ Changed to 'double_deficit' -> inputMode is 'voice'")

formNew.selectDyslexiaType('non_dyslexic')
assert.equal(formNew.inputMode, 'type', "Changing to 'non_dyslexic' should auto-select 'type'")
console.log("   ✅ Changed to 'non_dyslexic' -> inputMode is 'type'")

// Test 4: New child: teacher picks a different input card, then changes profile -> their choice is kept!
console.log('\n📍 Test 4: New child — Teacher manually picks different input card -> choice is strictly preserved')
const formOverride = createNewChildForm()
formOverride.selectDyslexiaType('phonological') // Auto-selects 'voice'
assert.equal(formOverride.inputMode, 'voice')
console.log("   Initial state: Profile 'phonological' auto-selected 'voice'")

// Teacher manually picks 'type'
formOverride.touchInputMode('type')
assert.equal(formOverride.inputMode, 'type')
assert.equal(formOverride.inputModeTouched, true)
console.log("   Teacher manually tapped 'Type it' -> inputMode is 'type', touched = true")

// Teacher now changes profile to 'surface' (which would normally default to 'tap')
formOverride.selectDyslexiaType('surface')
assert.equal(formOverride.inputMode, 'type', "Teacher's manual choice 'type' must be kept even when changing to 'surface'")
console.log("   Changed profile to 'surface' -> inputMode remains 'type' (teacher override preserved)")

// Teacher now changes profile to 'double_deficit'
formOverride.selectDyslexiaType('double_deficit')
assert.equal(formOverride.inputMode, 'type', "Teacher's manual choice 'type' must be kept even when changing to 'double_deficit'")
console.log("   Changed profile to 'double_deficit' -> inputMode remains 'type' (teacher override preserved)")

// Test 5: Existing / demo children — opening or editing them NEVER changes inputMode
console.log('\n📍 Test 5: Existing/demo children — opening or editing them never changes inputMode')
function createExistingChildForm(initialChild) {
  const isNew = false
  let dyslexiaType = initialChild.dyslexiaType
  let inputMode = initialChild.inputMode
  let inputModeTouched = false

  function selectDyslexiaType(typeId) {
    dyslexiaType = typeId
    // For existing child, isNew is false, so auto-select never runs
    if (isNew && !inputModeTouched) {
      const rec = DYSLEXIA_INPUT_DEFAULTS[typeId]
      if (rec) inputMode = rec
    }
  }

  return {
    get dyslexiaType() { return dyslexiaType },
    get inputMode() { return inputMode },
    selectDyslexiaType,
  }
}

// Test Liam: pre-configured as surface with tap
const liamForm = createExistingChildForm({ dyslexiaType: 'surface', inputMode: 'tap' })
assert.equal(liamForm.inputMode, 'tap')
liamForm.selectDyslexiaType('phonological') // If auto-select ran, it would change to voice
assert.equal(liamForm.inputMode, 'tap', "Editing existing child Liam must NOT change inputMode to voice")
console.log("   ✅ Existing child 'Liam' (tap): changing profile to 'phonological' preserves saved inputMode 'tap'")

// Test Emma: pre-configured as phonological with voice
const emmaForm = createExistingChildForm({ dyslexiaType: 'phonological', inputMode: 'voice' })
assert.equal(emmaForm.inputMode, 'voice')
emmaForm.selectDyslexiaType('surface') // If auto-select ran, it would change to tap
assert.equal(emmaForm.inputMode, 'voice', "Editing existing child Emma must NOT change inputMode to tap")
console.log("   ✅ Existing child 'Emma' (voice): changing profile to 'surface' preserves saved inputMode 'voice'")

console.log('\n' + '='.repeat(60) + '\n🎉 ALL TESTS PASSED SUCCESSFULLY!\n' + '='.repeat(60))
