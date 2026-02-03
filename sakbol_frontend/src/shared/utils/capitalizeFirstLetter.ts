export function capitalizeFirstLetter(string: string) {
  if (!string) { // Handle empty strings
    return "";
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
}