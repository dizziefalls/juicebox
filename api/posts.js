const express = require('express')
const postsRouter = express.Router()
const { requireUser } = require('./utils')
const { 
  getAllPosts,
  createPost,
  updatePost,
  getPostById,
 } = require('../db')


postsRouter.get('/', async (req, res) => {
  const allPosts = await getAllPosts()
  //Adds allowing a deactivated user to see their posts.
  let userId 
  req.user ? userId = req.user.id : null
  const posts = allPosts.filter(post => {
    //Ah the workshop ruined my fun writing this haha
    //Return posts that are either active or match the current user's id
    //Hmm don't think author has active. I'll have to add that
    return (post.active || (req.user && post.author.id === req.user.id)) && (post.author.active || post.author.id === userId)
  })
  res.send({
    posts
  })
})

postsRouter.post('/', requireUser, async (req, res, next) => {
  const { title, content, tags = "" } = req.body;

  const tagArr = tags.trim().split(/\s+/)
  const postData = {}

  //Adds empty string tag when none are provided. Do we want that?
  if (tagArr.length) {
    postData.tags = tagArr
  }

  try {
    //User obj is attached to req during auth screening in index
    postData.authorId = req.user.id
    postData.title = title
    postData.content = content

    const post = await createPost(postData)
    
    res.send({ post })
  } catch ({ name, message }) {
    next({ name, message})
  }
})

postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
  const { postId } = req.params
  const { title, content, tags } = req.body
  
  const updateFields = {}

  //Check for each field before adding to obj
  if (tags && tags.length > 0) {
    updateFields.tags = tags.trim().split(/\s+/)
  }

  if (title) {
    updateFields.title = title
  }

  if (content) {
    updateFields.content = content
  }

  try {
    //Let's make sure the id in our req.user obj matches the one on the post.
    const originalPost = await getPostById(postId)

    if (originalPost.author.id === req.user.id) {
      const updatedPost = await updatePost(postId, updateFields)
      res.send({ post: updatedPost })
    } else {
      next({
        name: 'UnauthorizedUserError',
        message: "You can't be updating other people's posts! Come on..."
      })
    }

  } catch ({ name, message}) {
    next({
      name,
      message
    })
  }
})

postsRouter.delete('/:postId', requireUser, async (req, res, next) => {
  //I found this method funny when we were creating stranger's things
  //Why keep all posts when they're deleted? I understand how being able to recover them might be nice. But there should certainly be an option to permanently delete them as well.
  try {
    const post = await getPostById(req.params.postId)

    if (post && post.author.id === req.user.id) {
      const updatedPost = await updatePost(post.id, { active: false })
      res.send({ post: updatedPost})
    } else {
      //error handling
      next( post ? {
        name: 'UnauthorizedUserError',
        message: "Not your post to delete hoss"
      } : { //throws typeError on .author.id since it doesn't exist. eh.
        name: "PostNotFoundError",
        message: "That post does not exist"
      })
    }


  } catch ({ name, message }) {
    next({ name, message })
  }
})

module.exports = postsRouter