const { Client } = require('pg')

const client = new Client ('postgres://localhost:5432/juicebox-dev')

// ********* USERS ********
async function createUser({ 
  username, 
  password,
  name, 
  location 
}) {
  try {
    const { rows: [ user ] } = await client.query(`
      INSERT INTO users (username, password, name, location) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO NOTHING
      RETURNING *;
    `, [username, password, name, location])  

    return user
  } catch (error) {
    throw error
  }
}

async function getAllUsers() {
  try {
    const { rows } = await client.query(`
      SELECT id, username, name, location, active FROM users;
    `)
    return rows;
  } catch (err) {
    throw err
  }
}

async function updateUser(id, fields = {}) {
  // build the set string
  // looks like this needs some args somewhere to change the field...
  // ah the values. of course
  const setString = Object.keys(fields).map(
    (key, index) => `"${ key }"=$${ index + 1 }`
  ).join(', ');

  // return early if this is called without fields
  if (setString.length === 0) {
    return;
  }

  try {
    const { rows: [ user ] } = await client.query(`
      UPDATE users
      SET ${ setString }
      WHERE id=${ id }
      RETURNING *;
    `, Object.values(fields));
    // setString ex. : name=$1, location=$2

    return user;
  } catch (error) {
    throw error;
  }
}

async function getUserById(userId) {
  try {
    const { rows } = await client.query(`
      SELECT * FROM users
      WHERE id = ${ userId }
    `)

    if (rows.length) {
      const [user] = rows
      delete user.password
      user.posts = await getPostsByUser(user.id)
      return user
    } else {
      return null
    }

  } catch (error) {
    throw error
  }
}

// ********* POSTS ********
async function createPost({
  authorId,
  title,
  content,
  tags = []
}) {
  try {
    const { rows: [ post ] } = await client.query(`
      INSERT INTO posts ("authorId", title, content) 
      VALUES ($1, $2, $3)
      RETURNING *;
    `, [authorId, title, content])  

    const tagList = await createTags(tags);

    return await addTagsToPost(post.id, tagList)
  } catch (error) {
    throw error
  }
}

async function updatePost(postId, fields={}) {

  //Kind of a weird workaround, but it seems cleaner than trying to either make a new object with a bunch of conditionals or make individual queries for each present field.
  //Just looked at part 3 and they didn't even bother to check for authorId lol.
  if (fields.authorId){
    delete fields.authorId;
  }

  const { tags } = fields
  delete fields.tags

  const setString = Object.keys(fields).map(
    (key, index) => `"${ key }"=$${ index + 1 }`
  ).join(', ');

  try {
    if (setString.length > 0) {
      await client.query(`
        UPDATE posts
        SET ${ setString }
        WHERE id=${ postId }
        RETURNING *;
      `, Object.values(fields));
    }

    //Don't update tags if none are provided
    if (tags === undefined) {
      return await getPostById(postId)
    }

    const tagList = await createTags(tags)
    const tagListIdString = tagList.map(
      tag => `${ tag.id }`
    ).join(', ')
    
    //Delete all tags that do not match the newly provided ones. I think this means you can't simply add new ones without the old tags unless we provide them somewhere.
    await client.query(`
      DELETE FROM post_tags
      WHERE "tagId"
      NOT IN (${ tagListIdString })
      AND "postId"=$1;
    `, [postId])

    //Associate new tags
    await addTagsToPost(postId, tagList)

    return await getPostById(postId)
  } catch (error) {
    throw error;
  }
}

async function getAllPosts() {
  try {
    const { rows: postIds } = await client.query(`
      SELECT id
      FROM posts;
    `);

    const posts = await Promise.all(postIds.map(
      post => getPostById( post.id )
    ));

    return posts;
  } catch (error) {
    throw error;
  }
}

async function getPostsByUser(userId) {
  try {
    const { rows: postIds } = await client.query(`
      SELECT id 
      FROM posts
      WHERE "authorId"=${ userId };
    `);

    const posts = await Promise.all(postIds.map(
      post => getPostById(post.id)
    ))

    return posts;
  } catch (error) {
    throw error;
  }
}

async function getPostById(postId) {
  try {
    const { rows: [ post ] } = await client.query(`
      SELECT * FROM posts
      WHERE id=$1;
    `, [postId])
    
    //Boy these SQL queries seem simple at first, but they don't exactly execute in a linear fashion.
    const { rows: tags } = await client.query(`
      SELECT tags.*
      FROM tags
      JOIN post_tags ON tags.id=post_tags."tagId"
      WHERE post_tags."postId"=$1;
    `, [postId])

    const { rows: [author] } = await client.query(`
      SELECT id, username, name, location
      FROM users
      WHERE id=$1;
    `, [post.authorId])
    
    post.tags = tags
    post.author = author

    delete post.authorId

    return post
  } catch (error) {
    throw error
  }
}

async function getPostsByTagName(tagName) {
  try {
    //Some of these joins confuse me. If the postIds are already in post_tags, why do we need to join posts? Don't we already have access to them?
    const { rows: postIds } = await client.query(`
      SELECT posts.id
      FROM posts
      JOIN post_tags ON posts.id=post_tags."postId"
      JOIN tags ON tags.id=post_tags."tagId"
      WHERE tags.name=$1;
    `, [tagName]);

    return await Promise.all(postIds.map(
      post => getPostById(post.id)
    ));
  } catch (error) {
    throw error;
  }
}

// ********* TAGS ********
async function createTags(tagList) {
  if (tagList.length === 0) { 
    return; 
  }

  // need something like: $1), ($2), ($3 
  const insertValues = tagList.map(
    (_, index) => `$${index + 1}`).join('), (');
  // then we can use: (${ insertValues }) in our string template

  // need something like $1, $2, $3
  const selectValues = tagList.map(
    (_, index) => `$${index + 1}`).join(', ');
  // then we can use (${ selectValues }) in our string template

  try {
    await client.query(`
      INSERT INTO tags(name)
      VALUES (${insertValues})
      ON CONFLICT (name) DO NOTHING;
    `, tagList)

    const { rows } = await client.query(`
      SELECT * FROM tags
      WHERE name
      in (${selectValues});
    `, tagList)

    return rows
  } catch (error) {
    console.log(`Error creating tags: ${tagList}`)
    throw error;
  }
}

async function createPostTag(postId, tagId) { 
  try {
    await client.query(`
      INSERT INTO post_tags("postId", "tagId")
      VALUES ($1, $2)
      ON CONFLICT ("postId", "tagId") DO NOTHING;
    `, [postId, tagId]);
  } catch (error) {
    console.log(`Error creating post_tag: ${postId, tagId}`)
    throw error;
  }
}

//Why do we only add the tags to the post when we get it by id? This seems very convoluted.
async function addTagsToPost(postId, tagList) {
  try {
    const createPostTagPromises = tagList.map(
      tag => createPostTag(postId, tag.id)
    );

    await Promise.all(createPostTagPromises);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  client,
  getAllUsers,
  createUser,
  updateUser,
  createPost,
  updatePost,
  getAllPosts,
  getUserById,
  createTags,
  addTagsToPost,
  getPostsByTagName
}