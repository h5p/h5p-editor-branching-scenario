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
    .replace(/([A-Z])([A-Z])([a-z])|([a-z])([A-Z])/g, '$1$4 $2$3$5');

  const contentTitle = Content.getTooltip(content);
  const name = `${library}: ${contentTitle}`;

  return name.length > 80 ? name.substr(0, 77) + '...' : name;
};

export {
  isBranching,
  getAlternativeName,
  getMachineName,
};
