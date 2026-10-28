// The emails the bakery sends. Each has a plain-text and an HTML version, because some
// email apps only show one of them.

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Plain text → safe HTML paragraphs that keep the line breaks.
function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 14px">${escapeHtml(block).replaceAll("\n", "<br>")}</p>`)
    .join("");
}

export function contactReplyEmail(input: { reply: string; originalMessage: string }) {
  const subject = "Re: your message to Chez Hayet Bakery";

  const text = `${input.reply}

Hayet
Chez Hayet Bakery · https://www.chezhayetoh.com

---- Your message ----
${input.originalMessage}`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#fff8f1;font-family:Arial,Helvetica,sans-serif;color:#3f2a26">
    <div style="max-width:560px;margin:0 auto;padding:32px 24px">
      <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:22px;color:#5e3934">
        Chez <span style="font-style:italic;color:#a9625a">Hayet</span> Bakery
      </p>
      <div style="background:#ffffff;border-radius:18px;padding:24px;line-height:1.6;font-size:15px">
        ${paragraphs(input.reply)}
        <p style="margin:18px 0 0;font-family:Georgia,serif;font-style:italic;font-size:18px;color:#a9625a">Hayet</p>
      </div>
      <div style="margin-top:20px;padding:16px 20px;border-left:3px solid #f3cfc8;color:#7a5a53;font-size:13px;line-height:1.5">
        <p style="margin:0 0 8px;font-weight:bold">Your message</p>
        ${paragraphs(input.originalMessage)}
      </div>
      <p style="margin-top:24px;font-size:12px;color:#7a5a53">
        <a href="https://www.chezhayetoh.com" style="color:#a9625a">chezhayetoh.com</a>
      </p>
    </div>
  </body>
</html>`;

  return { subject, text, html };
}
