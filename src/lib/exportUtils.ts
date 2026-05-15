import { McqData } from "@/components/outputs/McqView";
import { MindMapNode } from "@/components/outputs/MindMapView";
import { FillBlanksData } from "@/components/outputs/FillBlanksView";
import { MatchingData } from "@/components/outputs/MatchingView";
import { ShortQAData } from "@/components/outputs/ShortQAView";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateCleanHtml(
  mode: string,
  data: any,
  topic: string,
  extraParams?: Record<string, number>,
  pdfMeta?: { name?: string; className?: string; date?: string }
): string {
  let content = '';

  switch (mode) {
    case "summary": {
      content = `<div class="content">${(data as string).split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')}</div>`;
      break;
    }
    case "mcq": {
      const mcq = data as McqData;
      
      const questionsHtml = mcq.questions.map((q, i) => `
        <li>
          <p class="question"><strong>Q${i + 1}:</strong> ${q.question}</p>
          <ul class="options">
            ${q.options.map((opt, j) => `<li>${['A', 'B', 'C', 'D'][j]}. ${opt}</li>`).join('')}
          </ul>
        </li>
      `).join('');
      
      const answerKeyHtml = mcq.questions.map((q, i) => `<span><strong>${i + 1}</strong>-${q.answer}</span>`).join(' &nbsp;&nbsp;|&nbsp;&nbsp; ');

      content = `
        <ol class="mcq-list">
          ${questionsHtml}
        </ol>
        <div class="html2pdf__page-break"></div>
        <div class="answer-key-section">
          <h2>Answer Key</h2>
          <div class="answer-key-box">${answerKeyHtml}</div>
        </div>`;
      break;
    }
    case "notes": {
      const notes = data as { notes: string[] };
      content = `
        <div class="notes-list">
          ${notes.notes.map((n, idx) => `
            <div class="note-item">
              <span class="note-number">${idx + 1}.</span>
              <span class="note-text">${n}</span>
            </div>
          `).join('')}
        </div>`;
      break;
    }
    case "mindmap": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const renderNode = (node: any): string => {
        if (!node) return '';
        const title = node.title || '';
        if (!node.children || node.children.length === 0) {
          return `<li class="mm-li"><div class="mm-box">${title}</div></li>`;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const childrenHtml = node.children.map((c: any) => renderNode(c)).join('');
        return `
          <li class="mm-li">
            <div class="mm-box">${title}</div>
            <ul class="mm-ul">${childrenHtml}</ul>
          </li>
        `;
      };
      
      const mindmapRootTitle = data.root && typeof data.root === 'string' ? data.root : (data.root?.title || data.title || topic);
      const branches = data.branches || data.root?.children || data.children || [];
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const branchesHtml = branches.map((b: any) => renderNode(b)).join('');

      content = `
        <div class="mindmap-horizontal">
          <ul class="mm-ul">
            <li class="mm-li">
              <div class="mm-box">${mindmapRootTitle}</div>
              ${branchesHtml ? `<ul class="mm-ul">${branchesHtml}</ul>` : ''}
            </li>
          </ul>
        </div>`;
      break;
    }
    case "fill": {
      const fill = data as FillBlanksData;
      const questionsHtml = fill.questions.map((q, idx) => `
        <div class="fill-item">
          <span class="fill-number">${idx + 1}.</span>
          <span class="fill-text">${q.sentence.replace('___', `_________________`)}</span>
        </div>
      `).join('');
      
      const answerKeyHtml = fill.questions.map((q, i) => `<span><strong>${i + 1}.</strong> ${q.answer}</span>`).join('<br/>');

      content = `
        <div class="fill-container">
          ${questionsHtml}
        </div>
        <div class="html2pdf__page-break"></div>
        <div class="answer-key-section">
          <h2>Answer Key</h2>
          <div class="answer-key-box">${answerKeyHtml}</div>
        </div>`;
      break;
    }
    case "match": {
      const match = data as MatchingData;
      let answerKeyText = '';

      const setsHtml = match.sets.map((set, i) => {
        const rightItems = set.right.map((text, originalIndex) => ({ text, originalIndex }));
        
        for (let k = rightItems.length - 1; k > 0; k--) {
            const j = Math.floor(Math.random() * (k + 1));
            [rightItems[k], rightItems[j]] = [rightItems[j], rightItems[k]];
        }
        
        const setAnswers = set.left.map((_, leftIndex) => {
           const rightCharIndex = rightItems.findIndex(r => r.originalIndex === leftIndex);
           return `<strong>${leftIndex + 1}</strong>-${String.fromCharCode(65 + rightCharIndex)}`;
        });
        
        answerKeyText += `<div style="margin-bottom: 10px;"><strong>Set ${i + 1}:</strong> ${setAnswers.join(', ')}</div>`;

        return `
          <div class="match-set-block">
            <h3>Set ${i + 1}</h3>
            <table class="classic-match-table">
              <thead>
                <tr>
                  <th style="width: 55%; text-align: left; padding-bottom: 15px;">Column A</th>
                  <th style="width: 45%; text-align: left; padding-bottom: 15px;">Column B</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="vertical-align: top; padding-right: 30px;">
                    <ul class="classic-list">
                      ${set.left.map((text, idx) => `
                        <li>
                          <div class="match-row">
                            <span class="match-blank">_______</span>
                            <strong>${idx + 1}.</strong> 
                            <span class="match-text">${text}</span>
                          </div>
                        </li>
                      `).join('')}
                    </ul>
                  </td>
                  <td style="vertical-align: top;">
                    <ul class="classic-list">
                      ${rightItems.map((r, idx) => `
                        <li>
                          <div class="match-row">
                            <strong>${String.fromCharCode(65 + idx)}.</strong> 
                            <span class="match-text">${r.text}</span>
                          </div>
                        </li>
                      `).join('')}
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
      }).join('');

      content = `
        <div class="match-container">
          <p style="margin-bottom: 20px; font-style: italic;">Directions: Match each item in Column A with the correct item in Column B. Write the letter of the correct match on the blank line.</p>
          ${setsHtml}
        </div>
        <div class="html2pdf__page-break"></div>
        <div class="answer-key-section">
          <h2>Answer Key</h2>
          <div class="answer-key-box">${answerKeyText}</div>
        </div>`;
      break;
    }
    case "shortqa": {
      const qa = data as ShortQAData;
      const ansLines = extraParams?.answerLines ?? 4;

      const questionsHtml = qa.qas.map((item, idx) => {
        const writingLines = Array.from({ length: ansLines })
          .map(() => `<div class="qa-write-line"></div>`)
          .join('');
        return `
          <div class="qa-item">
            <p class="qa-question"><strong>Q${idx + 1}.</strong> ${item.question}</p>
            <div class="qa-lines">${writingLines}</div>
          </div>
        `;
      }).join('');

      const answerKeyHtml = qa.qas.map((item, idx) => `
        <div class="qa-answer-item">
          <p class="qa-ans-q"><strong>Q${idx + 1}.</strong> ${item.question}</p>
          <p class="qa-ans-a">${item.answer}</p>
        </div>
      `).join('');

      content = `
        <div class="qa-container">
          ${questionsHtml}
        </div>
        <div class="html2pdf__page-break"></div>
        <div class="answer-key-section">
          <h2>Answer Key</h2>
          <div class="answer-key-box">${answerKeyHtml}</div>
        </div>`;
      break;
    }
  }

  const modeTitles: Record<string, string> = {
    summary: "Summary",
    mcq: "Multiple Choice Questions",
    notes: "Short Notes",
    mindmap: "Mind Map Outline",
    fill: "Fill in the Blanks",
    match: "Matching Exercises",
    shortqa: "Short Questions & Answers"
  };

  const docTitle = modeTitles[mode] || "Study Material";

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${topic} - ${docTitle}</title>
        <style>
          .export-wrapper { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #000000 !important; background-color: #ffffff !important; max-width: 800px; margin: 0 auto; padding: 40px 20px; text-align: left; box-sizing: border-box; overflow-wrap: break-word; word-wrap: break-word; }
          .export-wrapper * { color: #000000 !important; box-sizing: border-box; }
          .export-wrapper h1 { color: #1a365d !important; border-bottom: 2px solid #e2e8f0 !important; padding-bottom: 10px; margin-bottom: 5px; }
          .export-wrapper h2 { color: #2d3748 !important; margin-top: 30px; margin-bottom: 20px !important; display: block; }
          .export-wrapper h3 { color: #4a5568 !important; margin-top: 25px; margin-bottom: 10px; }
          .export-wrapper p { margin-bottom: 15px; }
          .export-wrapper .mcq-list { list-style-type: none; padding: 0; }
          .export-wrapper .mcq-list > li { margin-bottom: 25px; page-break-inside: avoid; }
          .export-wrapper .question { font-weight: 600 !important; font-size: 1.1em; margin-bottom: 8px; }
          .export-wrapper .options { list-style-type: none; padding-left: 0; margin-bottom: 10px; }
          .export-wrapper .options li { margin-bottom: 4px; padding: 8px 12px; background-color: #f7fafc !important; border-radius: 4px; border: 1px solid #edf2f7 !important; }
          .export-wrapper .notes-list { padding: 0; }
          .export-wrapper .note-item { display: flex; align-items: flex-start; margin-bottom: 15px; }
          .export-wrapper .note-number { font-weight: bold; margin-right: 12px; min-width: 25px; }
          .export-wrapper .note-text { flex: 1; }
          
          /* Visual Horizontal Mind Map Styles */
          .export-wrapper .mindmap-horizontal { display: flex; overflow-x: auto; padding: 20px 0; font-family: 'Inter', sans-serif; }
          .export-wrapper .mm-ul { display: flex; flex-direction: column; justify-content: center; position: relative; margin-left: 30px; padding-left: 30px; list-style: none !important; margin-top: 0; margin-bottom: 0; }
          .export-wrapper .mm-li { display: flex; align-items: center; position: relative; padding: 10px 0; list-style: none !important; page-break-inside: avoid; }
          
          /* Connecting Lines */
          .export-wrapper .mm-ul::before { content: ""; position: absolute; left: -30px; top: 50%; width: 30px; height: 2px; background: #a855f7 !important; transform: translateY(-50%); }
          .export-wrapper .mm-li::after { content: ""; position: absolute; left: -30px; width: 2px; background: #a855f7 !important; }
          .export-wrapper .mm-li::after { top: 0; height: 100%; }
          .export-wrapper .mm-li:first-child::after { top: 50%; height: 50%; }
          .export-wrapper .mm-li:last-child::after { top: 0; height: 50%; }
          .export-wrapper .mm-li:only-child::after { display: none; }
          .export-wrapper .mm-li::before { content: ""; position: absolute; left: -30px; top: 50%; width: 30px; height: 2px; background: #a855f7 !important; transform: translateY(-50%); }
          
          /* Base Box */
          .export-wrapper .mm-box { padding: 12px 24px; border-radius: 30px !important; font-weight: 600; font-size: 0.95em; text-align: center; max-width: 180px; box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important; z-index: 2; position: relative; line-height: 1.4; border: 1px solid rgba(0,0,0,0.05) !important; }
          
          /* Levels Coloring */
          .export-wrapper .mindmap-horizontal > .mm-ul > .mm-li > .mm-box { background: #a855f7 !important; color: #ffffff !important; font-size: 1.1em; }
          .export-wrapper .mindmap-horizontal > .mm-ul > .mm-li > .mm-ul > .mm-li > .mm-box { background: #38bdf8 !important; color: #000000 !important; }
          .export-wrapper .mindmap-horizontal > .mm-ul > .mm-li > .mm-ul > .mm-li > .mm-ul > .mm-li > .mm-box { background: #f472b6 !important; color: #000000 !important; }
          .export-wrapper .mindmap-horizontal > .mm-ul > .mm-li > .mm-ul > .mm-li > .mm-ul > .mm-li > .mm-ul .mm-box { background: #7dd3fc !important; color: #000000 !important; }
          
          /* Clean up root connector */
          .export-wrapper .mindmap-horizontal > .mm-ul { margin-left: 0; padding-left: 0; }
          .export-wrapper .mindmap-horizontal > .mm-ul::before { display: none; }
          .export-wrapper .mindmap-horizontal > .mm-ul > .mm-li::after, .export-wrapper .mindmap-horizontal > .mm-ul > .mm-li::before { display: none; }

          .export-wrapper .fill-container { padding: 0; }
          .export-wrapper .fill-item { display: flex; align-items: flex-start; margin-bottom: 20px; font-size: 1.1em; line-height: 1.8; page-break-inside: avoid; }
          .export-wrapper .fill-number { font-weight: bold; margin-right: 12px; min-width: 25px; }
          .export-wrapper .fill-text { flex: 1; }
          
          /* Traditional Matching Styles */
          .export-wrapper .match-set-block { margin-bottom: 50px; page-break-inside: avoid; }
          .export-wrapper .classic-match-table { width: 100%; border-collapse: collapse; border: none !important; }
          .export-wrapper .classic-match-table th, .export-wrapper .classic-match-table td { border: none !important; background: none !important; padding: 0; }
          .export-wrapper .classic-match-table th { font-weight: bold; font-size: 1.1em; border-bottom: 1px solid #cbd5e0 !important; padding-bottom: 10px; }
          .export-wrapper .classic-list { list-style-type: none; padding: 0; margin: 0; margin-top: 15px; }
          .export-wrapper .classic-list li { margin-bottom: 20px; }
          .export-wrapper .match-row { display: flex; align-items: flex-start; gap: 8px; }
          .export-wrapper .match-blank { letter-spacing: -1px; margin-right: 5px; }
          .export-wrapper .match-text { flex: 1; }
          
          /* Answer Key Styles */
          .export-wrapper .answer-key-section { margin-top: 40px; border-top: 2px solid #e2e8f0 !important; padding-top: 30px; display: block; }
          .export-wrapper .answer-key-section h2 { margin-top: 0 !important; margin-bottom: 25px !important; }
          .export-wrapper .answer-key-box { background-color: #f0fff4 !important; padding: 20px; border-radius: 8px; border: 1px solid #c6f6d5 !important; line-height: 1.8; display: block; }
          .export-wrapper .header { text-align: center; margin-bottom: 40px; }
          .export-wrapper .subtitle { color: #4a5568 !important; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; font-weight: 600 !important; }
          .export-wrapper .doc-type { color: #2d3748 !important; font-size: 1.2em; font-weight: 500 !important; margin-top: 10px; }
          .export-wrapper .meta-info { display: table; width: 100%; border-top: 1px solid #e2e8f0 !important; margin-top: 12px; padding-top: 10px; font-size: 0.85em; color: #4a5568 !important; }
          .export-wrapper .meta-col { display: table-cell; width: 33.33%; font-weight: 500; }
          .export-wrapper .meta-col.left { text-align: left; }
          .export-wrapper .meta-col.center { text-align: center; }
          .export-wrapper .meta-col.right { text-align: right; }

          /* Short Q&A Styles */
          .export-wrapper .qa-container { padding: 0; }
          .export-wrapper .qa-item { margin-bottom: 30px; page-break-inside: avoid; }
          .export-wrapper .qa-question { font-weight: 600; font-size: 1.05em; margin-bottom: 10px; line-height: 1.5; }
          .export-wrapper .qa-lines { padding-left: 16px; }
          .export-wrapper .qa-write-line { border-bottom: 1px solid #a0aec0 !important; height: 28px; margin-bottom: 6px; }
          .export-wrapper .qa-answer-item { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px dashed #c6f6d5 !important; page-break-inside: avoid; }
          .export-wrapper .qa-ans-q { font-weight: 600; margin-bottom: 8px; font-size: 1.05em; }
          .export-wrapper .qa-ans-a { color: #2d6a4f !important; padding-left: 16px; padding-right: 16px; line-height: 1.8; margin-top: 0; }
        </style>
      </head>
      <body>
        <div class="export-wrapper">
          <div class="header">
            <div class="subtitle">Smart Lesson Analyzer</div>
            <h1>${topic}</h1>
            <div class="doc-type">${docTitle}</div>
            ${(pdfMeta?.name || pdfMeta?.className || pdfMeta?.date) ? `
            <div class="meta-info">
              <div class="meta-col left">${pdfMeta?.name ? `Name: ${pdfMeta.name}` : ''}</div>
              <div class="meta-col center">${pdfMeta?.className ? `Class: ${pdfMeta.className}` : ''}</div>
              <div class="meta-col right">${pdfMeta?.date ? `Date: ${pdfMeta.date}` : ''}</div>
            </div>` : ''}
          </div>
          ${content}
        </div>
      </body>
    </html>
  `;
}
