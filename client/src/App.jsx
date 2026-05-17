import { useEffect, useState } from 'react'

function App() {
  const [selectedMood, setSelectedMood] = useState('')
  const [savedPlaylists, setSavedPlaylists] = useState([])
  const [backendPlaylists, setBackendPlaylists] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
  
    fetch('http://localhost:5050/saved-playlists')
      .then((response) => response.json())
      .then((data) => {
        setSavedPlaylists(data)
      })
  }, [])

  const getSpotifyPlaylists = (mood) => {
    setSelectedMood(mood)
    setLoading(true)
    fetch(`http://localhost:5050/spotify-search/${mood}`)
      .then((response) => response.json())
      .then((data) => {
        setBackendPlaylists(data.filter((playlist) => playlist !== null))
        setLoading(false)
      })  .catch((error) => {
        console.log(error)
        setLoading(false)
      })
  }

  return (
    <div>
      <h1>Moodbeats</h1>
      <p>Find playlists based on your mood.</p>

      <h2>Choose your mood</h2>

      <button onClick={() => getSpotifyPlaylists('Happy')}>Happy</button>
      <button onClick={() => getSpotifyPlaylists('Chill')}>Chill</button>
      <button onClick={() => getSpotifyPlaylists('Study')}>Study</button>
      <button onClick={() => getSpotifyPlaylists('Workout')}>Workout</button>
      <button onClick={() => getSpotifyPlaylists('Sad')}>Sad</button>
      {selectedMood && (
        <div>
          <h3>{selectedMood} Playlists</h3>

          {loading && <p>Loading playlists...</p>}

          <div className="playlist-grid">
            {backendPlaylists.map((playlist) => (
              <div className="playlist-card" key={playlist.id || playlist.name}>
              <img
                src={playlist.images?.[0]?.url}
                alt={playlist.name}
              />

                <h4>{playlist.name}</h4>
                <a
                  href={playlist.external_urls.spotify}
                  target="_blank"
                  rel="noreferrer"
                >
                  <button>Open in Spotify</button>
                </a>

                <button
                  onClick={() => {

                    const alreadySaved = savedPlaylists.some(
                      (item) => item.name === playlist.name
                    )

                    if (alreadySaved) {
                      return
                    }

                    fetch('http://localhost:5050/saved-playlists', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        name: playlist.name,
                        mood: selectedMood,
                        image: playlist.images?.[0]?.url,
                      }),
                    })
                      .then((response) => response.json())
                      .then((data) => {
                        setSavedPlaylists([
                          ...savedPlaylists,
                          data,
                        ])
                      })
                  }}
                >
                  Save Playlist
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2>Saved Playlists</h2>

      <div className="playlist-grid">
      {savedPlaylists.map((playlist) => (
        <div className="playlist-card" key={playlist.id || playlist.name}>          <img
            src={playlist.image}
            alt={playlist.name}
            width="200"
          />

          <h4>{playlist.name}</h4>
          <button
          onClick={() => {
            fetch(`http://localhost:5050/saved-playlists/${playlist.id}`, {
              method: 'DELETE',
            }).then(() => {
              setSavedPlaylists(
                savedPlaylists.filter((item) => item.id !== playlist.id)
              )
            })
          }}
        >
          Delete
        </button>
        </div>
      ))}
    </div>
    </div>
  )
}

export default App