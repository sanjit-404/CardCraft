import { useEffect, useState } from 'react'
import DesignList from './DesignList'
import Editor from './Editor'
import { deleteCard, describeError, listCards, updateCard } from '../api'
import type { Card } from '../types'

// The logged-in screen: the editor plus the "My designs" list.
// This component owns the list of cards and does the list's API calls.
function Workspace() {
  const [cards, setCards] = useState<Card[]>([])
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busyCardId, setBusyCardId] = useState<string | null>(null)

  // The design the editor started from (null = a new design)
  const [editorCard, setEditorCard] = useState<Card | null>(null)
  // Which saved design is open, to highlight it in the list
  const [openCardId, setOpenCardId] = useState<string | null>(null)
  // Changing this number makes React throw away the old editor and start a fresh one
  const [editorKey, setEditorKey] = useState(0)

  // Fetch the user's cards. The state updates happen after the request
  // finishes, never straight away.
  function fetchCards() {
    listCards()
      .then((data) => {
        setCards(data)
        setLoadStatus('ready')
      })
      .catch((err) => {
        setLoadError(describeError(err))
        setLoadStatus('error')
      })
  }

  // Load the list once, when the workspace first appears
  useEffect(() => {
    fetchCards()
  }, [])

  function handleRetry() {
    setLoadStatus('loading')
    fetchCards()
  }

  function openDesign(card: Card) {
    setEditorCard(card)
    setOpenCardId(card._id)
    setEditorKey((key) => key + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' }) // on a phone the editor is above the list
  }

  function startNewDesign() {
    setEditorCard(null)
    setOpenCardId(null)
    setEditorKey((key) => key + 1)
  }

  // After the editor saves: replace the card in the list, or add it to the top if it is new
  function handleSaved(saved: Card) {
    setCards((current) =>
      current.some((card) => card._id === saved._id)
        ? current.map((card) => (card._id === saved._id ? saved : card))
        : [saved, ...current],
    )
    setOpenCardId(saved._id)
  }

  async function handleDelete(card: Card) {
    if (!window.confirm(`Delete "${card.name}"? This can't be undone.`)) return
    setBusyCardId(card._id)
    setActionError('')
    try {
      await deleteCard(card._id)
      setCards((current) => current.filter((c) => c._id !== card._id))
      // If the deleted design was open, clear the editor
      if (card._id === openCardId) startNewDesign()
    } catch (err) {
      setActionError(`Couldn't delete "${card.name}": ${describeError(err)}`)
    } finally {
      setBusyCardId(null)
    }
  }

  async function handleToggleStatus(card: Card) {
    setBusyCardId(card._id)
    setActionError('')
    try {
      const updated = await updateCard(card._id, { status: card.status === 'final' ? 'draft' : 'final' })
      setCards((current) => current.map((c) => (c._id === updated._id ? updated : c)))
    } catch (err) {
      setActionError(`Couldn't update "${card.name}": ${describeError(err)}`)
    } finally {
      setBusyCardId(null)
    }
  }

  return (
    <main className="workspace">
      <div className="workspace-editor">
        <div className="button-row">
          <button type="button" onClick={startNewDesign}>
            + New design
          </button>
        </div>
        <Editor key={editorKey} initialCard={editorCard} onSaved={handleSaved} />
      </div>
      <DesignList
        cards={cards}
        loadStatus={loadStatus}
        loadError={loadError}
        actionError={actionError}
        openCardId={openCardId}
        busyCardId={busyCardId}
        onRetry={handleRetry}
        onOpen={openDesign}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
      />
    </main>
  )
}

export default Workspace
