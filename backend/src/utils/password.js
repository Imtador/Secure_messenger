import argon2 from 'argon2';
import config from '../config/index.js';

export const hashPassword = async (password) => {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: config.argon2.memoryCost,
      timeCost: config.argon2.timeCost,
      parallelism: config.argon2.parallelism,
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
};

export const verifyPassword = async (hash, password) => {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

export default { hashPassword, verifyPassword };
