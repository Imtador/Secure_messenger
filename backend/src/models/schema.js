import { query } from '../config/database.js';

export const createTables = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(100),
      avatar_url TEXT,
      public_key TEXT NOT NULL,
      encrypted_private_key TEXT,
      private_key_iv VARCHAR(255),
      private_key_tag VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      last_seen TIMESTAMP WITH TIME ZONE,
      is_online BOOLEAN DEFAULT FALSE
    );
  `;

  const createContactsTable = `
    CREATE TABLE IF NOT EXISTS contacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      contact_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, contact_user_id)
    );
  `;

  const createChatsTable = `
    CREATE TABLE IF NOT EXISTS chats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      chat_type VARCHAR(20) NOT NULL CHECK (chat_type IN ('direct', 'group')),
      name VARCHAR(255),
      description TEXT,
      avatar_url TEXT,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      last_message_at TIMESTAMP WITH TIME ZONE
    );
  `;

  const createChatMembersTable = `
    CREATE TABLE IF NOT EXISTS chat_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      last_read_message_id UUID,
      unread_count INTEGER DEFAULT 0,
      UNIQUE(chat_id, user_id)
    );
  `;

  const createMessagesTable = `
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL REFERENCES users(id),
      content_encrypted TEXT NOT NULL,
      content_iv VARCHAR(255) NOT NULL,
      content_tag VARCHAR(255) NOT NULL,
      message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
      reply_to UUID REFERENCES messages(id),
      is_edited BOOLEAN DEFAULT FALSE,
      is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createAttachmentsTable = `
    CREATE TABLE IF NOT EXISTS attachments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      file_name VARCHAR(255) NOT NULL,
      file_size BIGINT NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      storage_path TEXT NOT NULL,
      encrypted_key TEXT NOT NULL,
      key_iv VARCHAR(255) NOT NULL,
      key_tag VARCHAR(255) NOT NULL,
      thumbnail_path TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createChatKeysTable = `
    CREATE TABLE IF NOT EXISTS chat_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      encrypted_key TEXT NOT NULL,
      key_iv VARCHAR(255) NOT NULL,
      key_tag VARCHAR(255) NOT NULL,
      key_version INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(chat_id, user_id, key_version)
    );
  `;

  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_contact_user_id ON contacts(contact_user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_members_chat_id ON chat_members(chat_id);
    CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON chat_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_chat_keys_chat_id ON chat_keys(chat_id);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `;

  try {
    await query(createUsersTable);
    console.log('Users table created');

    await query(createContactsTable);
    console.log('Contacts table created');

    await query(createChatsTable);
    console.log('Chats table created');

    await query(createChatMembersTable);
    console.log('Chat members table created');

    await query(createMessagesTable);
    console.log('Messages table created');

    await query(createAttachmentsTable);
    console.log('Attachments table created');

    await query(createChatKeysTable);
    console.log('Chat keys table created');

    await query(createIndexes);
    console.log('Indexes created');

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error creating database schema:', error);
    throw error;
  }
};

export default createTables;
