export default function BusSilhouette() {
  return (
    <svg className="bus-cote" viewBox="0 0 64 30" aria-hidden="true">
      <rect className="bus-cote-carrosserie" x="2" y="3" width="54" height="19" rx="5" fill="currentColor" />
      <rect className="bus-cote-vitre" x="7" y="7" width="9" height="7" rx="1.5" />
      <rect className="bus-cote-vitre" x="19" y="7" width="9" height="7" rx="1.5" />
      <rect className="bus-cote-vitre" x="31" y="7" width="9" height="7" rx="1.5" />
      <rect className="bus-cote-vitre" x="43" y="7" width="8" height="7" rx="1.5" />
      <circle className="bus-cote-roue" cx="15" cy="24" r="3.4" fill="currentColor" />
      <circle className="bus-cote-roue" cx="45" cy="24" r="3.4" fill="currentColor" />
    </svg>
  )
}
