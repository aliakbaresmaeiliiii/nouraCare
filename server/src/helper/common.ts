/**
 *
 * @param length - Generate Unique Code ( default length 32 )
 */
function getUniqueCodev2(length = 32) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/**
 *
 * @param length - Generate Unique Code ( default length 32 )
 */
function getUniqueCodev3(length = 4) {
    let result = ''
    const characters =
      'abcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    for (let i = 0; i < length; i += 1) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
  }
export {
    getUniqueCodev2,
    getUniqueCodev3
  }