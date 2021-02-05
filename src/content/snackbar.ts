const snackbarEl = document.createElement("div");
snackbarEl.id = "zenti-snackbar";
const snackbarTextNode = document.createTextNode("");
snackbarEl.appendChild(snackbarTextNode);
document.body.appendChild(snackbarEl);
let timeoutToken: ReturnType<typeof setTimeout>;

function displaySnackbar(text: string): void {
  console.debug("Displaying snackbar with text", text);
  clearTimeout(timeoutToken);
  snackbarTextNode.textContent = text;
  snackbarEl.className = "show";
  timeoutToken = setTimeout(() => {
    snackbarEl.className = "";
  }, 6000);
}

const snackbar = { display: displaySnackbar };

export default snackbar;
