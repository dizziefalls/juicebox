require('dotenv').config()

const PORT = 3000
const express = require('express')
const morgan = require('morgan')
const apiRouter = require('./api')
const { client } = require('./db')

client.connect()

const server = express();

server.use(morgan('dev'))
server.use(express.json())
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
  </body>
  </html>`)
})
server.use('/api', apiRouter)

server.listen(PORT, () => {
  console.log('Server listening on port: ', PORT)
})

