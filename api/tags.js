const express = require('express')
const tagsRouter = express.Router()
const {
  getAllTags,
  getPostsByTagName
} = require('../db')

tagsRouter.get('/', async (req, res) => {
  const tags = await getAllTags()

  res.send({
    tags
  })
})

//Let's convert this to use encodeUriComponent at some point
tagsRouter.get('/:tagName/posts', async (req, res, next) => {
  const tagName = req.params.tagName

  try {
    const allTaggedPosts = await getPostsByTagName(tagName)

    //Makes sense to account for users not logged here as well to me.
    if (req.user) {
      const userPosts = allTaggedPosts.filter(post => {
        return post.active && post.author.id === req.user.id
      })
      res.send({ userPosts })
    } else { //if not logged in
      const taggedPosts = allTaggedPosts.filter(post => {
        return post.active && post.author.active
      })
      res.send({ taggedPosts })
    }
  } catch ({ name, message}) {
    next({ name, message })
  }
})

module.exports = tagsRouter