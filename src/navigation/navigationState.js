/** Returns the leaf route name from a React Navigation state tree. */
export function getFocusedRouteName(state) {
  if (!state?.routes?.length) {
    return undefined;
  }
  const index = state.index ?? 0;
  const route = state.routes[index];
  if (!route) {
    return undefined;
  }
  if (route.state) {
    return getFocusedRouteName(route.state);
  }
  return route.name;
}
