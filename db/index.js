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
  content
}) {
  try {
    const { rows: [ post ] } = await client.query(`
      INSERT INTO posts ("authorId", title, content) 
      VALUES ($1, $2, $3)
      RETURNING *;
    `, [authorId, title, content])  

    return post
  } catch (error) {
    throw error
  }
}

async function updatePost(id, fields={}) {

  //Kind of a weird workaround, but it seems cleaner than trying to either make a new object with a bunch of conditionals or make individual queries for each present field.
  //Just looked at part 3 and they didn't even bother to check for authorId lol.
  if (fields.authorId){
    delete fields.authorId;
  }

  const setString = Object.keys(fields).map(
    (key, index) => `"${ key }"=$${ index + 1 }`
  ).join(', ');
  
  if (setString.length === 0) {
    return;
  }

  try {
    const { rows: [ post ] } = await client.query(`
      UPDATE posts
      SET ${ setString }
      WHERE id=${ id }
      RETURNING *;
    `, Object.values(fields));

    return post
  } catch (error) {
    throw error;
  }
}

async function getAllPosts() {
  try {
    const { rows } = await client.query(`
      SELECT id, "authorId", title, content, active FROM posts;
    `)
    return rows;
  } catch (error) {
    throw error;
  }
}

async function getPostsByUser(userId) {
  try {
    const { rows } = await client.query(`
      SELECT * FROM posts
      WHERE "authorId"=${ userId };
    `);

    return rows;
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
    // insert the tags, doing nothing on conflict
    // returning nothing, we'll query after

    // select all tags where the name is in our taglist
    // return the rows from the query
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
  getUserById
}