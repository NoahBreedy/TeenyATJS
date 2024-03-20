/*
*   Simple assembler written by Noah Breedy 
*   Started on 3/19/2024  [1:35pm]
*   Version: 1.0.0 done on 3/19/2024 [11:03pm]
*   Currently the syntax is opcode reg1 , reg2 + immed
*   
*   Some problems ive encountered are random nop being injected in the binary
*   This shouldnt however actually affect anything
*   
*   Still needs testing and wont produce exactly the same binaries as the C
*   version of the assembler but will still give exactly the same output
*   
*   This assembler will not give out any errors and will attempt to compile 
*   your binary regardless. This can result in some wony output if you were
*   to write an invalid assembly syntax
*   
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

const MAX_LABEL_RESOLVER = 2;

function isRegister(name){
    return name in registers_dict;
}

function isRawLine(name){
    return name == ".raw";
}

function isLabel(name){
    return name[0] == '!';
}

function isValidLabel(name,dict){
    let len = Object.keys(dict).length;
    if(len == 0) return false;
    return name in dict;
}

function isNumber(val){
   return !isNaN(parseInt(val))
}

function containsOnlySpaces(inputString) {
    return inputString.trim() === '';
}

function dec2bin(dec) {
    return (dec >>> 0).toString(2).padStart(16, '0');
}

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
    let lable_tracker = {};

    let binary_image = [];


    // Need to do this loop at least twice to account for the proper addresses
    for(var label_resolver = 0; label_resolver < MAX_LABEL_RESOLVER; label_resolver++){
        binary_image = [];
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
                let tokens = [];
                for(var i = 0; i < raw_tokens.length; i++){
                    let current_token = raw_tokens[i];
                    if(!containsOnlySpaces(current_token)){
                        tokens.push(current_token);
                    }
                }
                let token_length = tokens.length;
                console.log(tokens);
                /* Handle Raw Lines */
                if(isRawLine(tokens[0])){
                    for(let i = 1; i < token_length; i++){

                        if(isValidLabel(tokens[i],lable_tracker)){
                           binary_image.push(lable_tracker[tokens[i]]);
                        }else if(isNumber(tokens[i])){
                            binary_image.push(parseInt(tokens[i]));
                        }      
                        address_number++;
                    }
                    continue;
                }

                //                     11  10  7   4     0   << shift_positions
                //                  0b00000_0_000_000_0000
                let word_encoding = 0b0000000000000000;
                
                /* For now im only handeling opcodes lables and variables later */
                let opcode = tokens[0];

                /* Remember to change the assembly if the opcode is pseudo (JMP instructions)*/
                if(opcode in opcodes_dict){
                    word_encoding |= ((opcodes_dict[opcode]) << 11) & 0xFFFF;
                }

                let teeny = 0;
                let reg1 = 0
                let reg2 = registers_dict['rz'];
                let immed = 0;

                /*
                *    This is where we will process line tokens
                */
                if(token_length >= 2){
                    reg1 = tokens[1];
                }

                /* maybe throw Error if reg1 null */
                if(reg1 in registers_dict){
                    word_encoding |= ((registers_dict[reg1]) << 7) & 0xFFFF;
                }

                if(token_length == 1){
                     /* 
                            1 means that its in the style of either
                            opcode 
                            label 
                    */

                    /*  handle the RET pseudo isntrustion here */
                    if(tokens[0] in ret_pseudo_dict){
                        teeny = 1;
                        word_encoding |= ((opcodes_dict["pop"]) << 11) & 0xFFFF;
                        word_encoding |= ((registers_dict["pc"]) << 7) & 0xFFFF;
                        word_encoding |= ((registers_dict["pc"]) << 4) & 0xFFFF;
                    }

                    if(isLabel(tokens[0])){
                        if(!(tokens[0] in lable_tracker)){
                            lable_tracker[tokens[0]] = address_number;
                            console.log(lable_tracker);
                        }
                        continue;
                    }      
                }else if(token_length == 2){

                         /* 
                            2 means that its in the style of either
                            opcode register
                            opcode immed 
                        */
                        
                        if(opcode == "dly" || opcode == "cal"){
                            /* Have it default teeny as it wont process labels right other wise */
                            teeny = 1;
                            if(isValidLabel(reg1,lable_tracker)){
                                immed = lable_tracker[reg1];
                            }else if(isNumber(reg1)){
                                immed = parseInt(reg1);
                            }else if(isRegister(reg1)){
                                immed = 0;
                                word_encoding |= ((registers_dict[reg1]) << 4) & 0xFFFF;
                            }
                            
                            if(!(immed >= -8 && immed <= 7) && typeof immed !== 'undefined'){
                                teeny = 0;
                            }
                            word_encoding |= ((registers_dict["rz"]) << 7) & 0xFFFF; 
                        }

                        /* handles JUMP Instructions */
                        if(opcode in jmp_pseudo_inst_dict){

                            if(isValidLabel(tokens[1],lable_tracker)){
                                immed = lable_tracker[tokens[1]];
                            }else if(isNumber(tokens[1])){
                                immed = parseInt(tokens[1]);
                            }

                            word_encoding |= ((opcodes_dict["jmp"]) << 11) & 0xFFFF;
                            word_encoding |= (jmp_pseudo_inst_dict[opcode] << 0) & 0xF;
                        }

                        /* handles INC & DEC Instructions */
                        if(opcode in inc_dec_pseudo_inst_dict){
                            immed = 1;
                            teeny = 1;
                            word_encoding |= ((registers_dict["rz"]) << 4) & 0xFFFF; 
                            word_encoding |= ((inc_dec_pseudo_inst_dict[opcode]) << 11) & 0xFFFF;
                        }

                        // This is like this since you can only pop from a register
                        if(opcode == "pop"){
                            teeny = 1;
                            immed = 0;
                            word_encoding |= ((registers_dict[reg1]) << 7) & 0xFFFF;
                        }

                        if(opcode == "psh"){
                            if(!isValidLabel(tokens[1],lable_tracker)){
                                // default zero because if its not a number its a register
                                immed = 0;
                                if(isNumber(tokens[1])){
                                    immed = parseInt(tokens[1]);
                                }
                            }else if(isValidLabel(tokens[1],lable_tracker)){
                                immed = lable_tracker[1];
                            }
                            if((immed >= -8 && immed <= 7)){
                                teeny = 1;
                            }
                        }

                }
                else if(token_length == 3){
                    /* 
                        3 means that its in the style of either
                        opcode r1, r2
                        opcode r1, immed 
                    */
                    
                    
                    reg2 = tokens[2];
                    if(reg2 in lable_tracker){
                        reg2 = lable_tracker[reg2]
                    }

                    /* Handles DELAY style3 instructions */
                    if(opcode == "dly" || opcode == "cal"){
                        // put register1 into reg2 slot & zero into register 1 slot
                        word_encoding |= ((registers_dict["rz"]) << 7) & 0xFFFF; 
                        word_encoding |= ((registers_dict[reg1]) << 4) & 0xFFFF;  
                    }

                    if(isValidLabel(reg2,lable_tracker)){
                        immed = lable_tracker[reg2];
                        if(opcode != "dly" || opcode == "cal"){
                            word_encoding |= ((registers_dict["rz"]) << 4) & 0xFFFF; 
                        }
                        if(immed >= -8 && immed <= 7){
                            teeny = 1;
                        }
                    }else if(isNumber(reg2)){
                        immed = parseInt(reg2);
                        if(opcode != "dly" || opcode == "cal"){
                            word_encoding |= ((registers_dict["rz"]) << 4) & 0xFFFF; 
                        }
                        if(immed >= -8 && immed <= 7){
                            teeny = 1;
                        }

                    }else{
                        
                        if(reg2 in registers_dict){
                            if(opcode != "dly" || opcode == "cal"){
                                word_encoding |= ((registers_dict[reg2]) << 4) & 0xFFFF; 
                            } 
                        }
                        
                        immed = 0;
                        teeny = 1;
                    }

                    /* this is here to account for JUMP label resolution */
                    if(opcode in jmp_pseudo_inst_dict || opcode == "jmp"){
                       if(!isValidLabel(tokens[2],lable_tracker)){
                            immed = 0;
                            teeny = 1;
                       }else if(isValidLabel(tokens[2],lable_tracker)){
                            teeny = 0;
                            immed = lable_tracker[tokens[2]];
                       }
                    }

                    /* STORE logic is flipped */
                    if(opcode == "str"){
                        teeny = 0;
                        immed = 0;
                        if(isValidLabel(reg1,lable_tracker)){
                            immed = lable_tracker[reg1]
                            word_encoding |= ((registers_dict["rz"]) << 7) & 0xFFFF; 
                        }else if(isNumber(reg1)){
                            immed = parseInt(reg1);
                            word_encoding |= ((registers_dict["rz"]) << 7) & 0xFFFF; 
                        }

                        if(immed >= -8 && immed <= 7){
                            teeny = 1;
                        }

                        reg2 = tokens[2];
                        if(isRegister(reg2)){
                            word_encoding |= ((registers_dict[reg2]) << 4) & 0xFFFF; 
                        }
                        
                    }
                    

                }else if(token_length == 4){
                    /* 
                        4 means that its in the style of 
                        opcode r1, r2 + immed
                    */
                    reg2 = tokens[2];
                    if(reg2 in registers_dict){
                        word_encoding |= ((registers_dict[reg2]) << 4) & 0xFFFF;  
                    }
                    
                    if(isValidLabel(tokens[3],lable_tracker)){
                        immed = lable_tracker[tokens[3]]
                    }else if(isNumber(tokens[3])){
                        immed = parseInt(tokens[3]);
                    }

                    if(immed >= -8 && immed <= 7){
                        teeny = 1;
                    }

                    /* STORE logic is flipped */
                    if(opcode == "str"){
                        teeny = 0;
                        immed = 0;
                        if(isValidLabel(tokens[2],lable_tracker)){
                            immed = lable_tracker[tokens[2]]
                        }else if(isNumber(tokens[2])){
                            immed = parseInt(tokens[2]);
                        }
                
                        if(immed >= -8 && immed <= 7){
                            teeny = 1;
                        }
                        console.log(immed,teeny)
                        reg2 = tokens[3];
                        if(isRegister(reg2)){
                            word_encoding |= ((registers_dict[reg2]) << 4) & 0xFFFF; 
                        }
                        
                    }

                }

                word_encoding |= (teeny << 10) & 0xFFFF;
                if(teeny){
                    word_encoding |= (immed << 0) & 0xF;
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
                }

                address_number++;
        }
    }
    console.table(binary_image);
    const binaryData = new Uint16Array(binary_image);
    console.log(binaryData);
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
}