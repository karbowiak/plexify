const STATION_LABELS: Record<string, string> = {
  "library-radio": "Library Radio",
  "deep-cuts-radio": "Deep Cuts Radio",
  "time-travel-radio": "Time Travel Radio",
  "random-album-radio": "Random Album Radio",
  "genre-radio": "Genre Radio",
  "style-radio": "Style Radio",
  "mood-radio": "Mood Radio",
  "decade-radio": "Decade Radio",
  "artist-mix": "Artist Mix Builder",
  "album-mix": "Album Mix Builder",
}

const STATION_DESCRIPTIONS: Record<string, string> = {
  "library-radio": "A continuous mix drawn from your entire music library.",
  "deep-cuts-radio": "Rediscover overlooked and rarely-played tracks.",
  "time-travel-radio": "Travel through your library era by era.",
  "random-album-radio": "Pick a random album and let it play through.",
  "genre-radio": "Radio tuned to a specific genre.",
  "style-radio": "Radio tuned to a specific style.",
  "mood-radio": "Radio tuned to a specific mood.",
  "decade-radio": "Radio focused on a particular decade.",
  "artist-mix": "A personalised mix based on a specific artist.",
  "album-mix": "A mix inspired by a specific album.",
}

interface Props {
  stationType: string
}

export function RadioPage({ stationType }: Props) {
  const label = STATION_LABELS[stationType] ?? stationType
  const description = STATION_DESCRIPTIONS[stationType] ?? "This station is coming soon."

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
        <svg height="40" width="40" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
          <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6zm-2 16a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
        </svg>
      </div>
      <h1 className="mb-2 text-3xl font-bold">{label}</h1>
      <p className="mb-8 max-w-sm text-sm text-white/60">{description}</p>
      <span className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white/50">
        Coming soon
      </span>
    </div>
  )
}
