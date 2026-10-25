import { LOGO_IDS, type CoBrand, type CoBrandLayout, type LogoId } from '../types'

type CoBrandPickerProps = {
  coBrand: CoBrand
  onChange: (coBrand: CoBrand) => void
}

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
    <fieldset className="panel">
      <legend>Co-branding</legend>
      <div className="form-grid">
        <label className="field">
          <span>Primary logo</span>
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
          <span>Secondary logo (optional)</span>
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

        <label className="field">
          <span>Layout</span>
          <select
            value={coBrand.layout}
            onChange={(e) => onChange({ ...coBrand, layout: e.target.value as CoBrandLayout })}
          >
            <option value="side-by-side">Side by side</option>
            <option value="stacked">Stacked</option>
          </select>
        </label>
      </div>
    </fieldset>
  )
}

export default CoBrandPicker
