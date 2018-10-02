/**
 * Recursive function that figures out if 'target' is a decendant of 'element'.
 *
 * @param {Element} element
 * @param {Element} target
 */
const isDecendantOf = (element, target) => {
  if (target === element) {
    return true; // Found
  }
  if (target.parentElement) {
    // Check further up the tree
    return isDecendantOf(element, target.parentElement);
  }

  return false; // Not found
};

export {
  isDecendantOf
};
