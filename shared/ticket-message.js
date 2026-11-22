function renderTicketPlaceholders(value, data = {}) {
  const replacements = {
    "{user}": data.user || "@Beispielnutzer",
    "{username}": data.username || "Beispielnutzer",
    "{category}": data.category || "Allgemein",
    "{ticket}": data.ticket || "0001",
    "{server}": data.server || "Dein Discord-Server",
    "{panel}": data.panel || "Support",
    "{answers}": data.answers || "Beispielantworten aus dem Formular"
  };
  return String(value || "").replace(/\\{user\\}|\\{username\\}|\\{category\\}|\\{ticket\\}|\\{server\\}|\\{panel\\}|\\{answers\\}/g, token => replacements[token]);
}
module.exports = { renderTicketPlaceholders };
