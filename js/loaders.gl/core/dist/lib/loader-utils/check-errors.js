export async function checkFetchResponseStatus(response) {
  if (!response.ok) {
    let errorMessage = `fetch failed ${response.status} ${response.statusText}`;

    try {
      const text = await response.text();

      if (text) {
        errorMessage += `: ${getErrorText(text)}`;
      }
    } catch (error) {}

    throw new Error(errorMessage);
  }
}
export function checkFetchResponseStatusSync(response) {
  if (!response.ok) {
    throw new Error(`fetch failed ${response.status}`);
  }
}

function getErrorText(text) {
  const matches = text.match('<pre>(.*)</pre>');
  return matches ? matches[1] : ` ${text.slice(0, 10)}...`;
}
//# sourceMappingURL=check-errors.js.map