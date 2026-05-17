require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')

const app = express()

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  })

app.use(cors())
app.use(express.json())

app.get('/test-db', async (req, res) => {
    try {
      const result = await pool.query('SELECT NOW()')
      res.json(result.rows)
    } catch (error) {
      console.log(error)
      res.status(500).send('Database connection error')
    }
})

app.get('/create-table', async (req, res) => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS playlists (
          id SERIAL PRIMARY KEY,
          name TEXT,
          mood TEXT,
          image TEXT
        )
      `)
  
      res.send('Playlists table created')
    } catch (error) {
      console.log(error)
      res.status(500).send('Error creating table')
    }
})

app.get('/create-saved-table', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_playlists (
        id SERIAL PRIMARY KEY,
        name TEXT,
        mood TEXT,
        image TEXT
      )
    `)
  
    res.send('Saved playlists table created')
  } catch (error) {
    console.log(error)
    res.status(500).send('Error creating saved playlists table')
  }
})
  
app.post('/saved-playlists', async (req, res) => {
  try {
    const { name, mood, image } = req.body
  
    const result = await pool.query(
      'INSERT INTO saved_playlists (name, mood, image) VALUES ($1, $2, $3) RETURNING *', [name, mood, image]
    )
  
    res.json(result.rows[0])
  } catch (error) {
      console.log(error)
      res.status(500).send('Error saving playlist')
  }
})

app.get('/saved-playlists', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT ON (name) * FROM saved_playlists ORDER BY name, id'
    )
  
    res.json(result.rows)
  } catch (error) {
    console.log(error)
    res.status(500).send('Error getting saved playlists')
  }
})

app.delete('/saved-playlists/:id', async (req, res) => {
  try {
    const { id } = req.params

    await pool.query(
      'DELETE FROM saved_playlists WHERE id = $1', [id])

      res.send('Playlist deleted')
  } catch (error) {
      console.log(error)
      res.status(500).send('Error deleting playlist')
  }
})

app.put('/saved-playlists/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body

    const updatedPlaylist = await pool.query(
      'UPDATE saved_playlists SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    )

    res.json(updatedPlaylist.rows[0])
  } catch (error) {
    console.log(error)
    res.status(500).send('Error updating playlist')
  }
})

app.get('/spotify-token', async (req, res) => {
  try {
    const response = await fetch(
      'https://accounts.spotify.com/api/token',
      {
        method: 'POST',
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(
              process.env.SPOTIFY_CLIENT_ID +
                ':' +
                process.env.SPOTIFY_CLIENT_SECRET
            ).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      }
    )

    const data = await response.json()

    res.json(data)
  } catch (error) {
    console.log(error)
    res.status(500).send('Error getting Spotify token')
  }
})

app.get('/spotify-search/:mood', async (req, res) => {
  try {
    const { mood } = req.params

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
          ).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    const tokenData = await tokenResponse.json()

    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        mood + ' playlist'
      )}&type=playlist&limit=6`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    )

    const searchData = await searchResponse.json()

    res.json(searchData.playlists.items)
  } catch (error) {
    console.log(error)
    res.status(500).send('Error searching Spotify')
  }
})

app.get('/seed-playlists', async (req, res) => {
  try {
      await pool.query(`
        INSERT INTO playlists (name, mood, image)
        VALUES
        (
          'Feel Good Hits',
          'Happy',
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f'
        ),
        (
          'Summer Vibes',
          'Happy',
          'https://images.unsplash.com/photo-1501612780327-45045538702b'
        ),
        (
          'Late Night Chill',
          'Chill',s
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4'
        ),
        (
          'Lo-fi Beats',
          'Chill',
          'https://images.unsplash.com/photo-1496293455970-f8581aae0e3b'
        ),
        (
          'Deep Focus',
          'Study',
          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3'
        ),
        (
          'Coding Mode',
          'Study',
          'https://images.unsplash.com/photo-1518770660439-4636190af475'
        ),
        (
          'Beast Mode',
          'Workout',
          'https://images.unsplash.com/photo-1517836357463-d25dfeac3438'
        ),
        (
          'Gym Energy',
          'Workout',
          'https://images.unsplash.com/photo-1518611012118-696072aa579a'
        ),

        (
          'Sad Hours',
          'Sad',
          'https://images.unsplash.com/photo-1494232410401-ad00d5433cfa'
        ),

        (
          'Heartbreak Playlist',
          'Sad',
          'https://images.unsplash.com/photo-1487180144351-b8472da7d491'
        )
      `)
  
      res.send('Playlists added')
    } catch (error) {
      console.log(error)
      res.status(500).send('Error adding playlists')
    }
  })

app.get('/', (req, res) => {
  res.send('Moodbeats server is running')
})

app.get('/playlists', async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT DISTINCT ON (name) * FROM playlists ORDER BY name, id'
      )
  
      res.json(result.rows)
    } catch (error) {
      console.log(error)
      res.status(500).send('Error getting playlists')
    }
  })

const PORT = 5050
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})