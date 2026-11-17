import bcrypt from 'bcryptjs';

/**
 * The single bcrypt cost used for every stored password hash: seed accounts,
 * ADMIN-created users, the first production ADMIN, and the login dummy hash.
 * One value keeps bcrypt.compare at the same cost for real and unknown emails,
 * so response timing cannot reveal whether an ADMIN email exists.
 */
export const BCRYPT_COST = 10;

/**
 * Hash of a password nobody knows, compared when the email does not exist.
 * Built from BCRYPT_COST so the dummy comparison always costs the same as a
 * real account, even if the shared cost changes.
 */
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync('unused-dummy-password', BCRYPT_COST);
