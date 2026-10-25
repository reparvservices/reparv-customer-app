export function devLog(...args) {
  if (__DEV__) {
    console.log(...args);
  }
}

export function devWarn(...args) {
  if (__DEV__) {
    console.warn(...args);
  }
}
