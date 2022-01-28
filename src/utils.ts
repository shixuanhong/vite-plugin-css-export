export const drillDown = (obj: any, keys: Array<string>): any => {
  if (!obj) {
    return obj
  }
  const key = keys.shift()
  if (key) {
    if (!obj[key]) {
      obj[key] = {}
    }
    if (keys.length > 0) {
      return drillDown(obj[key], keys)
    }
    else {
      return obj[key]
    }
  } else {
    return obj
  }
}