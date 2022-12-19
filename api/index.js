const jwt = require('jsonwebtoken')
const { getUserById } = require('../db')
const { JWT_SECRET } = process.env

const express = require('express')
const apiRouter = express.Router()
const usersRouter = require('./users')
const postsRouter = require('./posts')
const tagsRouter = require('./tags')

//Let's try to auth the user and grab the id from the db
apiRouter.use(async (req, res, next) => {
  const prefix = 'Bearer '
  const auth = req.header('Authorization')

  //If the header contains no value to Auth...
  if (!auth){
    next()
  } else if (auth.startsWith(prefix)) { //Alright let's see if the token matches
    const token = auth.slice(prefix.length)

    try {
      const { id } = jwt.verify(token, JWT_SECRET)

      if (id) {
        req.user = await getUserById(id)
        next();
      }
    } catch ({ name, message }) { //Invalid token
      next({ name, message})
    }
  } else { //Gotta make the right request bingo
    next({
      name: 'AuthorizationHeaderError',
      message: `Authorization token must start with '${ prefix }' ya dingus!`
    })
  }
})

//Log to the server for user confirmation
apiRouter.use((req, res, next) => {
  if (req.user) {
    console.log("User is set:", req.user)
  }

  next()
})

apiRouter.use('/users', usersRouter)
apiRouter.use('/posts', postsRouter)
apiRouter.use('/tags', tagsRouter)

//custom error handler
apiRouter.use((error, req, res, next) => {
  res.send({
    name: error.name,
    message: error.message
  })
})

module.exports = apiRouter;