/**
 * Fetch the translated String.
 *
 * @params {...args}
 * @return {string}
 */
export function t () {
  const args = ['H5PEditor.BranchingScenario'];
  for (let i = 0; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  return H5PEditor.t.apply(window, args);
}
  