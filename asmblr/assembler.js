/*
*   Simple assembler written by Noah Breedy 
*   Started on 3/19/2024  [1:35pm]
*   Version: 1.0.0 done on 3/19/2024 [11:03pm]
*   Version: 1.0.1 done on 3/20/2024 [4:50pm]
*   Currently the syntax is opcode reg1 , reg2 + immed
*   
*   NOTE: THIS ASSEMBLER SHOULD BE TESTED 
*   
*   NOTE: You can write hex 0xBEEF but you cannot write binary 0b00000 
*   
*   NOTE: The [] and , are optional but you should still write them
*   as they make code easier to read
*   
*   NOTE: There is no auto detect of raw lines all raw lines need to be specified with the 
*   
*       .raw key work
*    
*   EXAMPLE:
*       !Array
*           .raw 10 56 !main 0x9000 
*   
*   NOTE:
*       You can also model your instructions to be negative  
*       
*       I.e. 
*           jmp -!main     
*           !main
*      
*       This will result in a negative 2 being put into the immediate 
*       However it should be noted that the vm deals with all addresses as unsigned
*
*   Still needs testing and wont produce exactly the same binaries as the C
*   version of the assembler but will still give exactly the same output
*   
*   BIG NOTE: This assembler will not give out any errors and will attempt to compile 
*             your binary regardless. This can result in some wony final output if you were
*             to write some invalid assembly syntax
*/

const opcodes_dict = {
    "set":0,   // Set (assign a value)
    "lod":1,   // Load (retrieve a value)
    "str":2,   // Store (save a value)
    "psh":3,   // Push (push a value onto a stack)
    "pop":4,   // Pop (remove a value from the stack)
    "bts":5,   // Bitwise set (set a bit in a value)
    "btc":6,   // Bitwise clear (clear a bit in a value)
    "btf":7,   // Bitwise toggle (toggle a bit in a value)
    "cal":8,   // Call (invoke a subroutine)
    "add":9,   // Add (addition operation)
    "sub":10,   // Subtract (subtraction operation)
    "mpy":11,   // Multiply (multiplication operation)
    "div":12,   // Divide (division operation)
    "mod":13,   // Modulus (remainder operation)
    "and":14,   // Bitwise AND (logical AND operation)
    "or":15,    // Bitwise OR (logical OR operation)
    "xor":16,   // Bitwise XOR (exclusive OR operation)
    "shf":17,   // Bitwise shift (shift operation)
    "rot":18,   // Bitwise rotate (rotate operation)
    "neg":19,   // Negate (negation operation)
    "cmp":20,   // Compare (comparison operation)
    "jmp":21,   // Jump (unconditional jump)
    "djz":22,   // Decrement and jump if zero
    "dly":23    // Delay (pause execution for a specified time)
};

const registers_dict = {
    
    "pc":0,   //    program counter
    "sp":1,   //    stack pointer
    "rz":2,   //    register zero
    "ra":3,   //    General Purpose Registers
    "rb":4,   
    "rc":5,   
    "rd":6,   
    "re":7,   

    "r0":0,   //    program counter
    "r1":1,   //    stack pointer
    "r2":2,   //    register zero
    "r3":3,   //    General Purpose Registers
    "r4":4,   
    "r5":5,   
    "r6":6,   
    "r7":7,   
};

const jmp_pseudo_inst_dict = {
    "jmp": 0,
    "jg":  1,
    "jl":  2,
    "jne": 3,
    "je":  4,
    "jge": 5,
    "jle": 6,
};

const inc_dec_pseudo_inst_dict = {
    "inc":  9,
    "dec":  10,
};

const ret_pseudo_dict = {
    "ret": 4,
};

const MAX_LABEL_RESOLVES = 100;

function dec2bin(dec) {
    return (dec >>> 0).toString(2).padStart(16, '0');
}

function isNumber(val){
    return !isNaN(parseInt(val))
}

function isRegister(name){
    return name in registers_dict;
}

function isRawLine(name){
    return name == ".raw";
}

function isVariableDeclaration(name){
    return ((name == ".var") || (name == ".variable"));
}

function isConstantDeclaration(name){
    return ((name == ".const") || (name == ".constant"));
}

function isLabelDeclaration(name){
    return name[0] == '!';
}

function isValidConstant(name){
    return name in constant_tracker;
}

function isValidVariable(name){
    return name in variable_tracker;
}

function isValidLabel(name){
    return name in lable_tracker;
}

function containsOnlySpaces(inputString) {
    return inputString.trim() === '';
}

function hasNegatives(name){
    let count = 0;
    for(let i = 0; i < name.length; i++){
        if(name[i] == "-"){
            count++;
            if(count >= 2) return count;
        }
    }
    return count;
}

function processValue(val){
    if(isValidConstant(val)) return constant_tracker[val];
    if(isValidVariable(val)) return variable_tracker[val];
    if(isValidLabel(val)) return lable_tracker[val];
    if(isNumber(val)) return parseInt(val);
    return NaN;   
}


let lable_tracker = {};
let constant_tracker = {};
let variable_tracker = {};
function assemble(){
    
    let text = document.getElementById("asm-text").value
    const raw_lines = text.split(/\n/);
    let lines = []

    /* clear whitespace lines */
    for(var i = 0; i < raw_lines.length; i++){
        let current_line = raw_lines[i];
        if(!containsOnlySpaces(current_line)){
            lines.push(current_line.toLowerCase());
        }
    }
    const line_length = lines.length;
    let loop_number = 0;
    let address_number = 0x0000;
    let routine_address_number = 0x0000;
    let binary_image = [];
    let finished_label_resolving = true;
    lable_tracker = {};
    constant_tracker = {};
    variable_tracker = {};

    // Need to do this loop at least twice (if labels present) to account for the proper addresses
    for(var label_resolver = 0; label_resolver < MAX_LABEL_RESOLVES; label_resolver++){
        binary_image = [];
        finished_label_resolving = true;
        routine_address_number = 0x0000;
        console.log(`\n\nPASS #${label_resolver+1}`);
        for(loop_number = 0; loop_number < line_length; loop_number++){
                let current_line = lines[loop_number];   
                /* trim comments on current line */ 
                for(let i = 0; i < current_line.length; i++){
                    if(current_line[i] == ";"){
                        current_line = current_line.substring(0,i);
                        break;
                    }
                }
                
                let raw_tokens = current_line.split(",").join(" ").split(" ").join(" ").split("+").join(" ").split("[").join(" ").split("]").join(" ").split(" ");
                let test_subtract = raw_tokens.join(" ");
                let negative_result = hasNegatives(test_subtract);
                let negate_immediate = false;
                if(negative_result == 2){
                    negate_immediate = false
                }else if(negative_result == 1){
                    negate_immediate = true;
                }

                let raw_line_tokens = raw_tokens;
                raw_tokens = raw_tokens.join(" ").split("-").join(" ").split(" ");
                let tokens = [];
                let unnegated_tokens = [];

                for(var i = 0; i < raw_tokens.length; i++){
                    let current_token = raw_tokens[i];
                    if(!containsOnlySpaces(current_token)){
                        tokens.push(current_token);
                    }
                }
                
                for(var i = 0; i < raw_line_tokens.length; i++){
                    let current_token = raw_line_tokens[i];
                    if(!containsOnlySpaces(current_token)){
                        unnegated_tokens.push(current_token);
                    }
                }

                let token_length = tokens.length;
                console.log(tokens,negate_immediate);

                // /* this is a raw comment line */
                if(token_length == 0) continue;

                /* Handle Raw Lines */
                if(isRawLine(tokens[0])){
                    for(let i = 1; i < unnegated_tokens.length; i++){
                        /* Check if Constant,Variable,Label,Number */
                        binary_image.push(processValue(unnegated_tokens[i]));
                        address_number++;
                        routine_address_number++;
                    }
                    continue;
                }


                //                     11  10  7   4     0   << shift_positions
                //                  0b00000_0_000_000_0000
                let word_encoding = 0b0000000000000000;

                /* By default we will have the pc be set to the pc */
                let opcode = tokens[0];
                let teeny = 0;
                let reg1 = 0;
                let reg2 = registers_dict['rz'];
                let immed = 0; 
                let inst_flags = false;
                let variable_flag = false;


                if(token_length == 1){
                     /* 
                            1 means that its in the style of either
                            opcode 
                            label 
                    */
                    
                    if(tokens[0] in ret_pseudo_dict){
                            opcode = opcodes_dict["pop"];
                            teeny = 1;
                            reg1 = registers_dict["pc"];
                            reg2 = registers_dict["pc"]
                            immed = 0;
                    }

                    if(isLabelDeclaration(tokens[0])){
                        if(!isValidLabel(tokens[0])){
                            finished_label_resolving = false;
                            lable_tracker[tokens[0]] = address_number;
                        }
                        if(isValidLabel(tokens[0]) && lable_tracker[tokens[0]] != routine_address_number){
                            finished_label_resolving = false;
                            lable_tracker[tokens[0]] = routine_address_number;
                        }
                        // console.log(lable_tracker);
                        continue;
                    }      

                }else if(token_length == 2){
                   /* 
                        2 means that its in the style of either
                        opcode register
                        opcode immed 
                   */
                        if(tokens[0] in opcodes_dict){
                            opcode = opcodes_dict[tokens[0]];
                        }

                        immed = processValue(tokens[1]);
                        if(negate_immediate) immed *= -1;
                        register_flag = false;
                        if(isNaN(immed)){
                            if(isRegister(tokens[1])){
                                teeny = 1;
                                register_flag = true;
                                reg1 = registers_dict[tokens[1]];
                                reg2 = registers_dict["rz"];
                                immed = 0;
                                if(opcode == "dly" || opcode == "cal"){
                                    reg1 = registers_dict["rz"];
                                    reg2 = registers_dict[tokens[1]];
                                }
                            }
                        }

                        /* INC & DEC instructions */
                        if(tokens[0] in inc_dec_pseudo_inst_dict){
                            opcode = inc_dec_pseudo_inst_dict[tokens[0]];
                            immed = 1;
                            if(isRegister(tokens[1])){
                                reg1 = registers_dict[tokens[1]];
                            }
                        }

                        if(immed >= -8 && immed <= 7){
                            teeny = 1;
                        }

                        /* JUMP instructions */
                        if(tokens[0] in jmp_pseudo_inst_dict){
                            opcode = opcodes_dict["jmp"];
                            teeny = 0;
                            immed = processValue(tokens[1]);
                            if(negate_immediate) immed *= -1;
                            if(register_flag) teeny = 1;
                            inst_flags = jmp_pseudo_inst_dict[tokens[0]];
                        }

                }else if(token_length == 3){

                    /* 
                        3 means that its in the style of either
                        opcode r1, r2
                        opcode r1, immed 
                        opcode immed, r2
                        .constant name value
                        .variable name value
                    */

                    opcode = opcodes_dict[tokens[0]];
                    reg1 = registers_dict[tokens[1]];
                    immed  = processValue(tokens[2]);
                    if(negate_immediate) immed *= -1;

                    if(isNaN(immed)){
                        if(isRegister(tokens[2])){
                            immed = 0;
                            reg2 = registers_dict[tokens[2]];
                        }
                    }
        
                    if(tokens[0] == "dly" || tokens[0] == "cal"){
                        reg1 = registers_dict["rz"];
                        reg2 = registers_dict[tokens[1]];
                        immed  = processValue(tokens[2]);
                        if(negate_immediate) immed *= -1;
                        /* This should not happen but can happen if you do r1, r2 + r3 */
                        if(isNaN(immed)) immed = 0;
                    }

                    if(immed >= -8 && immed <= 7){
                        teeny = 1;
                    }

                    /* Handle STORE Instruction */
                    if(tokens[0] == "str"){
                        teeny = 0;
                        reg2 = registers_dict[tokens[2]];
                        immed = processValue(tokens[1]);
                        if(negate_immediate) immed *= -1;
                        if(isNaN(immed)){
                            if(isRegister(tokens[1])){
                                immed = 0;
                                teeny = 1;
                                reg1 = registers_dict[tokens[1]];
                            }
                        }else{
                            reg1 = registers_dict["rz"];
                        }
                        if(immed >= -8 && immed <= 7){
                            teeny = 1;
                        }
                    }

                    if(isVariableDeclaration(tokens[0])){
                        teeny = 1;
                        if(!isValidVariable(tokens[1])){

                            variable_tracker[tokens[1]] = address_number;
                            immed = processValue(tokens[2]);
                            if(negate_immediate) immed *= -1;
                            if(isNaN(immed)){
                                if(isRegister(tokens[2])){
                                    immed = registers_dict[tokens[2]];
                                }
                            }
                            variable_flag = true;

                            // console.log(variable_tracker);

                        }else if(isValidVariable(tokens[1])){
                            immed = processValue(tokens[2]);
                            if(negate_immediate) immed *= -1;
                            if(isNaN(immed)){
                                if(isRegister(tokens[2])){
                                    immed = registers_dict[tokens[2]];
                                }
                            }
                            variable_flag = true;
                        }
                    }

                    if(isConstantDeclaration(tokens[0])){
                        if(!isValidConstant(tokens[1])){
                            immed = processValue(tokens[2]);
                            if(negate_immediate) immed *= -1;
                            if(isNaN(immed)){
                                if(isRegister(tokens[2])){
                                    immed = registers_dict[tokens[2]];
                                }
                            }
                            constant_tracker[tokens[1]] = immed;
                        }
                        continue;
                    }
                    
                    if(tokens[0] in jmp_pseudo_inst_dict){
                        /* opcode r1 + immed*/
                        inst_flags = jmp_pseudo_inst_dict[tokens[0]];
                        teeny = 0;
                        immed = processValue(tokens[2]);
                        if(negate_immediate) immed *= -1;
                        if(isNaN(immed)) immed = 0;
                    }

                }else if(token_length == 4){
                     /* 
                        4 means that its in the style of either
                        opcode r1, r2 + immed
                        opcode r1 + immed, r2
                    */
                    opcode = opcodes_dict[tokens[0]];
                    reg1 = registers_dict[tokens[1]];
                    reg2 = registers_dict[tokens[2]];
                    immed = processValue(tokens[3]);
                    if(negate_immediate) immed *= -1;

                    /* Handle STORE Instruction */
                    if(tokens[0] == "str"){
                        immed = processValue(tokens[2]);
                        if(negate_immediate) immed *= -1;

                        reg2 = registers_dict[tokens[3]];
                    }

                    if(isNaN(immed)) immed = 0;
                    if(immed >= -8 && immed <= 7){
                        teeny = 1;
                    }
                }

                word_encoding |= (opcode << 11) & 0xFFFF;
                word_encoding |= (teeny << 10) & 0xFFFF;
                word_encoding |= (reg1 << 7) & 0xFFFF;
                word_encoding |= (reg2 << 4) & 0xFFFF;
                if(inst_flags) word_encoding |= (inst_flags << 0) & 0xF;
                if(teeny){
                    if(!inst_flags) word_encoding |= (immed << 0) & 0xF;
                    if(variable_flag) word_encoding = (immed) & 0xFFFF;
                    console.log("One Word: ");
                    console.log(dec2bin(word_encoding));
                    binary_image.push(word_encoding);
                }else{
                    let word2_encoding = 0b0000000000000000;
                    word2_encoding |= (immed << 0) & 0xFFFF;
                    console.log("Two Words: ");
                    console.log(`1st -> ${dec2bin(word_encoding)}`);
                    console.log(`2nd -> ${dec2bin(word2_encoding)}`);
                    binary_image.push(word_encoding);
                    binary_image.push(word2_encoding);
                    address_number++;
                    routine_address_number++;
                }

                address_number++;
                routine_address_number++;
        }
        
        if(finished_label_resolving){
            break;
        }
    }

    const binaryData = new Uint16Array(binary_image);
    const blob = new Blob([binaryData]);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    let file_name = "binaryData";
    if(document.getElementById("file-name").value != ""){
        file_name = document.getElementById("file-name").value;
    }
    link.download = `${file_name}.bin`;
    link.click();
    URL.revokeObjectURL(link.href);
    console.table(binary_image);
}