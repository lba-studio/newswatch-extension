const notAllowedTags: Set<string> = new Set(["script", "style", "header"]);
const tagsToLookFor = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "li"];

export interface ElementText {
  elements: Array<HTMLElement>;
  cleanText: string;
}

function extractAndCleanTextContent(node: HTMLElement): string {
  return node.innerText.trim() || "";
}

function toTextBody(...elements: HTMLElement[]): ElementText {
  return {
    elements: elements,
    cleanText: elements.reduce(
      (acc, curr) => acc + " " + extractAndCleanTextContent(curr),
      ""
    ),
  };
}

export default function (minLength = 0): ElementText {
  const parentElements: Set<HTMLElement> = new Set();
  // get unique parent elements in for all <p> tags, and then see which container has the most text
  const allTextElements = Array.from(
    document.body.querySelectorAll<HTMLElement>(tagsToLookFor.join(","))
  );
  allTextElements.forEach((e) => {
    if (e.parentElement) {
      parentElements.add(e.parentElement);
    }
  });
  let candidateHtmlElement: ElementText | undefined;
  parentElements.forEach((e) => {
    const elementToCompare = toTextBody(e);
    if (
      !candidateHtmlElement ||
      candidateHtmlElement.cleanText.length < elementToCompare.cleanText.length
    ) {
      candidateHtmlElement = elementToCompare;
    }
  });
  if (
    !candidateHtmlElement ||
    (candidateHtmlElement?.cleanText.length || 0) < minLength
  ) {
    candidateHtmlElement = toTextBody(...allTextElements);
  }
  return candidateHtmlElement;
}
