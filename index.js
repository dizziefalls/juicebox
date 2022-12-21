require('dotenv').config()

const PORT = 3000
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const apiRouter = require('./api')
const { client } = require('./db')

client.connect()

const server = express();

server.use(morgan('dev'))
server.use(express.json())
server.use(cors())

server.get('/', (req, res, next) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Juicebox API</title>
    </head>
    <body>
      <h1>Just a placeholder for the juicebox API docs</h1>
      <h2>Endpoints</h2>
      <h3>/users</h3>
      <ul>
        <li>GET /</li>
        <li>POST /register</li>
        <li>POST /login</li>
        <li>PATCH /:userId</li>
        <li>DELETE /:userId</li>
      </ul>
      <h3>/posts</h3>
      <ul>
        <li>GET /</li>
        <li>POST /</li>
        <li>PATCH /:postId</li>
        <li>DELETE /:postId</li>
      </ul>
      <h3>/tags</h3>
      <ul>
        <li>GET /</li>
        <li>GET /:tagName/posts</li>
      </ul>
      <h2>Construction Plans</h2>
      <ul>
        <li>Convert this page to static markdown</li>
        <li>Implement deactivated user functionality</li>
        <li>Write docs</li>
        <li>Make giant $$$$ in FOSS <small>(Cry softly)</small></li>
        <li>Write a demo react frontend to show off endpoints</li>
        <li>Add link to react frontend here. Since free deployment options probably require it</li>
      </ul>
    </body>
    </html>
  `)
})
server.use('/api', apiRouter)

server.listen(PORT, () => {
  console.log('Server listening on port: ', PORT)
})

