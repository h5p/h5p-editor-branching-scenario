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

  const contentTitle = Content.getTooltip(content);
  const name = `${library}: ${contentTitle}`;

  return name.length > 80 ? name.substr(0, 77) + '...' : name;
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

export {
  isBranching,
  getAlternativeName,
  getMachineName,
  hasNextContent,
};
