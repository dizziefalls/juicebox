const PORT = 3000
const express = require('express')
const morgan = require('morgan')
const apiRouter = require('./api')
const { client } = require('./db')

client.connect()

const server = express();

server.use(morgan('dev'))
server.use(express.json())
server.use('/api', apiRouter)

server.listen(PORT, () => {
  console.log('Server listening on port: ', PORT)
})

