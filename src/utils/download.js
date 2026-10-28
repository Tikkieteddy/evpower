// tikkieteddielab: save text as a file in the browser.
export const downloadFile = (filename, text, type = "application/json") => {
  const url = window.URL.createObjectURL(new window.Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};
