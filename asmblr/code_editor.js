let asm_text = document.getElementById("asm-text");
let code_editor = document.getElementById("code-block");

asm_text.addEventListener("input",()=>{
        updateCode(asm_text);
});

function updateCode(elm){
    let text = elm.value;
    // text = content.replace(/&/g, '&amp;');
    // text = content.replace(/</g, '&lt;');
    // text = content.replace(/>/g, '&gt;')
    code_editor.innerHTML = text;

    highlight();
}

function highlight(){
    document.querySelectorAll('pre code').forEach((el) => {
        p = document.createElement("p");
        
        let r = asm_text.value.replace(/\b(red)\b/g,"<p id=\"red\">red</p>");
        p.innerHTML = r;
        
        el.innerHTML = p.innerHTML;
    });
}

function syncScroll(elm){
    let codeEditor = document.getElementById("codeBlock");
    codeEditor.scrollTop = elm.scrollTop;
    codeEditor.scrollLeft = elm.scrollLeft;
}


       // applying shortcut keys
asm_text.addEventListener('keydown', function (e) {

        // [Enter] key pressed detected
        if (e.key === 'Enter') {

            // Prevent the default behavior (new line)
            e.preventDefault();

            // Get the cursor position
            var cursorPos = asm_text.selectionStart;

            // Get the previous line
            var prevLine = asm_text.value.substring(0, cursorPos).split('\n').slice(-1)[0];

            // Get the indentation of the previous line
            var indent = prevLine.match(/^\s*/)[0];

            // Add a new line with the same indentation
            asm_text.setRangeText('\n' + indent, cursorPos, cursorPos, 'end');

            // remove focus
            asm_text.blur();

            // regain focus (this is force the textarea scroll to caret position in case the caret falls out the textarea visible area)
            asm_text.focus();

            // copy the code from textarea to code block      
            updateCode();
            return;
        }

        // [Tab] pressed, but no [Shift]
        if (e.key === "Tab" && !e.shiftKey &&

            // and no highlight detected
            asm_text.selectionStart == asm_text.selectionEnd) {

            // suspend default behaviour
            e.preventDefault();

            // Get the current cursor position
            let cursorPosition = asm_text.selectionStart;

            // Insert 4 white spaces at the cursor position
            let newValue = asm_text.value.substring(0, cursorPosition) + "    " +
                asm_text.value.substring(cursorPosition);

            // Update the textarea value and cursor position
            asm_text.value = newValue;
            asm_text.selectionStart = cursorPosition + 4;
            asm_text.selectionEnd = cursorPosition + 4;

            // copy the code from textarea to code block      
            updateCode();
            return;
        }

        // [Tab] and [Shift] keypress presence
        if (e.key === "Tab" && e.shiftKey &&

            // no highlight detected
            asm_text.selectionStart == asm_text.selectionEnd) {

            // suspend default behaviour
            e.preventDefault();

            // Get the current cursor position
            let cursorPosition = asm_text.selectionStart;

            // Check the previous characters for spaces
            let leadingSpaces = 0;
            for (let i = 0; i < 4; i++) {
                if (asm_text.value[cursorPosition - i - 1] === " ") {
                    leadingSpaces++;
                } else {
                    break;
                }
            }

            if (leadingSpaces > 0) {
                // Remove the spaces
                let newValue = asm_text.value.substring(0, cursorPosition - leadingSpaces) +
                    asm_text.value.substring(cursorPosition);

                // Update the textarea value and cursor position
                asm_text.value = newValue;
                asm_text.selectionStart = cursorPosition - leadingSpaces;
                asm_text.selectionEnd = cursorPosition - leadingSpaces;
            }

            // copy the code from textarea to code block
            updateCode();
            return;
        }

        // [Tab] key pressed and range selection detected
        if (e.key == 'Tab' & asm_text.selectionStart != asm_text.selectionEnd) {
            e.preventDefault();

            // split the textarea content into lines
            let lines = this.value.split('\n');

            // find the start/end lines
            let startPos = this.value.substring(0, this.selectionStart).split('\n').length - 1;
            let endPos = this.value.substring(0, this.selectionEnd).split('\n').length - 1;

            // calculating total removed white spaces
            // these values will be used for adjusting new cursor position
            let spacesRemovedFirstLine = 0;
            let spacesRemoved = 0;

            // [Shift] key was pressed (this means we're un-indenting)
            if (e.shiftKey) {

                // iterate over all lines
                for (let i = startPos; i <= endPos; i++) {

                    // /^ = from the start of the line,
                    // {1,4} = remove in between 1 to 4 white spaces that may existed
                    lines[i] = lines[i].replace(/^ {1,4}/, function (match) {

                        // "match" is a string (white space) extracted

                        // obtaining total white spaces removed

                        // total white space removed at first line
                        if (i == startPos)
                            spacesRemovedFirstLine = match.length;

                        // total white space removed overall
                        spacesRemoved += match.length;

                        return '';
                    });
                }
            }

            // no shift key, so we're indenting
            else {
                // iterate over all lines
                for (let i = startPos; i <= endPos; i++) {
                    // add a tab to the start of the line
                    lines[i] = '    ' + lines[i]; // four spaces
                }
            }

            // remember the cursor position
            let start = this.selectionStart;
            let end = this.selectionEnd;

            // put the modified lines back into the textarea
            this.value = lines.join('\n');

            // adjust the position of cursor start selection
            this.selectionStart = e.shiftKey ?
                start - spacesRemovedFirstLine : start + 4;

            // adjust the position of cursor end selection
            this.selectionEnd = e.shiftKey ?
                end - spacesRemoved : end + 4 * (endPos - startPos + 1);

            // copy the code from textarea to code block      
            updateCode();
            return;
        }

        // [Shift] + [Del]/[Backspace] = Delete entire line(s)
        if (e.shiftKey && (e.key === "Delete" || e.key === "Backspace")) {

            e.preventDefault();

            // find the start/end lines
            let startPos = this.value.substring(0, this.selectionStart).split('\n').length - 1;
            let endPos = this.value.substring(0, this.selectionEnd).split('\n').length - 1;

            // get the line and the position in that line where the cursor is
            // pop() = take out the last line (which is the cursor selection start located)
            let cursorLine = this.value.substring(0, this.selectionStart).split('\n').pop();

            // get the position of cursor within the last line
            let cursorPosInLine = cursorLine.length;

            // calculating total lines to be removed
            let totalLinesRemove = endPos - startPos + 1;

            // split the textarea content into lines
            let lines = this.value.split('\n');

            // calculate new cursor position
            let newStart = lines.slice(0, startPos).join('\n').length + (startPos > 0 ? 1 : 0);
            // add 1 if startPos > 0 to account for '\n' character

            // remove the selected lines
            lines.splice(startPos, totalLinesRemove);

            // get the new line where the cursor will be after deleting lines
            // if lines[startPos] is not existed, then the new line will be an empty string
            let newLine = lines[startPos] || '';

            // if the new line is shorter than the cursor position, put the cursor at the end of the line
            if (newLine.length < cursorPosInLine) {
                cursorPosInLine = newLine.length;
            }

            // adjuct the cursor's position in the line to the new cursor position
            newStart += cursorPosInLine;

            // put the modified lines back into the textarea
            this.value = lines.join('\n');

            // set the new cursor position
            // both cursor selection start and end will be at the same position
            this.selectionStart = this.selectionEnd = newStart;

            // copy the code from textarea to code block      
            updateCode();
            return;
        }

        // Move cursor to the first non-white space character
        if (e.key === "Home") {

            // get the line and the position in that line where the cursor is
            // pop() = take out the last line (which is the cursor selection start located)
            let line = this.value.substring(0, this.selectionStart).split('\n').pop();

            // get the position of cursor within the last line
            let cursorPosInLine = line.length;

            // Find the start of the current line
            let lineStartPos = this.value.substring(0, this.selectionStart).lastIndexOf('\n') + 1;

            // Find the first non-whitespace character on the line
            let firstNonWhitespacePos = line.search(/\S/);

            // the cursor's position is already in front of first non-whitespace character,
            // or it's position is before first none-whitespace character,
            // move the cursor to the start of line
            if (firstNonWhitespacePos >= cursorPosInLine) {
                // do nothing, perform default behaviour, which is moving the cursor to beginning of the line
                return true;
            }
            // If there's no non-whitespace character, this is an empty or whitespace-only line
            else if (firstNonWhitespacePos === -1) {
                // do nothing, perform default behaviour, which is moving the cursor to beginning of the line
                return true;
            }

            // Prevent the default Home key behavior
            e.preventDefault();

            // Move the cursor to the position of the first non-whitespace character
            this.selectionStart = this.selectionEnd = lineStartPos + firstNonWhitespacePos;

            return;
        }

        updateCode(asm_text);
    });