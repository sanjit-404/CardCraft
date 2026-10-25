import { useEffect, useState } from 'react'
import DesignList from './DesignList'
import Editor from './Editor'
import { deleteCard, describeError, listCards, updateCard } from '../api'
import { showToast } from '../toast'
import type { Card } from '../types'

// The logged-in screen: the design studio plus the "My designs" gallery.
// This component owns the list of cards and does the list's API calls.
function Workspace() {
  const [cards, setCards] = useState<Card[]>([])
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [busyCardId, setBusyCardId] = useState<string | null>(null)

  // The design the editor started from (null = a new design)
  const [editorCard, setEditorCard] = useState<Card | null>(null)
  // Which saved design is open, to highlight it in the gallery
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
    window.scrollTo({ top: 0, behavior: 'smooth' }) // the studio is above the gallery
  }

  function startNewDesign() {
    setEditorCard(null)
    setOpenCardId(null)
    setEditorKey((key) => key + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    try {
      await deleteCard(card._id)
      setCards((current) => current.filter((c) => c._id !== card._id))
      // If the deleted design was open, clear the editor
      if (card._id === openCardId) startNewDesign()
      showToast(`Deleted "${card.name}"`, 'info')
    } catch (err) {
      showToast(`Couldn't delete "${card.name}": ${describeError(err)}`, 'error')
    } finally {
      setBusyCardId(null)
    }
  }

  async function handleToggleStatus(card: Card) {
    setBusyCardId(card._id)
    try {
      const updated = await updateCard(card._id, { status: card.status === 'final' ? 'draft' : 'final' })
      setCards((current) => current.map((c) => (c._id === updated._id ? updated : c)))
      showToast(`"${updated.name}" marked as ${updated.status}`, 'success')
    } catch (err) {
      showToast(`Couldn't update "${card.name}": ${describeError(err)}`, 'error')
    } finally {
      setBusyCardId(null)
    }
  }

  return (
    <main className="workspace">
      <Editor key={editorKey} initialCard={editorCard} onSaved={handleSaved} onNewDesign={startNewDesign} />
      <DesignList
        cards={cards}
        loadStatus={loadStatus}
        loadError={loadError}
        openCardId={openCardId}
        busyCardId={busyCardId}
        onRetry={handleRetry}
        onOpen={openDesign}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        onNewDesign={startNewDesign}
      />
    </main>
  )
}

export default Workspace
