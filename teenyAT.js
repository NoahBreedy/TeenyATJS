/*
 * Name    : teenyat.js
 * Origional Author  : William "Amos" Confer
 * Transposer: Noah Breedy
 *
 * License : Copyright (C) 2023 All rights reserved
 */ 
import * as BitManip from './utils.js'; 

const TNY_RAM_SIZE = (1 << 15);
const TNY_MAX_RAM_ADDRESS = (TNY_RAM_SIZE - 1);
const TNY_BUS_DELAY = 3

// Define opcodes as constants
const TNY_OPCODE_SET = 0;
const TNY_OPCODE_LOD = 1;
const TNY_OPCODE_STR = 2;
const TNY_OPCODE_PSH = 3;
const TNY_OPCODE_POP = 4;
const TNY_OPCODE_BTS = 5;
const TNY_OPCODE_BTC = 6;
const TNY_OPCODE_BTF = 7;
const TNY_OPCODE_CAL = 8;
const TNY_OPCODE_ADD = 9;
const TNY_OPCODE_SUB = 10;
const TNY_OPCODE_MPY = 11;
const TNY_OPCODE_DIV = 12;
const TNY_OPCODE_MOD = 13;
const TNY_OPCODE_AND = 14;
const TNY_OPCODE_OR  = 15;
const TNY_OPCODE_XOR = 16;
const TNY_OPCODE_SHF = 17;
const TNY_OPCODE_ROT = 18;
const TNY_OPCODE_NEG = 19;
const TNY_OPCODE_CMP = 20;
const TNY_OPCODE_JMP = 21;
const TNY_OPCODE_DJZ = 22;
const TNY_OPCODE_DLY = 23;

// Define register indices as constants
const TNY_REGISTER_COUNT = 8;
const TNY_REG_PC   = 0;
const TNY_REG_SP   = 1;
const TNY_REG_ZERO = 2;
const TNY_REG_A    = 3;
const TNY_REG_B    = 4;
const TNY_REG_C    = 5;
const TNY_REG_D    = 6;
const TNY_REG_E    = 7;

function TeenyAT(){
    this.PROGRAM_RAM_SIZE = TNY_RAM_SIZE;
    this.PROGRAM_MAX_RAM_ADDRESS = (this.PROGRAM_RAM_SIZE - 1);
    this.reg = new Array(8);
    for(var i = 0; i < 8; i++){
        this.reg[i] = {u:new BitManip.UINT16(0) , s:new BitManip.INT16(0)}
    }
    this.flags = {
        carry: 0,
        equals: 0,
        less: 0,
        greater: 0,
      };
    
    this.ram = new Array(0x8000).fill({ u: 0, s: 0}); // RAM
    this.bin_image = new Array(0x8000).fill({ u: 0, s: 0}); // Binary Image
    this.bus_read = null;
    this.bus_write = null;
    this.initialized = false;
    this.delay_cycles = 0;
    this.cycle_cnt = 0;
    
    this.extra_data = null;

    this.set_elg_flags = (alu_result) => {
        this.flags.equals = (alu_result == 0) ? 1 : 0;
        this.flags.less = alu_result & (1 << 15);
        this.flags.greater = (alu_result > 0) ? 1 : 0;
    };

    this.trunc_pc = () =>{
        this.reg[TNY_REG_PC].u.value &= TNY_MAX_RAM_ADDRESS;
    };

    this.set_pc = (addr) => {
       this.reg[TNY_REG_PC].u = new BitManip.UINT16(addr);
       this.trunc_pc();
    }

    this.inc_pc = () => {
      this.set_pc(BitManip.add(this.reg[TNY_REG_PC].u, new BitManip.INT16(1)));
    }

    this.dec_pc = () => {
      this.set_pc(BitManip.add(this.reg[TNY_REG_PC].u, new BitManip.INT16(-1)));
    }

    this.tny_init_from_file = (bin_file,bus_read,bus_write) => {
        if(!bus_read || !bus_write) return false;
        if (!this || !bin_file) return false;

        // Clear the tny instance
        this.reg = new Array(8);
        for(var i = 0; i < 8; i++){
            this.reg[i] = {u:new BitManip.UINT16(0) , s:new BitManip.INT16(0)}
        }
        this.flags = {
            carry: 0,
            equals: 0,
            less: 0,
            greater: 0,
        };
        this.ram = new Array(0x8000).fill({ u: 0, s: 0}); // RAM
        this.bin_image = new Array(0x8000).fill({ u: 0, s: 0}); // Binary Image
        this.bus_read = null;
        this.bus_write = null;
        this.initialized = false;
        this.delay_cycles = 0;
        this.cycle_cnt = 0;

        // Decode our bin_file into readable hex
      const hexString = Array.from(bin_file.slice(0, 0x7999))
        .map(byte => byte.toString(16).padStart(4, '0'))
        .join(' ');
      console.log(hexString);
      var rom_length = (hexString.split(" ").length);
      
      this.PROGRAM_RAM_SIZE = rom_length;
      this.PROGRAM_MAX_RAM_ADDRESS = (this.PROGRAM_RAM_SIZE - 1);
      // Backup .bin file
      this.bin_image = hexString.split(" ");
      
      // Store bus callbacks
      this.bus_read = bus_read;
      this.bus_write = bus_write;

      if (!this.tny_reset()) return false;
      
      this.initialized = true;
  
      return true;

    };

    this.swap_endian = (bin_data) => {
      var index = 0;
      for(var i = 0; i < bin_data.length; i++){
          this.ram[index] = {u:new BitManip.UINT16(parseInt("0x" + bin_data[i])),
                             s:new BitManip.INT16(parseInt("0x" + bin_data[i]))};
          index++;
      }
    };

    this.tny_reset = () =>{
        if(!this) return false
        // Restore RAM to its initial post-bin-load state with endianness kept in mind
        this.swap_endian(this.bin_image);
        for(var i = 0; i < TNY_REGISTER_COUNT; i++){
          this.reg[i] = {u:new BitManip.UINT16(0) , s:new BitManip.INT16(0)}
        }
        this.reg[TNY_REG_SP] = {u:new BitManip.UINT16(0x7FFF) , s:new BitManip.INT16(0x7FFF)}
        this.flags = {
          carry: 0,
          equals: 0,
          less: 0,
          greater: 0,
        };
        this.delay_cycles = 0;
        this.cycle_cnt = 0;
        return true;
    };

    this.tny_clock = () =>{
        this.cycle_cnt++;
      
        if(this.delay_cycles){
          this.delay_cycles--;
          return;
        }

        this.trunc_pc();
        const orig_PC = this.reg[TNY_REG_PC].u.value;

        // Doing some funky bit operations since there are no unions in JS :(
        let IR = this.ram[this.reg[TNY_REG_PC].u.value];
        const opcode = (IR.u.value & 0b1111100000000000) >> 11;
        const teeny = (IR.u.value  & 0b0000010000000000) >> 10;
        const reg1 = (IR.u.value   & 0b0000001110000000) >> 7;
        const reg2 = (IR.u.value   & 0b0000000001110000) >> 4;
        const equals = (IR.u.value & 0b0000000000000100) >> 2;
        const less =   (IR.u.value & 0b0000000000000010) >> 1;
        const greater =(IR.u.value & 0b0000000000000001) >> 0;
        
        this.inc_pc();
        IR = this.ram[this.reg[TNY_REG_PC].u.value];
        let immed = IR;
        let tmp;

        if (teeny) {
          this.dec_pc();
          IR = this.ram[this.reg[TNY_REG_PC].u.value];
          let val = (IR.u.value & 0b0000000000001111) >> 0;
          immed = {u:new BitManip.UINT4(val), s:new BitManip.INT4(val)};
        } else {
          this.delay_cycles++;
        }
 
        this.inc_pc();
        //console.log(opcode,teeny,reg1,reg2,immed);
        //console.log(equals,less,greater);
        switch(opcode){
          case TNY_OPCODE_SET:
            //  console.log(opcode,teeny,reg1,reg2,immed);
            this.reg[reg1].s = new BitManip.INT16(BitManip.add(this.reg[reg2].s,immed.s)); 
            this.reg[reg1].u = new BitManip.UINT16(BitManip.add(this.reg[reg2].u,immed.s)); 
            break;  
          case TNY_OPCODE_LOD:{
            const addr = new BitManip.UINT16(BitManip.add(this.reg[reg2].s, immed.s));
            if(addr.value > TNY_MAX_RAM_ADDRESS){
              /* read from peripheral address */
              let data = {u:new BitManip.UINT16(0), s:new BitManip.INT16(0)};
              let delay = 0;
              let result = this.bus_read(addr.value);
              if(result != null){
                  data = {u:new BitManip.UINT16(result.data), s:new BitManip.INT16(result.data)};
                  delay = result.delay;
              }
              this.reg[reg1] = data;
              this.delay_cycles += delay;
            }else{
              this.reg[reg1] = this.ram[addr.value];
            }
            this.delay_cycles += TNY_BUS_DELAY;
          }
          break;
          case TNY_OPCODE_STR:{
            const addr = new BitManip.UINT16(BitManip.add(this.reg[reg1].s, immed.s));
            if(addr.value > TNY_MAX_RAM_ADDRESS){
              /* read from peripheral address */
              let data = {u:new BitManip.UINT16(0), s:new BitManip.INT16(0)};
              let delay = 0;
              let result = this.bus_write(addr.value,this.reg[reg2].u.value);
              if(result != null){
                  data = {u:new BitManip.UINT16(result.data), s:new BitManip.INT16(result.data)};
                  delay = result.delay;
              }
              this.delay_cycles += delay;
            }else{
              this.reg[reg2] = this.ram[addr.value];
            }
            this.delay_cycles += TNY_BUS_DELAY;
          }
          break;
          case TNY_OPCODE_PSH:{
             this.reg[TNY_REG_SP].u.value &= TNY_MAX_RAM_ADDRESS;
             this.ram[this.reg[TNY_REG_SP].u.value].u = new BitManip.UINT16(BitManip.add(this.reg[reg2].s,immed.s));
             // Decrement SP
             this.reg[TNY_REG_SP].u = new BitManip.UINT16(BitManip.sub(this.reg[TNY_REG_SP].u,new BitManip.UINT16(1)));
             this.reg[TNY_REG_SP].u.value &= TNY_MAX_RAM_ADDRESS;
             this.delay_cycles += TNY_BUS_DELAY;
          }
          break;
          case TNY_OPCODE_POP:{
            this.reg[TNY_REG_SP].u = new BitManip.UINT16(BitManip.add(this.reg[TNY_REG_SP].u,new BitManip.UINT16(1)));
            this.reg[TNY_REG_SP].u.value &= TNY_MAX_RAM_ADDRESS;
            this.reg[reg1] = this.ram[this.reg[TNY_REG_SP].u.value]
            this.delay_cycles += TNY_BUS_DELAY;
          }
          break;
          case TNY_OPCODE_BTS:{
             const bit = new BitManip.INT16(this.reg[reg2].s,immed.s);
             if(bit >= 0 && bit <= 15) {
                this.reg[reg2].s = new BitManip.INT16(this.reg[reg2].s.svalue | (1<<bit));
                this.set_elg_flags(this.reg[reg2].s.svalue);
             }
          }
          break;
          case TNY_OPCODE_BTC: {
            const bit = new BitManip.INT16(this.reg[reg2].s,immed.s);
            if(bit >= 0 && bit <= 15) {
               this.reg[reg2].s = new BitManip.INT16(this.reg[reg2].s.svalue & ~(1<<bit));
               this.set_elg_flags(this.reg[reg2].s.svalue);
            }
          }
          break;
          case TNY_OPCODE_BTF: {
            const bit = new BitManip.INT16(this.reg[reg2].s,immed.s);
            if(bit >= 0 && bit <= 15) {
               this.reg[reg2].s = new BitManip.INT16(this.reg[reg2].s.svalue ^ (1<<bit));
               this.set_elg_flags(this.reg[reg2].s.svalue);
            }
          } 
          break;
          case TNY_OPCODE_CAL: {
            this.reg[TNY_REG_SP].u.value &= TNY_MAX_RAM_ADDRESS;
            this.ram[this.reg[TNY_REG_SP].u.value] = this.reg[TNY_REG_PC];
            // Decrement SP
            this.reg[TNY_REG_SP].u = new BitManip.UINT16(BitManip.sub(this.reg[TNY_REG_SP].u,new BitManip.UINT16(1)));
            this.reg[TNY_REG_SP].u.value &= TNY_MAX_RAM_ADDRESS;
            set_pc(BitManip.add(this.reg[reg2].s,immed.s));
            this.delay_cycles += TNY_BUS_DELAY;
          }
          break;
          case TNY_OPCODE_ADD: {
            tmp = new BitManip.INT16(BitManip.add(this.reg[reg2].s,immed.s)); 
            this.reg[reg1].s = new BitManip.INT16(BitManip.add(this.reg[reg1].s,tmp));                
            this.reg[reg1].u = new BitManip.UINT16(BitManip.add(this.reg[reg1].s,tmp)); 
            this.set_elg_flags(this.reg[reg1].s.svalue);
          }
          break;
          case TNY_OPCODE_SUB: {
            tmp = new BitManip.INT16(BitManip.add(this.reg[reg2].s,immed.s)); 
            this.reg[reg1].s = new BitManip.INT16(BitManip.sub(this.reg[reg1].s,tmp));                
            this.reg[reg1].u = new BitManip.UINT16(BitManip.sub(this.reg[reg1].s,tmp)); 
            this.set_elg_flags(this.reg[reg1].s.svalue);
          }
          break;
          case TNY_OPCODE_MPY: {
            tmp = new BitManip.INT16(BitManip.add(this.reg[reg2].s,immed.s)); 
            this.reg[reg1].s = new BitManip.INT16(BitManip.mul(this.reg[reg1].s,tmp));                
            this.reg[reg1].u = new BitManip.UINT16(BitManip.mul(this.reg[reg1].s,tmp)); 
            this.set_elg_flags(this.reg[reg1].s.svalue);
          }
          break;
          case TNY_OPCODE_DIV: {
            tmp = new BitManip.INT16(BitManip.add(this.reg[reg2].s,immed.s)); 
            // No behavior on divide by zero
            if(tmp.svalue != 0){
              this.reg[reg1].s = new BitManip.INT16(BitManip.div(this.reg[reg1].s,tmp));                
              this.reg[reg1].u = new BitManip.UINT16(BitManip.div(this.reg[reg1].s,tmp)); 
              this.set_elg_flags(this.reg[reg1].s.svalue);
            }
          }
          break;
          case TNY_OPCODE_MOD: {
            tmp = new BitManip.INT16(BitManip.add(this.reg[reg2].s,immed.s)); 
            // No behavior on divide by zero
            if(tmp.svalue != 0){
              this.reg[reg1].s = new BitManip.INT16(BitManip.mod(this.reg[reg1].s,tmp));                
              this.reg[reg1].u = new BitManip.UINT16(BitManip.mod(this.reg[reg1].s,tmp)); 
              this.set_elg_flags(this.reg[reg1].s.svalue);
            }
          }
          break;
          case TNY_OPCODE_AND:{
            tmp = new BitManip.INT16(BitManip.add(this.reg[reg2].s,immed.s));
            this.reg[reg1].s = new BitManip.INT16(BitManip.and(this.reg[reg1].s,tmp));
            this.reg[reg1].u = new BitManip.UINT16(BitManip.and(this.reg[reg1].s,tmp));
		        this.set_elg_flags(this.reg[reg1].s.svalue);
          }
          break;
          case TNY_OPCODE_OR:{
            tmp = new BitManip.INT16(BitManip.add(this.reg[reg2].s,immed.s));
            this.reg[reg1].s = new BitManip.INT16(BitManip.or(this.reg[reg1].s,tmp));
            this.reg[reg1].u = new BitManip.UINT16(BitManip.or(this.reg[reg1].s,tmp));
		        this.set_elg_flags(this.reg[reg1].s.svalue);
          }
          break;
          case TNY_OPCODE_XOR:{
            tmp = new BitManip.INT16(BitManip.add(this.reg[reg2].s,immed.s));
            this.reg[reg1].s = new BitManip.INT16(BitManip.xor(this.reg[reg1].s,tmp));
            this.reg[reg1].u = new BitManip.UINT16(BitManip.xor(this.reg[reg1].s,tmp));
		        this.set_elg_flags(this.reg[reg1].s.svalue);
          }
          break;
          case TNY_OPCODE_SHF: {
              let bts = new BitManip.INT16(BitManip.add(this.reg[reg2].s,immed.s));
              if(!bts.positive){
                  /* shift left */
                  bts.svalue *= -1;
                  if(bts.svalue <= 15){
                    this.reg[reg1].u = new BitManip.UINT16(this.reg[reg1].u.value << (bts.svalue-1));
                    this.reg[reg1].u = new BitManip.UINT16(this.reg[reg1].u.value << (1));
                    this.reg[reg1].s = new BitManip.INT16(this.reg[reg1].u.value);
                  }else{
                    this.reg[reg1].s = new BitManip.INT16(0);
                    this.reg[reg1].u = new BitManip.UINT16(0);
                  }

              }else if(bts.positive){
                    /* shift right */
                    if(bts.svalue <= 15){
                      this.reg[reg1].u = new BitManip.UINT16(this.reg[reg1].u.value >> (bts.svalue-1));
                      this.reg[reg1].u = new BitManip.UINT16(this.reg[reg1].u.value >> (1));
                      this.reg[reg1].s = new BitManip.INT16(this.reg[reg1].u.value);
                    }else{
                      this.reg[reg1].s = new BitManip.INT16(0);
                      this.reg[reg1].u = new BitManip.UINT16(0);
                    }
              }
              this.set_elg_flags(this.reg[reg1].s.svalue);
          }
          break;
          case TNY_OPCODE_ROT: {
             // Arnt the value of modulos always positive?
          }
          break;
          case TNY_OPCODE_NEG:{
            tmp = new BitManip.INT16(BitManip.sub(new BitManip.INT16(0),this.reg[reg1].s));
            this.reg[reg1].s = tmp;
            this.reg[reg1].u = new BitManip.UINT16(tmp.svalue);
            this.set_elg_flags(this.reg[reg1].s.svalue);
          }
          break;
          case TNY_OPCODE_CMP:{
            tmp = new BitManip.INT16(BitManip.add(this.reg[reg2].s,immed.s));
            tmp = new BitManip.INT16(BitManip.sub(this.reg[reg1].s,tmp));
            this.set_elg_flags(tmp.svalue); 
          }
          break;
          case TNY_OPCODE_JMP:{
            let flags_checked = 0;
            let condition_satisfied = 0;
            
            if(equals) {
                  flags_checked = true;
                  condition_satisfied |= this.flags["equals"];
            }
            if(less) {
                flags_checked = true;
                condition_satisfied |= this.flags["less"];
            }
            if(greater) {
                flags_checked = true;
                condition_satisfied |= this.flags["greater"];
            }
            if(!flags_checked || condition_satisfied) {
                tmp = new BitManip.INT16(BitManip.add(this.reg[reg1].s,immed.s));
                this.set_pc(tmp.svalue);
            }
          }
          break;
          case TNY_OPCODE_DJZ:{
              tmp = new BitManip.INT16(BitManip.sub(this.reg[reg1].s,new BitManip.INT16(1)));
              this.reg[reg1].s = tmp;
              this.set_elg_flags(this.reg[reg1].s.svalue);
              if(tmp.svalue == 0){
                  tmp = new BitManip.INT16(BitManip.add(this.reg[reg2].s,immed.s));
                  this.set_pc(tmp.svalue);
              }
          }
          break;
          case TNY_OPCODE_DLY:{
               let dly_cnt = new BitManip.INT16(BitManip.add(this.reg[reg2].s,immed.s)).svalue;
               if(dly_cnt >= 1){
                  this.delay_cycles = dly_cnt - 1;
               }
          }
          break;
          default:
            console.log("UNKNOWN OPCODE");
        }

        // Ensure register zero has zero in it
        this.reg[TNY_REG_ZERO].u = new BitManip.UINT16(0);
        this.reg[TNY_REG_ZERO].s = new BitManip.INT16(0);
    };
    
};

export default TeenyAT