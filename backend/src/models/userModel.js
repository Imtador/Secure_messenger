import { query } from '../config/database.js';

export const createUser = async (userData) => {
  const {
    username,
    email,
    passwordHash,
    displayName,
    publicKey,
    encryptedPrivateKey,
    privateKeyIv,
    privateKeyTag,
  } = userData;

  const result = await query(
    `INSERT INTO users (username, email, password_hash, display_name, public_key, 
       encrypted_private_key, private_key_iv, private_key_tag)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, username, email, display_name, avatar_url, public_key, 
               created_at, updated_at`,
    [
      username,
      email,
      passwordHash,
      displayName || username,
      publicKey,
      encryptedPrivateKey || null,
      privateKeyIv || null,
      privateKeyTag || null,
    ]
  );

  return result.rows[0];
};

export const findUserByUsernameOrEmail = async (usernameOrEmail) => {
  const result = await query(
    'SELECT * FROM users WHERE username = $1 OR email = $1',
    [usernameOrEmail]
  );
  return result.rows[0];
};

export const findUserByUsername = async (username) => {
  const result = await query(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );
  return result.rows[0];
};

export const findUserByEmail = async (email) => {
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
};

export const findUserById = async (userId) => {
  const result = await query(
    'SELECT id, username, email, display_name, avatar_url, public_key, created_at, last_seen, is_online FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0];
};

export const updateUser = async (userId, updateData) => {
  const { displayName, avatarUrl } = updateData;
  const result = await query(
    `UPDATE users 
     SET display_name = COALESCE($1, display_name), 
         avatar_url = COALESCE($2, avatar_url),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING id, username, email, display_name, avatar_url, public_key, updated_at`,
    [displayName, avatarUrl, userId]
  );
  return result.rows[0];
};

export const updateUserOnlineStatus = async (userId, isOnline) => {
  await query(
    `UPDATE users 
     SET is_online = $1, last_seen = CASE WHEN $1 = FALSE THEN CURRENT_TIMESTAMP ELSE last_seen END
     WHERE id = $2`,
    [isOnline, userId]
  );
};

export const searchUsers = async (searchTerm, excludeUserId, limit = 20) => {
  const result = await query(
    `SELECT id, username, display_name, avatar_url 
     FROM users 
     WHERE (username ILIKE $1 OR display_name ILIKE $1) 
       AND id != $2
     ORDER BY username
     LIMIT $3`,
    [`%${searchTerm}%`, excludeUserId, limit]
  );
  return result.rows;
};

export default {
  createUser,
  findUserByUsernameOrEmail,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  updateUser,
  updateUserOnlineStatus,
  searchUsers,
};
