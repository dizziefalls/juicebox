const express = require('express')
const { 
  getAllUsers,
  getUserByUsername,
  getUserById,
  createUser,
  updateUser
 } = require('../db')
const jwt = require('jsonwebtoken')
const { requireUser } = require('./utils')
const usersRouter = express.Router()

usersRouter.use((req, res, next) => {
  console.log("Request made to /users")

  next()
})

usersRouter.get('/', async (req, res) => {
  const users = await getAllUsers()

  res.send({
    users
  })
})

usersRouter.post('/login', async (req, res, next) => {
  const { username, password } = req.body

  if (!username||!password) {
    next({
      name: 'MissingCredentialsError',
      message: 'Please supply a username AND a password. You know how this works...'
    })
  }

  try {
    const user = await getUserByUsername(username)

    if (user && user.password == password) {
      const sig = jwt.sign({id: user.id, username: user.username}, process.env.JWT_SECRET)
      console.log(user)
      res.send({ 
        message: "you're so logged in. nice.",
        token: sig
      })
    } else {
      next({
        name: 'IncorrectCredentialsError',
        message: 'Username or password is incorrect. Dishonor on your cow.'
      })
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

usersRouter.post('/register', async (req, res, next) => {
  const { username, password, name, location } = req.body

  try {
    const _user = await getUserByUsername(username)

    if (_user) {
      next({
        name: 'UserExistsError',
        message: "There's already a user registered with that username"
      })
    }

    const user = await createUser({
      username,
      password,
      name,
      location
    })

    const token = jwt.sign({
      id: user.id,
      username
    }, process.env.JWT_SECRET, {
      expiresIn: '1w'
    })

    res.send({
      message: "Thanks for signing up with us!",
      token
    })

  } catch ({ name, message }) {
    next({ name, message })
  }
})

usersRouter.delete('/:userId', requireUser, async (req, res, next) => {
  const userId = req.params.userId

  try {
    const userQuery = await getUserById(userId)
    if (userQuery) {
      if (userQuery.id === req.user.id) {
        const deletedUser = await updateUser(userId, {active: false})
        res.send({user: deletedUser})
      } else {
        next({
          name: 'UnauthorizedUserError',
          message: "Ain't your account to deactivate bud"
        })
      }
    } else {
      next({
        name: 'UserNotFoundError',
        message: "Can't find that user pal"
      })
    }
  } catch ({ name, message }) {
    next({ name, message })
  }
})

module.exports = usersRouter;