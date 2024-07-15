/** User class for message.ly */
const db = require('../db');
const bcrypt = require("bcrypt");
const ExpressError = require("../expressError");
const { BCRYPT_WORK_FACTOR } = require('../config');

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    let hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
        `INSERT INTO users (
              username,
              password,
              first_name,
              last_name,
              phone,
              join_at,
              last_login_at)
            VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
            RETURNING username, password, first_name, last_name, phone`,
        [username, hashedPassword, first_name, last_name, phone]
    );
    return result.rows[0];

  }


  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
   const result = await db.query(
      "SELECT password FROM users WHERE username = $1",
      [username]);
    const user = result.rows[0];
  
    return user && await bcrypt.compare(password, user.password);
  
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {

    const result = await db.query(`
      UPDATE users SET last_login_at = current_timestamp
      WHERE username =$1
      RETURNING username, last_login_at`, [username]);

    const data = result.rows[0];
    if (!data) throw new ExpressError(`user ${username} does not exist!`, 404)

  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query(`
      SELECT username, first_name, last_name, phone
      FROM users`);
    const users = results.rows;
    return users;

  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(`
      SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users
      WHERE username =$1`, [username]);
    const user = result.rows[0];
    if (!user) throw new ExpressError(`User ${username} does not exist!`, 404)
    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const results = await db.query(`
      SELECT m.id,
      m.to_username,
      u.first_name,
      u.last_name,
      u.phone,
      m.body,
      m.sent_at,
      m.read_at
      FROM messages AS m
      JOIN users AS u ON m.to_username = u.username
      WHERE from_username = $1`, [username]);

    const dataRows = results.rows;

    const returnData = dataRows.map(m => ({
      id: m.id,
      to_user: {
        username: m.to_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at

    }));
    return returnData;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const results = await db.query(`
      SELECT m.id,
      m.from_username,
      u.first_name,
      u.last_name,
      u.phone,
      m.body,
      m.sent_at,
      m.read_at
      FROM messages AS m
      JOIN users AS u ON m.from_username = u.username
      WHERE to_username = $1`, [username]);

    const dataRows = results.rows;
    if (dataRows.length === 0) throw new ExpressError(`There is no messages to ${username}!`, 404);
    const returnData = dataRows.map(m => ({
      id: m.id,
      from_user: {
        username: m.from_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at

    }));
    return returnData;
  }
}


module.exports = User;