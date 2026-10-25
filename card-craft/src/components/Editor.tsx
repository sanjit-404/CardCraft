import { useRef, useState } from 'react'
import type Konva from 'konva'
import CardCanvas from './CardCanvas'
import CoBrandPicker from './CoBrandPicker'
import FinishPicker from './FinishPicker'
import ReviewPanel from './ReviewPanel'
import { createCard, describeError, updateCard } from '../api'
import { cardNumberSchema, nameSchema } from '../cardSchema'
import { detectNetwork, formatCardNumber, maskCardNumber, NETWORK_NAMES, onlyDigits } from '../cardNumber'
import { downloadPdf, downloadPng } from '../exportCard'
import { getSavedFinish, resolveFinish, saveFinish, type FinishId } from '../finishes'
import { showToast } from '../toast'
import { DEFAULT_CO_BRAND, type Card, type CoBrand, type Point } from '../types'

type EditorProps = {
  initialCard: Card | null // the design that was opened, or null for a new one
  onSaved: (card: Card) => void // tells the list about the saved card
  onNewDesign: () => void
}

const DEFAULT_NAME_POS: Point = { x: 24, y: 220 }

// The design studio: the card on centre stage, the controls in a side panel,
// plus saving, exports and the AI review.
// The parent gives it a new "key" when you open a design or start a new one,
// so React starts it fresh with that design's values.
function Editor({ initialCard, onSaved, onNewDesign }: EditorProps) {
  // savedCard is this design as the server last saved it (null until the first save)
  const [savedCard, setSavedCard] = useState<Card | null>(initialCard)
  const [name, setName] = useState(initialCard?.name ?? '')
  // The full number is never stored on the server, so an opened design starts
  // with an empty box. Empty means "keep the saved number".
  const [cardNumber, setCardNumber] = useState('')
  const [namePos, setNamePos] = useState<Point>(initialCard?.namePos ?? DEFAULT_NAME_POS)
  const [coBrand, setCoBrand] = useState<CoBrand>(initialCard?.coBrand ?? DEFAULT_CO_BRAND)
  // Visual only: never sent to the backend, remembered in this browser
  const [finishId, setFinishId] = useState<FinishId>(initialCard ? getSavedFinish(initialCard._id) : 'auto')

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [isMakingPdf, setIsMakingPdf] = useState(false)

  // The Konva stage, so we can turn the canvas into a PNG or PDF
  const stageRef = useRef<Konva.Stage>(null)

  // ---- Validation (runs on every render, so errors show as you type) ----
  const isNew = savedCard === null
  const hasTypedNumber = cardNumber.trim() !== ''
  const nameResult = nameSchema.safeParse(name)
  // A new design needs a number. An opened one only checks the number if you typed one.
  const numberResult = isNew || hasTypedNumber ? cardNumberSchema.safeParse(cardNumber) : null
  const nameError = nameResult.success ? '' : nameResult.error.issues[0].message
  const numberError = numberResult && !numberResult.success ? numberResult.error.issues[0].message : ''
  const isValid = nameResult.success && (numberResult === null || numberResult.success)

  // ---- What the canvas shows ----
  const typedDigits = onlyDigits(cardNumber)
  const network = typedDigits ? detectNetwork(typedDigits) : (savedCard?.network ?? 'unknown')
  const finish = resolveFinish(finishId, network)
  let numberText = '•••• •••• •••• ••••'
  if (hasTypedNumber) numberText = cardNumber
  else if (savedCard) numberText = maskCardNumber(savedCard.cardLast4, savedCard.network)

  // Any edit makes the "saved" state out of date, so reset it
  function markEdited() {
    setSaveStatus('idle')
  }

  async function handleSave() {
    if (!nameResult.success) return
    if (numberResult && !numberResult.success) return
    // The checked number as digits only, or undefined if the box was left blank
    const newNumber = numberResult?.data
    // coBrand is always sent whole (all three fields), as the backend requires.
    // The finish is NOT included: it only lives in this browser.
    const fields = { name: nameResult.data, namePos, coBrand }

    setSaveStatus('saving')
    try {
      let card: Card
      if (savedCard === null) {
        // New design: POST. A new design always checks the number, so it is set here.
        card = await createCard({ ...fields, cardNumber: newNumber ?? '' })
      } else {
        // Opened design: PUT. Only send cardNumber if the user typed a new one.
        card = await updateCard(savedCard._id, newNumber ? { ...fields, cardNumber: newNumber } : fields)
      }
      saveFinish(card._id, finishId)
      setSavedCard(card)
      // The server only kept the last 4 digits, so show the masked number from now on
      setCardNumber('')
      setSaveStatus('saved')
      showToast(isNew ? 'Design saved to My designs' : 'Changes saved', 'success')
      onSaved(card)
    } catch (err) {
      setSaveStatus('error')
      showToast(`Couldn't save: ${describeError(err)}`, 'error')
    }
  }

  function handlePng() {
    if (!stageRef.current) return
    try {
      downloadPng(stageRef.current)
      showToast('PNG downloaded', 'success')
    } catch {
      showToast("Couldn't create the PNG. Please try again.", 'error')
    }
  }

  async function handlePdf() {
    if (!stageRef.current) return
    setIsMakingPdf(true)
    try {
      await downloadPdf(stageRef.current)
      showToast('PDF downloaded at real card size (85.6 × 54 mm)', 'success')
    } catch {
      showToast("Couldn't create the PDF. Please try again.", 'error')
    } finally {
      setIsMakingPdf(false)
    }
  }

  let saveLabel = isNew ? 'Save design' : 'Save changes'
  if (saveStatus === 'saving') saveLabel = 'Saving…'
  if (saveStatus === 'saved') saveLabel = '✓ Saved'

  return (
    <section className="studio">
      {/* Centre stage: the card itself */}
      <div className="stage-area">
        <div className="stage-head rise">
          <div>
            <p className="eyebrow">{isNew ? 'New design' : 'Editing'}</p>
            <h2 className="stage-title">{isNew ? 'Craft your card' : savedCard.name}</h2>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onNewDesign}>
            + New design
          </button>
        </div>

        <CardCanvas
          name={name}
          numberText={numberText}
          network={network}
          finish={finish}
          namePos={namePos}
          coBrand={coBrand}
          stageRef={stageRef}
          onNamePosChange={(pos) => {
            setNamePos(pos)
            markEdited()
          }}
        />

        <div className="stage-toolbar rise">
          <p className="hint">Drag the name on the card to move it.</p>
          <div className="button-row">
            <button type="button" className="btn btn-ghost" onClick={handlePng}>
              ↓ PNG
            </button>
            <button type="button" className="btn btn-ghost" onClick={handlePdf} disabled={isMakingPdf}>
              {isMakingPdf ? 'Making PDF…' : '↓ PDF (real size)'}
            </button>
          </div>
        </div>

        {/* The AI review needs a saved design, because the server reviews what it has stored */}
        {savedCard ? (
          <ReviewPanel key={savedCard._id} cardId={savedCard._id} />
        ) : (
          <p className="glass review-placeholder rise">✦ Save your design to unlock an AI design review.</p>
        )}
      </div>

      {/* Side panel: all the controls */}
      <aside className="glass control-panel rise" aria-label="Design controls">
        <fieldset className="control-group">
          <legend>Details</legend>
          <label className="field">
            <span className="field-label">Cardholder name</span>
            <input
              type="text"
              value={name}
              placeholder="e.g. Alex Kumar"
              aria-invalid={nameError !== ''}
              onChange={(e) => {
                setName(e.target.value)
                markEdited()
              }}
            />
            {nameError && <span className="field-error">{nameError}</span>}
          </label>

          <label className="field">
            <span className="field-label">Card number</span>
            <input
              type="text"
              className="mono"
              inputMode="numeric"
              autoComplete="off"
              value={cardNumber}
              placeholder={savedCard ? `Leave blank to keep •••• ${savedCard.cardLast4}` : '4111 1111 1111 1111'}
              aria-invalid={numberError !== ''}
              onChange={(e) => {
                setCardNumber(formatCardNumber(e.target.value))
                markEdited()
              }}
            />
            {numberError && <span className="field-error">{numberError}</span>}
          </label>

          <div className="pill-row">
            <span className="pill">Network: {NETWORK_NAMES[network]}</span>
            {/* Follows the same zod checks that decide whether we can save */}
            <span className={`pill ${isValid ? 'pill-valid' : 'pill-invalid'}`}>{isValid ? '✓ Valid' : '✗ Invalid'}</span>
          </div>
        </fieldset>

        <FinishPicker
          value={finishId}
          network={network}
          onChange={(id) => {
            setFinishId(id)
            markEdited()
          }}
        />

        <CoBrandPicker
          coBrand={coBrand}
          onChange={(next) => {
            setCoBrand(next)
            markEdited()
          }}
        />

        <div className="save-bar">
          <button
            type="button"
            className={`btn btn-primary btn-block ${saveStatus === 'saved' ? 'is-saved' : ''}`}
            onClick={handleSave}
            disabled={!isValid || saveStatus === 'saving'}
          >
            {saveLabel}
          </button>
        </div>
      </aside>
    </section>
  )
}

export default Editor
