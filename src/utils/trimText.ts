function trimText(text: string, maxLength: number): string {
  if (text.length > maxLength) {
    return `${text.slice(0, maxLength - 3)}...`;
  } else {
    return text;
  }
}

export default trimText;
