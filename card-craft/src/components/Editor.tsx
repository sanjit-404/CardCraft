import { useRef, useState } from 'react'
import type Konva from 'konva'
import CardCanvas from './CardCanvas'
import CoBrandPicker from './CoBrandPicker'
import ReviewPanel from './ReviewPanel'
import { createCard, describeError, updateCard } from '../api'
import { cardNumberSchema, nameSchema } from '../cardSchema'
import { detectNetwork, formatCardNumber, maskCardNumber, NETWORK_NAMES, onlyDigits } from '../cardNumber'
import { downloadPdf, downloadPng } from '../exportCard'
import { DEFAULT_CO_BRAND, type Card, type CoBrand, type Point } from '../types'

type EditorProps = {
  initialCard: Card | null // the design that was opened, or null for a new one
  onSaved: (card: Card) => void // tells the list about the saved card
}

const DEFAULT_NAME_POS: Point = { x: 24, y: 220 }

// The design editor: the form, the live canvas, saving, exports and the AI review.
// The parent gives it a new "key" when you open a design or start a new one,
// so React starts it fresh with that design's values.
function Editor({ initialCard, onSaved }: EditorProps) {
  // savedCard is this design as the server last saved it (null until the first save)
  const [savedCard, setSavedCard] = useState<Card | null>(initialCard)
  const [name, setName] = useState(initialCard?.name ?? '')
  // The full number is never stored on the server, so an opened design starts
  // with an empty box. Empty means "keep the saved number".
  const [cardNumber, setCardNumber] = useState('')
  const [namePos, setNamePos] = useState<Point>(initialCard?.namePos ?? DEFAULT_NAME_POS)
  const [coBrand, setCoBrand] = useState<CoBrand>(initialCard?.coBrand ?? DEFAULT_CO_BRAND)

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState('')
  const [exportStatus, setExportStatus] = useState<'idle' | 'working' | 'error'>('idle')

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
  let numberText = '•••• •••• •••• ••••'
  if (hasTypedNumber) numberText = cardNumber
  else if (savedCard) numberText = maskCardNumber(savedCard.cardLast4, savedCard.network)

  // Any edit makes the "Design saved!" message out of date, so clear it
  function markEdited() {
    setSaveStatus('idle')
  }

  async function handleSave() {
    if (!nameResult.success) return
    if (numberResult && !numberResult.success) return
    // The checked number as digits only, or undefined if the box was left blank
    const newNumber = numberResult?.data
    // coBrand is always sent whole (all three fields), as the backend requires
    const fields = { name: nameResult.data, namePos, coBrand }

    setSaveStatus('saving')
    setSaveError('')
    try {
      let card: Card
      if (savedCard === null) {
        // New design: POST. A new design always checks the number, so it is set here.
        card = await createCard({ ...fields, cardNumber: newNumber ?? '' })
      } else {
        // Opened design: PUT. Only send cardNumber if the user typed a new one.
        card = await updateCard(savedCard._id, newNumber ? { ...fields, cardNumber: newNumber } : fields)
      }
      setSavedCard(card)
      // The server only kept the last 4 digits, so show the masked number from now on
      setCardNumber('')
      setSaveStatus('saved')
      onSaved(card)
    } catch (err) {
      setSaveError(describeError(err))
      setSaveStatus('error')
    }
  }

  function handlePng() {
    if (!stageRef.current) return
    try {
      downloadPng(stageRef.current)
      setExportStatus('idle')
    } catch {
      setExportStatus('error')
    }
  }

  async function handlePdf() {
    if (!stageRef.current) return
    setExportStatus('working')
    try {
      await downloadPdf(stageRef.current)
      setExportStatus('idle')
    } catch {
      setExportStatus('error')
    }
  }

  let saveLabel = isNew ? 'Save design' : 'Save changes'
  if (saveStatus === 'saving') saveLabel = 'Saving…'

  return (
    <section className="editor">
      <h2>{isNew ? 'New design' : `Editing "${savedCard.name}"`}</h2>

      <CardCanvas
        name={name}
        numberText={numberText}
        network={network}
        namePos={namePos}
        coBrand={coBrand}
        stageRef={stageRef}
        onNamePosChange={(pos) => {
          setNamePos(pos)
          markEdited()
        }}
      />
      <p className="hint">Tip: drag the name on the card to move it.</p>

      <div className="panel">
        <div className="form-grid">
          <label className="field">
            <span>Cardholder name</span>
            <input
              type="text"
              value={name}
              placeholder="e.g. Alex Kumar"
              onChange={(e) => {
                setName(e.target.value)
                markEdited()
              }}
            />
            {nameError && <p className="error-text">{nameError}</p>}
          </label>

          <label className="field">
            <span>Card number</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={cardNumber}
              placeholder={savedCard ? `Leave blank to keep •••• ${savedCard.cardLast4}` : '4111 1111 1111 1111'}
              onChange={(e) => {
                setCardNumber(formatCardNumber(e.target.value))
                markEdited()
              }}
            />
            {numberError && <p className="error-text">{numberError}</p>}
            <p className="hint">Network: {NETWORK_NAMES[network]}</p>
          </label>
        </div>

        {/* Follows the same zod checks that decide whether we can save */}
        <p className={isValid ? 'valid-text' : 'error-text'}>{isValid ? '✓ Valid' : '✗ Invalid'}</p>
      </div>

      <CoBrandPicker
        coBrand={coBrand}
        onChange={(next) => {
          setCoBrand(next)
          markEdited()
        }}
      />

      <div className="button-row">
        <button type="button" className="primary" onClick={handleSave} disabled={!isValid || saveStatus === 'saving'}>
          {saveLabel}
        </button>
        <button type="button" onClick={handlePng}>
          Download PNG
        </button>
        <button type="button" onClick={handlePdf} disabled={exportStatus === 'working'}>
          {exportStatus === 'working' ? 'Making PDF…' : 'Download PDF'}
        </button>
      </div>
      {saveStatus === 'saved' && <p className="valid-text">Design saved!</p>}
      {saveStatus === 'error' && <p className="error-text">Couldn't save: {saveError}</p>}
      {exportStatus === 'error' && <p className="error-text">Couldn't create the file. Please try again.</p>}

      {/* The AI review needs a saved design, because the server reviews what it has stored */}
      {savedCard ? (
        <ReviewPanel key={savedCard._id} cardId={savedCard._id} />
      ) : (
        <p className="hint">Save your design to get an AI review.</p>
      )}
    </section>
  )
}

export default Editor
