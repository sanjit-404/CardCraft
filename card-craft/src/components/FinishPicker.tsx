import { FINISHES, FINISH_IDS, finishGradient, resolveFinish, type FinishId } from '../finishes'
import type { Network } from '../types'

type FinishPickerProps = {
  value: FinishId
  network: Network // "Auto" shows the finish this network would get
  onChange: (finish: FinishId) => void
}

// A row of colour swatches. Each one is a real radio button underneath,
// so it works with the keyboard (arrow keys) and screen readers.
function FinishPicker({ value, network, onChange }: FinishPickerProps) {
  return (
    <fieldset className="control-group">
      <legend>Finish</legend>
      <div className="swatches">
        {FINISH_IDS.map((id) => {
          const finish = resolveFinish(id, network)
          return (
            <label key={id} className="swatch">
              <input
                type="radio"
                name="finish"
                value={id}
                checked={value === id}
                onChange={() => onChange(id)}
              />
              <span className="swatch-chip" style={{ background: finishGradient(finish) }} />
              <span className="swatch-label">{id === 'auto' ? 'Auto' : FINISHES[id].label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export default FinishPicker
