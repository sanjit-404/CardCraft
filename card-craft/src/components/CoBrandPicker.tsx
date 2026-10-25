import { LOGO_IDS, type CoBrand, type CoBrandLayout, type LogoId } from '../types'

type CoBrandPickerProps = {
  coBrand: CoBrand
  onChange: (coBrand: CoBrand) => void
}

const LAYOUTS: { value: CoBrandLayout; label: string }[] = [
  { value: 'side-by-side', label: 'Side by side' },
  { value: 'stacked', label: 'Stacked' },
]

// "orbit" -> "Orbit", for the dropdown labels
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// An empty string in the dropdown means "no logo", which we store as null
function toLogo(value: string): LogoId | null {
  return value === '' ? null : (value as LogoId)
}

function CoBrandPicker({ coBrand, onChange }: CoBrandPickerProps) {
  return (
    <fieldset className="control-group">
      <legend>Co-branding</legend>
      <div className="form-grid">
        <label className="field">
          <span className="field-label">Primary logo</span>
          <select
            value={coBrand.primaryLogo ?? ''}
            onChange={(e) => {
              const primaryLogo = toLogo(e.target.value)
              // Without a primary logo there can't be a secondary one either
              onChange({ ...coBrand, primaryLogo, secondaryLogo: primaryLogo ? coBrand.secondaryLogo : null })
            }}
          >
            <option value="">None</option>
            {LOGO_IDS.map((id) => (
              <option key={id} value={id}>
                {capitalize(id)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Secondary logo</span>
          <select
            value={coBrand.secondaryLogo ?? ''}
            disabled={coBrand.primaryLogo === null}
            onChange={(e) => onChange({ ...coBrand, secondaryLogo: toLogo(e.target.value) })}
          >
            <option value="">None</option>
            {LOGO_IDS.map((id) => (
              <option key={id} value={id}>
                {capitalize(id)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Layout as a two-button switch (radio buttons styled as a segmented control) */}
      <div className="segmented" role="radiogroup" aria-label="Logo layout">
        {LAYOUTS.map((layout) => (
          <label key={layout.value}>
            <input
              type="radio"
              name="layout"
              value={layout.value}
              checked={coBrand.layout === layout.value}
              onChange={() => onChange({ ...coBrand, layout: layout.value })}
            />
            <span>{layout.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default CoBrandPicker
