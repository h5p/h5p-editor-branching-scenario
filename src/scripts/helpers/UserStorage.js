
/**
 * Get key/value for current user.
 *
 * @param {string} key
 * @param {string} value
 */
const getUserStorage = (key, callback) => {
  let value;

  // Get value from browser storage
  if (window.localStorage !== undefined) {
    value = !!window.localStorage.getItem(key);
  }

  // Try to get a better value from user data storage
  try {
    H5P.getUserData(0, key, function (err, result) {
      if (!err) {
        value = result;
      }
      callback(value);
    });
  }
  catch (err) {
    callback(value);
  }
}

/**
 * Store key/value for current user.
 *
 * @param {string} key
 * @param {string} value
 */
const setUserStorage = (key, value) => {
  // Store in browser
  if (window.localStorage !== undefined) {
    window.localStorage.setItem(key, value);
  }

  // Try to store in user data storage
  try {
    H5P.setUserData(0, key, value);
  }
  catch (err) { /* Suppress error messages */ }
};

export {
  getUserStorage,
  setUserStorage
};
