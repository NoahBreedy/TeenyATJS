function get_val(x){
  let x_val = x.value
  if(x.type == "s"){
    if(!x.positive){ 
       x_val = negate(x.value,x.size);
       x_val *= -1;
    }
  }
  return x_val;
}
function dec2bin(dec) {
    return (dec >>> 0).toString(2);
}
  
 const get_all_ones = (bits) => {
    if(bits == 4)  return  0xF;
    if(bits == 16) return  0xFFFF;
    if(bits == 32) return  0xFFFFFFFF;
    return 0;
} 

 const bit_test = (num,bit) => {
        return ((num>>bit) % 2 != 0)
}
  
 const bit_set = (num,bit) =>{
        return num | 1<<bit;
}
  
 const bit_clear = (num,bit) =>{
        return num & ~(1<<bit);
}
  
 const bit_toggle = (num,bit) =>{
      return bit_test(num, bit) ? bit_clear(num, bit) : bit_set(num, bit);
}
  
// 2s complement negation
const negate = (num,bit) => {
      for(var i = 0; i < bit-1; i++){
            num = bit_toggle(num,i);
      }
      return (num+1);
}
  
// Everything is auto casted to the bigger integer
const add = (a,b) => {
    let size = a.size >= b.size ? a.size : b.size;
    let a_val = get_val(a);
    let b_val = get_val(b);
    let val = (a_val + b_val) & get_all_ones(size);
    return val;
}

const sub = (a,b) => {
    let size = a.size >= b.size ? a.size : b.size;
    let a_val = get_val(a);
    let b_val = get_val(b);
    let val = (a_val - b_val) & get_all_ones(size);
    return val;
}

const mul = (a,b) => {
    let size = a.size >= b.size ? a.size : b.size;
    let a_val = get_val(a);
    let b_val = get_val(b);
    let val = (a_val * b_val) & get_all_ones(size);
    return val;
}

const div = (a,b) => {
    let size = a.size >= b.size ? a.size : b.size;
    let a_val = get_val(a);
    let b_val = get_val(b);
    let val = (a_val / b_val) & get_all_ones(size);
    return val;
}

const mod = (a,b) => {
  let size = a.size >= b.size ? a.size : b.size;
  let a_val = get_val(a);
  let b_val = get_val(b);
  let val = (a_val % b_val) & get_all_ones(size);
  return val;
}

const and = (a,b) => {
  let size = a.size >= b.size ? a.size : b.size;
  let a_val = get_val(a);
  let b_val = get_val(b);
  let val = (a_val & b_val) & get_all_ones(size);
  return val;
}

const or = (a,b) => {
  let size = a.size >= b.size ? a.size : b.size;
  let a_val = get_val(a);
  let b_val = get_val(b);
  let val = (a_val | b_val) & get_all_ones(size);
  return val;
}

const xor = (a,b) => {
  let size = a.size >= b.size ? a.size : b.size;
  let a_val = get_val(a);
  let b_val = get_val(b);
  let val = (a_val ^ b_val) & get_all_ones(size);
  return val;
}

function printINT(a){
    let val = a.value;
    if(a.type == "s"){
      if(!a.positive){ 
         val = negate(a.value,a.size);
         val *= -1;
      }
    }
    console.log(val);
}
  
function INT32(val){
    this.size = 32;
    this.type = "s";
    this.positive = (val & 0x80000000) == 0;
    this.value    = (val & 0x7FFFFFFF);
    this.svalue = this.value
    if(!this.positive){ 
        this.svalue = negate(this.value,this.size);
        this.svalue *= -1;
    }

};

function UINT32(val){
    this.size = 32;
    this.type = "u";
    this.value  = (val & 0xFFFFFFFF);
};
  
function INT16(val){
    this.size = 16;
    this.type = "s";
    this.positive = (val & 0b1000000000000000) == 0;
    this.value    = (val & 0b0111111111111111);
    this.svalue = this.value
    if(!this.positive){ 
        this.svalue = negate(this.value,this.size);
        this.svalue *= -1;
    }
};
  
function UINT16(val){
    this.size = 16;
    this.type = "u";
    this.value = (val & 0b1111111111111111);
};

function INT4(val){
    this.size = 4;
    this.type = "s";
    this.positive = (val & 0b1000) == 0;
    this.value    = (val & 0b0111);
    this.svalue = this.value
    if(!this.positive){ 
        this.svalue = negate(this.value,this.size);
        this.svalue *= -1;
    }
};

function UINT4(val){
    this.size = 4;
    this.type = "u";
    this.value = (val & 0b1111);
};

export {
    printINT,
    INT32,UINT32,
    INT16,UINT16,
    INT4,UINT4,
    add,sub,mul,div,mod,
    negate,and,or,xor,
    bit_toggle,bit_set,bit_test,bit_clear
  }