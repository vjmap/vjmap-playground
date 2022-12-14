export function getErrorMessageFromResponseSync(response) {
  return `Failed to fetch resource ${response.url}(${response.status}): ${response.statusText} `;
}
export async function getErrorMessageFromResponse(response) {
  let message = `Failed to fetch resource ${response.url} (${response.status}): `;

  try {
    const contentType = response.headers.get('Content-Type') || '';

    if (contentType.includes('application/json')) {
      message += await response.text();
    } else {
      message += response.statusText;
    }
  } catch (error) {
    return message;
  }

  return message;
}
//# sourceMappingURL=fetch-error-message.js.map