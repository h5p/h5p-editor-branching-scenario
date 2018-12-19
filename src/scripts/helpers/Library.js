import Content from "../components/Content";

/**
 * Determine if library is a branching question
 *
 * @param library
 * @returns {boolean}
 */
const isBranching = (library) => {
  return getMachineName(library) === 'H5P.BranchingQuestion';
};

/**
 * Get machine name from library data
 *
 * @param {string|object} library
 * @returns {string}
 */
const getMachineName = (library) => {
  let libraryString = library;
  if (library.params && library.params.type && library.params.type.library) {
    libraryString = library.params.type.library;
  }

  return libraryString.split(' ')[0];
};

/**
 * Determine option label for select
 *
 * @param {Object} content
 * @return {string}
 */
const getAlternativeName = (content) => {
  const library = getMachineName(content)
    .split('.')[1]
    .replace(/([A-Z])([A-Z])([a-z])|([a-z])([A-Z])/g, '$1$4 $2$3$5')
    .replace(/^Advanced Text$/, 'Text');

  const name = Content.getTooltip(content);
  return (name.length > 70 ? name.substr(0, 67) + '...' : name) + ' (' + (library.length > 30 ? library.substr(0, 27) + '...' : library) + ')';
};

/**
 * Determine if the content has the given nextContentId
 *
 * @param {Object} content
 * @param {number} id
 * @param {boolean} [num=null] Return num instead of ID
 * @return {number} ID of alternative, -1 for content or null if not found
 */
const hasNextContent = (content, id, num = null) => {
  if (isBranching(content)) {
    if (num !== null) {
      num = 0;
    }
    if (typeof content.params.type.params.branchingQuestion.alternatives !== 'undefined') {
      for (let i = 0; i < content.params.type.params.branchingQuestion.alternatives.length; i++) {
        if (content.params.type.params.branchingQuestion.alternatives[i].nextContentId === id) {
          if (num === null) {
            return i;
          }
          else {
            num++;
          }
        }
      }
    }
    return num;
  }
  else if (content.params.nextContentId === id) {
    return num !== null ? 1 : -1;
  }
  return num !== null ? 0 : null;
};

/**
 * Help find something in an array
 *
 * @param {Array} arr
 * @param {function} ev Callback
 * @return {*} Array value where ev = true
 */
const find = (arr, ev) => {
  for (let i = 0; i < arr.length; i++) {
    if (ev(arr[i], i)) {
      return arr[i];
    }
  }
};

/**
 * Help find all nextContentId for a branching question
 *
 * @param {Object} content
 * @return {number[]}
 */
const getBranchingChildren = (content) => {
  if (!content.params.type || !content.params.type.params ||
      !content.params.type.params.branchingQuestion ||
      !content.params.type.params.branchingQuestion.alternatives ||
      !content.params.type.params.branchingQuestion.alternatives.length) {
    return; // No alternatives today
  }

  let children = [];
  for (let i = 0; i < content.params.type.params.branchingQuestion.alternatives.length; i++) {
    children.push(content.params.type.params.branchingQuestion.alternatives[i].nextContentId);
  }

  return children;
};

export {
  isBranching,
  getAlternativeName,
  getMachineName,
  hasNextContent,
  find,
  getBranchingChildren
};
